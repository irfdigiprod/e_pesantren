import type { ServerWebSocket } from "bun";
import { db } from "./db";
import {
  conversations,
  conversationParticipants,
  messages,
  messageAttachments,
  messageReactions,
  messageReadStatus,
} from "./db/schema/chat";
import { users } from "./db/schema/users";
import { verifyToken, type JWTPayload } from "./utils/jwt";
import { wsMessageSchema } from "./validators/chat";
import { eq, and, isNull, inArray } from "drizzle-orm";

// Store connected clients: userId -> Set of WebSocket connections
const connectedClients = new Map<number, Set<ServerWebSocket<WebSocketData>>>();

// Store user's active conversations for efficient broadcasting
const userConversations = new Map<number, Set<number>>();

export interface WebSocketData {
  userId: number;
  email: string;
  role: string;
}

// ============================================
// CONNECTION MANAGEMENT
// ============================================

function addClient(userId: number, ws: ServerWebSocket<WebSocketData>) {
  if (!connectedClients.has(userId)) {
    connectedClients.set(userId, new Set());
  }
  connectedClients.get(userId)!.add(ws);
}

function removeClient(userId: number, ws: ServerWebSocket<WebSocketData>) {
  const clients = connectedClients.get(userId);
  if (clients) {
    clients.delete(ws);
    if (clients.size === 0) {
      connectedClients.delete(userId);
    }
  }
}

function isUserOnline(userId: number): boolean {
  const clients = connectedClients.get(userId);
  return clients !== undefined && clients.size > 0;
}

function getOnlineUsers(): number[] {
  return Array.from(connectedClients.keys());
}

// ============================================
// BROADCASTING
// ============================================

// Send to all connections of a specific user
export function broadcastToUser(userId: number, message: object) {
  const clients = connectedClients.get(userId);
  if (clients) {
    const data = JSON.stringify(message);
    clients.forEach((ws) => {
      try {
        ws.send(data);
      } catch (error) {
        console.error(`Failed to send to user ${userId}:`, error);
      }
    });
  }
}

// Alias for broadcastToConversation
export const broadcastToGroup = broadcastToConversation;

// Send to all participants of a conversation
export async function broadcastToConversation(
  conversationId: number,
  message: object,
  excludeUserId?: number
) {
  try {
    // Get all joined participants (not invited)
    const participants = await db
      .select({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          isNull(conversationParticipants.leftAt),
          eq(conversationParticipants.status, "joined")
        )
      );

    const data = JSON.stringify(message);

    participants.forEach(({ userId }) => {
      if (excludeUserId && userId === excludeUserId) return;

      const clients = connectedClients.get(userId);
      if (clients) {
        clients.forEach((ws) => {
          try {
            ws.send(data);
          } catch (error) {
            console.error(`Failed to broadcast to user ${userId}:`, error);
          }
        });
      }
    });
  } catch (error) {
    console.error("Broadcast error:", error);
  }
}

// Broadcast user profile update to all shared conversations
export async function broadcastUserProfileUpdate(
  userId: number,
  userData: any
) {
  try {
    // Find all conversations this user is participant of
    const participations = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.userId, userId),
          isNull(conversationParticipants.leftAt),
          eq(conversationParticipants.status, "joined")
        )
      );

    const message = {
      type: "user_profile_updated",
      data: userData,
    };

    // Broadcast to each conversation
    // Set ensures we don't send multiple times if user is in multiple common groups?
    // Actually broadcastToConversation sends to users.
    // Optimization: Get distinct users from all those conversations and send directly?
    // Reuse broadcastToConversation is easier but might send duplicates if shared multiple groups?
    // Current implementation of broadcastToConversation sends to WebSocket connections.
    // If I call it multiple times for different conversations, and User B is in both Conv 1 and Conv 2 with User A,
    // User B will receive the event twice.
    // Better: Get all unique userIds from all conversations and broadcastToUser.

    const relevantConversationIds = participations.map((p) => p.conversationId);

    if (relevantConversationIds.length === 0) return;

    const allParticipants = await db
      .selectDistinct({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(
        and(
          inArray(
            conversationParticipants.conversationId,
            relevantConversationIds
          ),
          isNull(conversationParticipants.leftAt),
          eq(conversationParticipants.status, "joined")
        )
      );

    const uniqueUserIds = allParticipants
      .map((p) => p.userId)
      .filter((id) => id !== userId);

    // Send to each user
    const msgString = JSON.stringify(message);
    uniqueUserIds.forEach((targetId) => {
      const clients = connectedClients.get(targetId);
      if (clients) {
        clients.forEach((ws) => ws.send(msgString));
      }
    });
  } catch (error) {
    console.error("Broadcast profile update error:", error);
  }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

async function handleNewMessage(
  ws: ServerWebSocket<WebSocketData>,
  data: {
    conversationId: number;
    content?: string;
    messageType?: string;
    replyToId?: number;
    attachmentFiles?: Array<{
      fileName: string;
      originalName: string;
      filePath: string;
      fileType: string;
      fileSize: number;
      mimeType: string;
    }>;
    isSigned?: boolean;
  }
) {
  const { userId, email } = ws.data;
  const {
    conversationId,
    content,
    messageType = "text",
    replyToId,
    attachmentFiles,
    isSigned,
  } = data;

  try {
    // Verify user is participant
    const isParticipant = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
        isNull(conversationParticipants.leftAt)
      ),
    });

    if (!isParticipant) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Not a participant of this conversation" },
        })
      );
      return;
    }

    // Check if group is locked (only admins can send when locked)
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (conversation?.isLocked && isParticipant.role !== "admin") {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Group is locked. Only admins can send messages." },
        })
      );
      return;
    }

    // Validate content
    if (!content && (!attachmentFiles || attachmentFiles.length === 0)) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Message must have content or attachments" },
        })
      );
      return;
    }

    // Create message
    const result = await db.insert(messages).values({
      conversationId,
      senderId: userId,
      content,
      messageType: messageType as any,
      replyToId,
      isSigned: isSigned || false,
      originalSignerId: isSigned ? userId : null,
    });

    const messageId = Number(result[0].insertId);

    // Create attachment records if any files were uploaded
    const attachments: any[] = [];
    if (attachmentFiles && attachmentFiles.length > 0) {
      for (const file of attachmentFiles) {
        try {
          const attResult = await db.insert(messageAttachments).values({
            messageId,
            fileType: file.fileType as any,
            fileName: file.fileName,
            originalName: file.originalName,
            filePath: file.filePath,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
          });

          attachments.push({
            id: Number(attResult[0].insertId),
            ...file,
          });
          console.log(
            ">>> Attachment inserted successfully:",
            attResult[0].insertId
          );
        } catch (insertError) {
          console.error(">>> Attachment insert failed:", insertError);
        }
      }
    }

    // Update conversation lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // Get reply-to message if exists
    let replyTo = null;
    if (replyToId) {
      const replyMessage = await db
        .select({
          id: messages.id,
          content: messages.content,
          senderEmail: users.email,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.id, replyToId))
        .limit(1);
      replyTo = replyMessage[0] || null;
    }

    // Prepare message object
    const newMessage = {
      type: "new_message",
      data: {
        id: messageId,
        conversationId,
        senderId: userId,
        senderEmail: email,
        senderName: email, // Use email as name fallback for now
        content,
        messageType,
        replyToId,
        replyTo,
        attachments,
        reactions: {},
        isEdited: false,
        isSigned: isSigned || false,
        originalSignerName: isSigned ? email : null,
        // Format as local time (same format as database returns)
        createdAt: (() => {
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, "0");
          return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
            now.getDate()
          )}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
            now.getSeconds()
          )}.${now.getMilliseconds().toString().padStart(3, "0")}`;
        })(),
      },
    };

    // Broadcast to all participants
    await broadcastToConversation(conversationId, newMessage);
  } catch (error) {
    console.error("Handle message error:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        data: { message: "Failed to send message" },
      })
    );
  }
}

async function handleTyping(
  ws: ServerWebSocket<WebSocketData>,
  data: { conversationId: number; isTyping: boolean }
) {
  const { userId, email } = ws.data;
  const { conversationId, isTyping } = data;

  // Broadcast typing status to other participants
  await broadcastToConversation(
    conversationId,
    {
      type: "user_typing",
      data: {
        conversationId,
        userId,
        userEmail: email,
        isTyping,
      },
    },
    userId // Exclude sender
  );
}

async function handleRead(
  ws: ServerWebSocket<WebSocketData>,
  data: { conversationId: number; messageId: number }
) {
  const { userId } = ws.data;
  const { conversationId, messageId } = data;

  try {
    // Mark message as read
    try {
      await db.insert(messageReadStatus).values({
        messageId,
        userId,
      });
    } catch {
      // Ignore duplicate
    }

    // Broadcast read status
    await broadcastToConversation(
      conversationId,
      {
        type: "message_read",
        data: {
          conversationId,
          messageId,
          userId,
          readAt: new Date().toISOString(),
        },
      },
      userId
    );
  } catch (error) {
    console.error("Handle read error:", error);
  }
}

async function handleReaction(
  ws: ServerWebSocket<WebSocketData>,
  data: { messageId: number; emoji: string; action: "add" | "remove" }
) {
  const { userId, email } = ws.data;
  const { messageId, emoji, action } = data;

  try {
    // Get message for conversation ID
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Message not found" },
        })
      );
      return;
    }

    // Prevent reactions on deleted messages
    if (message.isDeleted) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Cannot react to deleted message" },
        })
      );
      return;
    }

    if (action === "add") {
      // Add reaction
      try {
        await db.insert(messageReactions).values({
          messageId,
          userId,
          emoji,
        });
      } catch {
        // Already exists
        return;
      }

      await broadcastToConversation(message.conversationId, {
        type: "reaction_added",
        data: {
          messageId,
          userId,
          userEmail: email,
          emoji,
        },
      });
    } else {
      // Remove reaction
      await db
        .delete(messageReactions)
        .where(
          and(
            eq(messageReactions.messageId, messageId),
            eq(messageReactions.userId, userId),
            eq(messageReactions.emoji, emoji)
          )
        );

      await broadcastToConversation(message.conversationId, {
        type: "reaction_removed",
        data: {
          messageId,
          userId,
          emoji,
        },
      });
    }
  } catch (error) {
    console.error("Handle reaction error:", error);
  }
}

// ============================================
// WEBSOCKET HANDLERS
// ============================================

export const websocketHandlers = {
  async open(ws: ServerWebSocket<WebSocketData>) {
    const { userId, email } = ws.data;
    console.log(`WebSocket connected: User ${userId} (${email})`);

    addClient(userId, ws);

    // Load user's conversations
    const participations = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.userId, userId),
          isNull(conversationParticipants.leftAt)
        )
      );

    const convIds = new Set(participations.map((p) => p.conversationId));
    userConversations.set(userId, convIds);

    // Notify other users about online status
    for (const convId of convIds) {
      await broadcastToConversation(
        convId,
        {
          type: "user_online",
          data: { userId, email },
        },
        userId
      );
    }

    // Send online users list to newly connected client
    ws.send(
      JSON.stringify({
        type: "online_users",
        data: { users: getOnlineUsers() },
      })
    );
  },

  async message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
    try {
      const rawData =
        typeof message === "string" ? message : message.toString();
      const parsed = JSON.parse(rawData);

      // Validate message structure
      const validated = wsMessageSchema.safeParse(parsed);
      if (!validated.success) {
        ws.send(
          JSON.stringify({
            type: "error",
            data: {
              message: "Invalid message format",
              errors: validated.error.issues,
            },
          })
        );
        return;
      }

      const { type, data } = validated.data;

      switch (type) {
        case "message":
          await handleNewMessage(ws, data);
          break;
        case "typing":
          await handleTyping(ws, data);
          break;
        case "read":
          await handleRead(ws, data);
          break;
        case "reaction":
          await handleReaction(ws, data);
          break;
        case "get_online_users":
          // Send current online users list to requesting client
          ws.send(
            JSON.stringify({
              type: "online_users",
              data: { users: getOnlineUsers() },
            })
          );
          break;
        default:
          ws.send(
            JSON.stringify({
              type: "error",
              data: { message: "Unknown message type" },
            })
          );
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Failed to process message" },
        })
      );
    }
  },

  async close(ws: ServerWebSocket<WebSocketData>) {
    const { userId, email } = ws.data;
    console.log(`WebSocket disconnected: User ${userId} (${email})`);

    removeClient(userId, ws);

    // If user has no more connections, notify offline
    if (!isUserOnline(userId)) {
      const convIds = userConversations.get(userId);
      if (convIds) {
        for (const convId of convIds) {
          await broadcastToConversation(convId, {
            type: "user_offline",
            data: { userId, email },
          });
        }
        userConversations.delete(userId);
      }
    }
  },
};

// ============================================
// AUTHENTICATION HELPER
// ============================================

export function authenticateWebSocket(
  url: string,
  headers: Headers
): WebSocketData | null {
  // Try to get token from query params or Authorization header
  let token: string | null = null;

  // Check query params
  try {
    const urlObj = new URL(url, "http://localhost");
    token = urlObj.searchParams.get("token");
  } catch {}

  // Check Authorization header
  if (!token) {
    const authHeader = headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}
