import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  eq,
  and,
  desc,
  lt,
  gt,
  or,
  like,
  inArray,
  isNull,
  sql,
} from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/users";
import { teachers } from "../db/schema/teachers";
import { parents } from "../db/schema/students";
import {
  conversations,
  conversationParticipants,
  messages,
  messageReadStatus,
  messageAttachments,
  messageReactions,
} from "../db/schema/chat";
import { notifications } from "../db/schema/notifications";
import {
  broadcastToUser,
  broadcastToGroup,
  broadcastToConversation,
} from "../websocket";
import * as fs from "fs";
import * as path from "path";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
import {
  createConversationSchema,
  updateConversationSchema,
  createMessageSchema,
  updateMessageSchema,
  addMembersSchema,
  updateMemberRoleSchema,
  addParticipantSchema,
  addReactionSchema,
  forwardMessageSchema,
  getMessagesQuerySchema,
} from "../validators/chat";
import { authMiddleware } from "../middleware/auth";

const chat = new Hono();

// Helper to get enriched conversation
const getEnrichedConversation = async (conversationId: number) => {
  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });

  if (!conversation) return null;

  const participants = await db
    .select({
      userId: conversationParticipants.userId,
      role: conversationParticipants.role,
      nickname: conversationParticipants.nickname,
      joinedAt: conversationParticipants.joinedAt,
      name: users.name,
      email: users.email,
      photo: users.photo,
    })
    .from(conversationParticipants)
    .leftJoin(users, eq(conversationParticipants.userId, users.id))
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        isNull(conversationParticipants.leftAt),
        eq(conversationParticipants.status, "joined")
      )
    );

  const enrichedParticipants = await Promise.all(
    participants.map(async (p) => {
      if (!p.userId) return p;

      // Try teacher
      const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, p.userId),
        columns: { fullName: true, photo: true },
      });

      if (teacher?.fullName) {
        return {
          ...p,
          name: teacher.fullName,
          photo: p.photo || teacher.photo,
        };
      }

      // Try parent
      const parent = await db.query.parents.findFirst({
        where: eq(parents.userId, p.userId),
        columns: { fatherName: true, motherName: true },
      });

      if (parent?.fatherName || parent?.motherName) {
        return {
          ...p,
          name: parent.fatherName || parent.motherName,
        };
      }

      return p;
    })
  );

  return {
    ...conversation,
    participants: enrichedParticipants,
  };
};

// Get all conversations for current user
chat.get("/conversations", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");

    // Get all conversations where user is a participant
    const conversationIds = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.userId, currentUser.userId),
          isNull(conversationParticipants.leftAt),
          eq(conversationParticipants.status, "joined")
        )
      );

    const ids = conversationIds.map((c) => c.conversationId);

    if (ids.length === 0) {
      return c.json({ success: true, data: [], total: 0 });
    }

    const conversationsList = await db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, ids))
      .orderBy(desc(conversations.lastMessageAt));

    // Get participants for each conversation
    const conversationsWithDetails = await Promise.all(
      conversationsList.map(async (conv) => {
        const enrichedConv = await getEnrichedConversation(conv.id);

        // Get last message (reuse logic or fetch)
        // We'll fetch last message separately as before
        const lastMessage = await db
          .select({
            id: messages.id,
            content: messages.content,
            messageType: messages.messageType,
            senderId: messages.senderId,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.isDeleted, false)
            )
          )
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Get unread count
        const unreadResult = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(messages)
          .leftJoin(
            messageReadStatus,
            and(
              eq(messageReadStatus.messageId, messages.id),
              eq(messageReadStatus.userId, currentUser.userId)
            )
          )
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.isDeleted, false),
              sql`${messages.senderId} != ${currentUser.userId}`,
              isNull(messageReadStatus.id)
            )
          );

        return {
          ...enrichedConv,
          lastMessage: lastMessage[0] || null,
          unreadCount: Number(unreadResult[0]?.count || 0),
        };
      })
    );

    return c.json({
      success: true,
      data: conversationsWithDetails,
      total: ids.length,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    return c.json(
      {
        success: false,
        message:
          "Failed to get conversations: " +
          ((error as any).sqlMessage ||
            (error as any).message ||
            String(error)),
      },
      500
    );
  }
});

// Create a new conversation
chat.post(
  "/conversations",
  authMiddleware,
  zValidator("json", createConversationSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const { type, name, participantIds, inviteMode } = c.req.valid("json");

      // For private chat, check if conversation already exists
      if (type === "private" && participantIds.length === 1) {
        const otherUserId = participantIds[0]!;

        // Find existing private conversation between these two users
        const existingConversation = await db
          .select({ id: conversations.id })
          .from(conversations)
          .innerJoin(
            conversationParticipants,
            eq(conversations.id, conversationParticipants.conversationId)
          )
          .where(
            and(
              eq(conversations.type, "private"),
              eq(conversationParticipants.userId, currentUser.userId)
            )
          );

        for (const conv of existingConversation) {
          const participants = await db
            .select({ userId: conversationParticipants.userId })
            .from(conversationParticipants)
            .where(eq(conversationParticipants.conversationId, conv.id));

          const userIds = participants.map((p) => p.userId as number);
          if (
            userIds.length === 2 &&
            userIds.includes(currentUser.userId) &&
            userIds.includes(otherUserId)
          ) {
            // Conversation already exists
            const fullConv = await getEnrichedConversation(conv.id);
            return c.json({
              success: true,
              data: fullConv,
              message: "Conversation already exists",
            });
          }
        }
      }

      // Validate group chat name
      if (type === "group" && !name) {
        return c.json(
          { success: false, message: "Group name is required" },
          400
        );
      }

      // Create conversation
      const result = await db.insert(conversations).values({
        type,
        name: type === "group" ? name : null,
        createdBy: currentUser.userId,
      });

      const conversationId = Number(result[0].insertId);

      // Add creator as admin
      await db.insert(conversationParticipants).values({
        conversationId,
        userId: currentUser.userId,
        role: "admin",
        status: "joined",
      });

      // Add other participants
      for (const userId of participantIds) {
        if (userId !== currentUser.userId) {
          // For groups with invite mode, set status to "invited" and send notification
          const useInvite = type === "group" && inviteMode === "invite";

          await db.insert(conversationParticipants).values({
            conversationId,
            userId,
            role: "member",
            status: useInvite ? "invited" : "joined",
          });

          // Send notification if invite mode
          if (useInvite) {
            const notifResult = await db.insert(notifications).values({
              recipientId: userId,
              type: "group_invite",
              title: "Undangan Grup",
              message: `Anda diundang untuk bergabung ke grup "${name}"`,
              data: { conversationId, inviterId: currentUser.userId },
            });

            // Broadcast notification to user via WebSocket
            broadcastToUser(userId, {
              type: "new_notification",
              data: {
                id: Number(notifResult[0].insertId),
                title: "Undangan Grup",
                message: `Anda diundang untuk bergabung ke grup "${name}"`,
                type: "group_invite",
                data: { conversationId, inviterId: currentUser.userId },
                createdAt: new Date().toISOString(),
                isRead: false,
              },
            });
          }
        }
      }

      const fullConv = await getEnrichedConversation(conversationId);

      return c.json(
        {
          success: true,
          data: fullConv,
          message: "Conversation created",
        },
        201
      );
    } catch (error) {
      console.error("Create conversation error:", error);
      return c.json(
        { success: false, message: "Failed to create conversation" },
        500
      );
    }
  }
);

// Get conversation details
chat.get("/conversations/:id", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");
    const conversationId = parseInt(c.req.param("id"));

    // Check if user is participant
    const isParticipant = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, currentUser.userId),
        isNull(conversationParticipants.leftAt)
      ),
    });

    if (!isParticipant) {
      return c.json({ success: false, message: "Not a participant" }, 403);
    }

    // Get conversation
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      return c.json({ success: false, message: "Conversation not found" }, 404);
    }

    // Get participants (only joined members)
    const participants = await db
      .select({
        userId: conversationParticipants.userId,
        role: conversationParticipants.role,
        nickname: conversationParticipants.nickname,
        joinedAt: conversationParticipants.joinedAt,
        name: users.name,
        email: users.email,
        photo: users.photo,
      })
      .from(conversationParticipants)
      .leftJoin(users, eq(conversationParticipants.userId, users.id))
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          isNull(conversationParticipants.leftAt),
          eq(conversationParticipants.status, "joined")
        )
      );

    // Enrich participants with teacher/parent data
    const enrichedParticipants = await Promise.all(
      participants.map(async (p) => {
        if (!p.userId) return p;

        // Try teacher
        const teacher = await db.query.teachers.findFirst({
          where: eq(teachers.userId, p.userId),
          columns: { fullName: true, photo: true },
        });

        if (teacher?.fullName) {
          return {
            ...p,
            name: teacher.fullName,
            photo: p.photo || teacher.photo,
          };
        }

        // Try parent
        const parent = await db.query.parents.findFirst({
          where: eq(parents.userId, p.userId),
          columns: { fatherName: true, motherName: true },
        });

        if (parent?.fatherName || parent?.motherName) {
          return {
            ...p,
            name: parent.fatherName || parent.motherName,
          };
        }

        return p;
      })
    );

    return c.json({
      success: true,
      data: {
        ...conversation,
        participants: enrichedParticipants,
      },
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    return c.json(
      { success: false, message: "Failed to get conversation" },
      500
    );
  }
});

// Update group (name, avatar, isLocked) - Admin only
chat.put(
  "/conversations/:id",
  authMiddleware,
  zValidator("json", updateConversationSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const conversationId = parseInt(c.req.param("id"));
      const updateData = c.req.valid("json");

      // Check if current user is admin
      const currentParticipant =
        await db.query.conversationParticipants.findFirst({
          where: and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, currentUser.userId),
            eq(conversationParticipants.role, "admin"),
            isNull(conversationParticipants.leftAt)
          ),
        });

      if (!currentParticipant) {
        return c.json(
          { success: false, message: "Only admins can update group settings" },
          403
        );
      }

      // Check if conversation is a group
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });

      if (!conversation || conversation.type !== "group") {
        return c.json(
          { success: false, message: "Can only update group chats" },
          400
        );
      }

      // Update conversation
      await db
        .update(conversations)
        .set(updateData)
        .where(eq(conversations.id, conversationId));

      // Broadcast update
      broadcastToGroup(conversationId, {
        type: "conversation_updated",
        data: {
          conversationId,
          ...updateData,
        },
      });

      return c.json({ success: true, message: "Group updated" });
    } catch (error) {
      console.error("Update group error:", error);
      return c.json({ success: false, message: "Failed to update group" }, 500);
    }
  }
);

// Delete group - Admin only
chat.delete("/conversations/:id", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");
    const conversationId = parseInt(c.req.param("id"));

    // Check if current user is admin
    const currentParticipant =
      await db.query.conversationParticipants.findFirst({
        where: and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, currentUser.userId),
          eq(conversationParticipants.role, "admin"),
          isNull(conversationParticipants.leftAt)
        ),
      });

    if (!currentParticipant) {
      return c.json(
        { success: false, message: "Only admins can delete group" },
        403
      );
    }

    // Check if conversation is a group
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation || conversation.type !== "group") {
      return c.json(
        { success: false, message: "Can only delete group chats" },
        400
      );
    }

    // Delete conversation (cascades to participants, messages, etc.)
    await db.delete(conversations).where(eq(conversations.id, conversationId));

    return c.json({ success: true, message: "Group deleted" });
  } catch (error) {
    console.error("Delete group error:", error);
    return c.json({ success: false, message: "Failed to delete group" }, 500);
  }
});

// Add multiple members to group - Admin only
chat.post(
  "/conversations/:id/members",
  authMiddleware,
  zValidator("json", addMembersSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const conversationId = parseInt(c.req.param("id"));
      const { userIds } = c.req.valid("json");

      // Check if current user is admin
      const currentParticipant =
        await db.query.conversationParticipants.findFirst({
          where: and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, currentUser.userId),
            eq(conversationParticipants.role, "admin"),
            isNull(conversationParticipants.leftAt)
          ),
        });

      if (!currentParticipant) {
        return c.json(
          { success: false, message: "Only admins can add members" },
          403
        );
      }

      // Check if conversation is a group
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });

      if (!conversation || conversation.type !== "group") {
        return c.json(
          { success: false, message: "Can only add members to group chats" },
          400
        );
      }

      // Add each user
      let addedCount = 0;
      for (const userId of userIds) {
        // Check if user is already a participant
        const existingParticipant =
          await db.query.conversationParticipants.findFirst({
            where: and(
              eq(conversationParticipants.conversationId, conversationId),
              eq(conversationParticipants.userId, userId)
            ),
          });

        let shouldInvite = false;

        if (!existingParticipant) {
          // New participant
          await db.insert(conversationParticipants).values({
            conversationId,
            userId,
            role: "member",
            status: "invited",
          });
          shouldInvite = true;
          addedCount++;
        } else if (
          existingParticipant.leftAt ||
          existingParticipant.status === "left"
        ) {
          // Re-adding a user who left
          await db
            .update(conversationParticipants)
            .set({
              status: "invited",
              leftAt: null,
              joinedAt: new Date(), // Reset joined at or keep original? keeping original history is better usually, but leftAt: null is key.
              // Actually, let's just clear leftAt and set status.
            })
            .where(eq(conversationParticipants.id, existingParticipant.id));
          shouldInvite = true;
          addedCount++;
        }

        if (shouldInvite) {
          // Create notification - Drizzle handles JSON serialization automatically
          const notifResult = await db.insert(notifications).values({
            recipientId: userId,
            type: "group_invite",
            title: "Undangan Grup",
            message: `Anda diundang untuk bergabung ke grup "${conversation.name}"`,
            data: { conversationId, inviterId: currentUser.userId },
          });

          // Broadcast notification to user
          broadcastToUser(userId, {
            type: "new_notification",
            data: {
              id: Number(notifResult[0].insertId),
              title: "Undangan Grup",
              message: `Anda diundang untuk bergabung ke grup "${conversation.name}"`,
              type: "group_invite",
              data: { conversationId, inviterId: currentUser.userId },
              createdAt: new Date().toISOString(),
              isRead: false,
            },
          });
        }
      }

      return c.json({
        success: true,
        message: `${addedCount} members added`,
        addedCount,
      });
    } catch (error) {
      console.error("Add members error:", error);
      return c.json({ success: false, message: "Failed to add members" }, 500);
    }
  }
);

// Update member role - Admin only
chat.put(
  "/conversations/:id/members/:userId/role",
  authMiddleware,
  zValidator("json", updateMemberRoleSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const conversationId = parseInt(c.req.param("id"));
      const targetUserId = parseInt(c.req.param("userId"));
      const { role } = c.req.valid("json");

      // Check if current user is admin
      const currentParticipant =
        await db.query.conversationParticipants.findFirst({
          where: and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, currentUser.userId),
            eq(conversationParticipants.role, "admin"),
            isNull(conversationParticipants.leftAt)
          ),
        });

      if (!currentParticipant) {
        return c.json(
          { success: false, message: "Only admins can change member roles" },
          403
        );
      }

      // Check if target user is a participant
      const targetParticipant =
        await db.query.conversationParticipants.findFirst({
          where: and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, targetUserId),
            isNull(conversationParticipants.leftAt)
          ),
        });

      if (!targetParticipant) {
        return c.json(
          { success: false, message: "User is not a participant" },
          404
        );
      }

      // Update role
      await db
        .update(conversationParticipants)
        .set({ role })
        .where(
          and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, targetUserId)
          )
        );

      return c.json({
        success: true,
        message: `Member role updated to ${role}`,
      });
    } catch (error) {
      console.error("Update member role error:", error);
      return c.json(
        { success: false, message: "Failed to update member role" },
        500
      );
    }
  }
);

// Leave group
chat.post("/conversations/:id/leave", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");
    const conversationId = parseInt(c.req.param("id"));

    // Check if user is a participant
    const participant = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, currentUser.userId),
        isNull(conversationParticipants.leftAt)
      ),
    });

    if (!participant) {
      return c.json({ success: false, message: "Not a participant" }, 403);
    }

    // Check if conversation is a group
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation || conversation.type !== "group") {
      return c.json(
        { success: false, message: "Can only leave group chats" },
        400
      );
    }

    // Mark as left
    await db
      .update(conversationParticipants)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, currentUser.userId)
        )
      );

    return c.json({ success: true, message: "Left group" });
  } catch (error) {
    console.error("Leave group error:", error);
    return c.json({ success: false, message: "Failed to leave group" }, 500);
  }
});

// Add participant to group
chat.post(
  "/conversations/:id/participants",
  authMiddleware,
  zValidator("json", addParticipantSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const conversationId = parseInt(c.req.param("id"));
      const { userId, role } = c.req.valid("json");

      // Check if current user is admin
      const currentParticipant =
        await db.query.conversationParticipants.findFirst({
          where: and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, currentUser.userId),
            eq(conversationParticipants.role, "admin"),
            isNull(conversationParticipants.leftAt)
          ),
        });

      if (!currentParticipant) {
        return c.json(
          { success: false, message: "Only admins can add participants" },
          403
        );
      }

      // Check if conversation is a group
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });

      if (!conversation || conversation.type !== "group") {
        return c.json(
          {
            success: false,
            message: "Can only add participants to group chats",
          },
          400
        );
      }

      // Check if user is already a participant
      const existingParticipant =
        await db.query.conversationParticipants.findFirst({
          where: and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, userId),
            isNull(conversationParticipants.leftAt)
          ),
        });

      if (existingParticipant) {
        return c.json(
          { success: false, message: "User is already a participant" },
          400
        );
      }

      // Add participant
      await db.insert(conversationParticipants).values({
        conversationId,
        userId,
        role,
      });

      return c.json({ success: true, message: "Participant added" });
    } catch (error) {
      console.error("Add participant error:", error);
      return c.json(
        { success: false, message: "Failed to add participant" },
        500
      );
    }
  }
);

// Remove participant from group
chat.delete(
  "/conversations/:id/participants/:userId",
  authMiddleware,
  async (c) => {
    try {
      const currentUser = c.get("user");
      const conversationId = parseInt(c.req.param("id"));
      const userIdToRemove = parseInt(c.req.param("userId"));

      // Check if current user is admin or removing themselves
      const currentParticipant =
        await db.query.conversationParticipants.findFirst({
          where: and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, currentUser.userId),
            isNull(conversationParticipants.leftAt)
          ),
        });

      if (!currentParticipant) {
        return c.json({ success: false, message: "Not a participant" }, 403);
      }

      if (
        currentUser.userId !== userIdToRemove &&
        currentParticipant.role !== "admin"
      ) {
        return c.json(
          {
            success: false,
            message: "Only admins can remove other participants",
          },
          403
        );
      }

      // Mark as left
      await db
        .update(conversationParticipants)
        .set({ leftAt: new Date(), status: "left" })
        .where(
          and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, userIdToRemove)
          )
        );

      // Create notification
      // Only if removed by someone else (admin)
      if (currentUser.userId !== userIdToRemove) {
        const notifResult = await db.insert(notifications).values({
          recipientId: userIdToRemove,
          type: "group_removed",
          title: "Dikeluarkan dari Grup",
          message: `Anda telah dikeluarkan dari grup`, // Simplified message as we might not have group name handy unless we query it.
          // We can query conversation name or just say "grup".
          data: { conversationId, removerId: currentUser.userId },
        });

        broadcastToUser(userIdToRemove, {
          type: "new_notification",
          data: {
            id: Number(notifResult[0].insertId),
            title: "Dikeluarkan dari Grup",
            message: "Anda telah dikeluarkan dari grup",
            type: "group_removed",
            createdAt: new Date().toISOString(),
            isRead: false,
          },
        });
      }

      // Broadcast to group that member was removed or left
      broadcastToGroup(conversationId, {
        type: "group_updated",
        data: {
          conversationId,
          type: "member_left",
          userId: userIdToRemove,
        },
      });

      return c.json({ success: true, message: "Participant removed" });
    } catch (error) {
      console.error("Remove participant error:", error);
      return c.json(
        { success: false, message: "Failed to remove participant" },
        500
      );
    }
  }
);

// ============================================
// MESSAGES ROUTES
// ============================================

// Get messages in a conversation (with pagination)
chat.get(
  "/conversations/:id/messages",
  authMiddleware,
  zValidator("query", getMessagesQuerySchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const conversationId = parseInt(c.req.param("id"));
      const { limit, before, after } = c.req.valid("query");

      // Check if user is participant
      const isParticipant = await db.query.conversationParticipants.findFirst({
        where: and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, currentUser.userId),
          isNull(conversationParticipants.leftAt)
        ),
      });

      if (!isParticipant) {
        return c.json({ success: false, message: "Not a participant" }, 403);
      }

      // Build query with cursor pagination
      let conditions = [
        eq(messages.conversationId, conversationId),
        // Note: We include deleted messages to show "Pesan telah dihapus" indicator
      ];

      if (before) {
        conditions.push(lt(messages.id, before));
      }
      if (after) {
        conditions.push(gt(messages.id, after));
      }

      const messagesList = await db
        .select({
          id: messages.id,
          content: messages.content,
          messageType: messages.messageType,
          senderId: messages.senderId,
          replyToId: messages.replyToId,
          isEdited: messages.isEdited,
          isDeleted: messages.isDeleted,
          createdAt: messages.createdAt,
          senderEmail: users.email,
          senderName: users.name,
          isForwarded: messages.isForwarded,
          isSigned: messages.isSigned,
          originalSignerId: messages.originalSignerId,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(and(...conditions))
        .orderBy(desc(messages.id))
        .limit(limit);

      // Get attachments and reactions for each message
      const messagesWithDetails = await Promise.all(
        messagesList.map(async (msg) => {
          // Get attachments
          const attachments = await db
            .select()
            .from(messageAttachments)
            .where(eq(messageAttachments.messageId, msg.id));

          // Get reactions (grouped by emoji)
          const reactions = await db
            .select({
              emoji: messageReactions.emoji,
              userId: messageReactions.userId,
              userEmail: users.email,
            })
            .from(messageReactions)
            .leftJoin(users, eq(messageReactions.userId, users.id))
            .where(eq(messageReactions.messageId, msg.id));

          // Group reactions by emoji
          // Group reactions by emoji
          const reactionsByEmoji: Record<
            string,
            Array<{ userId: number; userEmail: string | null }>
          > = {};

          for (const reaction of reactions) {
            if (!reaction) continue;
            const { emoji, userId, userEmail } = reaction;

            if (!reactionsByEmoji[emoji]) {
              reactionsByEmoji[emoji] = [];
            }
            reactionsByEmoji[emoji]!.push({
              userId,
              userEmail,
            });
          }

          // Get reply-to message if exists
          let replyTo = null;
          if (msg.replyToId) {
            const replyMessage = await db
              .select({
                id: messages.id,
                content: messages.content,
                senderEmail: users.email,
              })
              .from(messages)
              .leftJoin(users, eq(messages.senderId, users.id))
              .where(eq(messages.id, msg.replyToId))
              .limit(1);

            replyTo = replyMessage[0] || null;
          }

          // Get original signer name if exists
          let originalSignerName = null;
          if (msg.originalSignerId) {
            // Check teacher
            const teacherSigner = await db.query.teachers.findFirst({
              where: eq(teachers.userId, msg.originalSignerId),
              columns: { fullName: true },
            });

            if (teacherSigner?.fullName) {
              originalSignerName = teacherSigner.fullName;
            } else {
              // Check parent
              const parentSigner = await db.query.parents.findFirst({
                where: eq(parents.userId, msg.originalSignerId),
                columns: { fatherName: true, motherName: true },
              });

              if (parentSigner?.fatherName || parentSigner?.motherName) {
                originalSignerName =
                  parentSigner.fatherName || parentSigner.motherName;
              } else {
                // Fallback to user
                const signer = await db
                  .select({ name: users.name, email: users.email })
                  .from(users)
                  .where(eq(users.id, msg.originalSignerId))
                  .limit(1);
                originalSignerName =
                  signer[0]?.name || signer[0]?.email || null;
              }
            }
          }

          // Get accurate sender name
          let senderName = msg.senderName; // Default to what we got from join

          // Check teacher for sender
          const teacherSender = await db.query.teachers.findFirst({
            where: eq(teachers.userId, msg.senderId),
            columns: { fullName: true },
          });

          if (teacherSender?.fullName) {
            senderName = teacherSender.fullName;
          } else {
            // Check parent for sender
            const parentSender = await db.query.parents.findFirst({
              where: eq(parents.userId, msg.senderId),
              columns: { fatherName: true, motherName: true },
            });

            if (parentSender?.fatherName || parentSender?.motherName) {
              senderName = parentSender.fatherName || parentSender.motherName;
            }
          }

          // Database stores Jakarta time, return as-is without timezone conversion
          // Format as ISO string but without the "Z" suffix (since it's local time, not UTC)
          let createdAtStr: string;
          if (msg.createdAt instanceof Date) {
            // Format: "2024-12-21T17:30:00" (no Z - indicates local time)
            createdAtStr = msg.createdAt.toISOString().replace("Z", "");
          } else {
            createdAtStr = String(msg.createdAt);
          }

          return {
            ...msg,
            senderName, // Use the enriched sender name
            createdAt: createdAtStr,
            attachments,
            reactions: reactionsByEmoji,
            replyTo,
            originalSignerName,
          };
        })
      );

      return c.json({
        success: true,
        data: messagesWithDetails.reverse(), // Oldest first for display
        hasMore: messagesList.length === limit,
      });
    } catch (error) {
      console.error("Get messages error:", error);
      return c.json({ success: false, message: "Failed to get messages" }, 500);
    }
  }
);

// Send a message (REST endpoint, also available via WebSocket)
chat.post(
  "/messages",
  authMiddleware,
  zValidator("json", createMessageSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const {
        conversationId,
        content,
        messageType,
        replyToId,
        attachmentIds,
        isSigned,
      } = c.req.valid("json");

      // Check if user is participant
      const isParticipant = await db.query.conversationParticipants.findFirst({
        where: and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, currentUser.userId),
          isNull(conversationParticipants.leftAt)
        ),
      });

      if (!isParticipant) {
        return c.json({ success: false, message: "Not a participant" }, 403);
      }

      // Validate content or attachments
      if (!content && (!attachmentIds || attachmentIds.length === 0)) {
        return c.json(
          {
            success: false,
            message: "Message must have content or attachments",
          },
          400
        );
      }

      // Create message
      const result = await db.insert(messages).values({
        conversationId,
        senderId: currentUser.userId,
        content,
        messageType,
        replyToId,
        isSigned: isSigned || false,
        originalSignerId: isSigned ? currentUser.userId : null,
      });

      const messageId = Number(result[0].insertId);

      // Update attachments with message ID if any
      if (attachmentIds && attachmentIds.length > 0) {
        await db
          .update(messageAttachments)
          .set({ messageId })
          .where(inArray(messageAttachments.id, attachmentIds));
      }

      // Update conversation's lastMessageAt
      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationId));

      // Get the created message with details
      const newMessage = await db
        .select({
          id: messages.id,
          content: messages.content,
          messageType: messages.messageType,
          senderId: messages.senderId,
          replyToId: messages.replyToId,
          createdAt: messages.createdAt,
          isSigned: messages.isSigned,
          senderEmail: users.email,
          senderName: users.name, // Initial join
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.id, messageId))
        .limit(1);

      if (!newMessage[0]) {
        return c.json(
          { success: false, message: "Failed to retrieve created message" },
          500
        );
      }

      // Enrich sender name
      let enrichedSenderName = newMessage[0].senderName;

      // Check teacher
      const teacherSender = await db.query.teachers.findFirst({
        where: eq(teachers.userId, currentUser.userId),
        columns: { fullName: true },
      });

      if (teacherSender?.fullName) {
        enrichedSenderName = teacherSender.fullName;
      } else {
        // Check parent
        const parentSender = await db.query.parents.findFirst({
          where: eq(parents.userId, currentUser.userId),
          columns: { fatherName: true, motherName: true },
        });

        if (parentSender?.fatherName || parentSender?.motherName) {
          enrichedSenderName =
            parentSender.fatherName || parentSender.motherName;
        }
      }

      const attachments = await db
        .select()
        .from(messageAttachments)
        .where(eq(messageAttachments.messageId, messageId));

      const responseData = {
        ...newMessage[0],
        attachments,
        reactions: {},
      };

      // 1. Broadcast to group (Realtime)
      const broadcastPayload = {
        type: "new_message",
        data: {
          ...responseData,
          senderEmail: currentUser.email, // Ensure email is there
          replyTo: null, // Populate if needed
          // We might need to construct the full payload similar to websocket.ts
          // For now, sending what we have is usually enough for frontend to append
        },
      };

      // We need to import broadcastToGroup. It is likely already imported or available.
      // Checking imports... "import { broadcastToGroup, broadcastToUser } from "../websocket";"
      // If not imported, I need to add it. But file shows it handles chat, so likely imported.
      broadcastToGroup(conversationId, broadcastPayload);

      // 2. Send Push Notifications (Background)
      (async () => {
        try {
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

          const { sendPushNotification } = await import("./push");

          for (const p of participants) {
            if (p.userId !== currentUser.userId) {
              sendPushNotification(
                p.userId,
                enrichedSenderName || "Pesan Baru", // Title
                content ||
                  (attachmentIds?.length
                    ? "Mengirim lampiran"
                    : "Mengirim pesan"), // Body
                {
                  type: "chat_message",
                  // URL is now handled dynamically in push.ts based on user agent
                  conversationId,
                }
              ).catch((e) => console.error("Push error:", e));
            }
          }
        } catch (err) {
          console.error("Async push notification error:", err);
        }
      })();

      return c.json(
        {
          success: true,
          data: responseData,
        },
        201
      );
    } catch (error) {
      console.error("Send message error:", error);
      return c.json({ success: false, message: "Failed to send message" }, 500);
    } finally {
      // Fire and forget: Notifications
      // We do this in finally (or just before return) to not block response
      // but since we return c.json, code after return won't execute unless we structure it differently.
      // So we put it BEFORE return or use Promise.all but don't await the push part strictly?
      // Actually, we can just await it or not await it before return.
      // Best to put it before return.
    }
  }
);

// Edit a message (only sender can edit)
chat.put(
  "/messages/:id",
  authMiddleware,
  zValidator("json", updateMessageSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const messageId = parseInt(c.req.param("id"));
      const { content } = c.req.valid("json");

      // Get message
      const message = await db.query.messages.findFirst({
        where: eq(messages.id, messageId),
      });

      if (!message) {
        return c.json({ success: false, message: "Message not found" }, 404);
      }

      // Check if user is the sender
      if (message.senderId !== currentUser.userId) {
        return c.json(
          { success: false, message: "Can only edit your own messages" },
          403
        );
      }

      // Check if message is deleted
      if (message.isDeleted) {
        return c.json(
          { success: false, message: "Cannot edit deleted message" },
          400
        );
      }

      // Update message
      await db
        .update(messages)
        .set({ content, isEdited: true, editedAt: new Date() })
        .where(eq(messages.id, messageId));

      // Get updated message
      const updatedMessage = await db.query.messages.findFirst({
        where: eq(messages.id, messageId),
      });

      return c.json({
        success: true,
        message: "Message updated",
        data: updatedMessage,
      });
    } catch (error) {
      console.error("Edit message error:", error);
      return c.json({ success: false, message: "Failed to edit message" }, 500);
    }
  }
);

// Delete (soft) a message
chat.delete("/messages/:id", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");
    const messageId = parseInt(c.req.param("id"));

    // Get message
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      return c.json({ success: false, message: "Message not found" }, 404);
    }

    // Check if user is the sender
    if (message.senderId !== currentUser.userId) {
      return c.json(
        { success: false, message: "Can only delete your own messages" },
        403
      );
    }

    // Get attachments for this message
    const attachments = await db
      .select()
      .from(messageAttachments)
      .where(eq(messageAttachments.messageId, messageId));

    // Delete attachment files from disk
    const fs = await import("fs");
    const path = await import("path");
    const UPLOAD_DIR = path.default.resolve(process.cwd(), "uploads");

    for (const att of attachments) {
      try {
        const filePath = path.default.join(
          UPLOAD_DIR,
          att.fileType,
          att.fileName
        );
        if (fs.default.existsSync(filePath)) {
          fs.default.unlinkSync(filePath);
          console.log("Deleted attachment file:", filePath);
        }
      } catch (fileError) {
        console.error("Failed to delete attachment file:", fileError);
        // Continue with message deletion even if file deletion fails
      }
    }

    // Delete attachment records from database
    if (attachments.length > 0) {
      await db
        .delete(messageAttachments)
        .where(eq(messageAttachments.messageId, messageId));
    }

    // Delete reactions for this message
    await db
      .delete(messageReactions)
      .where(eq(messageReactions.messageId, messageId));

    // Soft delete the message
    await db
      .update(messages)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(messages.id, messageId));

    // Broadcast message deletion to all participants via WebSocket
    try {
      const { broadcastToConversation } = await import("../websocket");
      await broadcastToConversation(message.conversationId, {
        type: "message_deleted",
        data: {
          messageId,
          conversationId: message.conversationId,
        },
      });
    } catch (wsError) {
      console.error("Failed to broadcast message deletion:", wsError);
    }

    return c.json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("Delete message error:", error);
    return c.json({ success: false, message: "Failed to delete message" }, 500);
  }
});

// ============================================
// REACTIONS ROUTES
// ============================================

// Add reaction to message
chat.post(
  "/messages/:id/reactions",
  authMiddleware,
  zValidator("json", addReactionSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const messageId = parseInt(c.req.param("id"));
      const { emoji } = c.req.valid("json");

      // Get message and check participant
      const message = await db.query.messages.findFirst({
        where: eq(messages.id, messageId),
      });

      if (!message) {
        return c.json({ success: false, message: "Message not found" }, 404);
      }

      const isParticipant = await db.query.conversationParticipants.findFirst({
        where: and(
          eq(conversationParticipants.conversationId, message.conversationId),
          eq(conversationParticipants.userId, currentUser.userId),
          isNull(conversationParticipants.leftAt)
        ),
      });

      if (!isParticipant) {
        return c.json({ success: false, message: "Not a participant" }, 403);
      }

      // Check if reaction already exists
      const existingReaction = await db.query.messageReactions.findFirst({
        where: and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, currentUser.userId),
          eq(messageReactions.emoji, emoji)
        ),
      });

      if (existingReaction) {
        return c.json(
          { success: false, message: "Reaction already exists" },
          400
        );
      }

      // Add reaction
      await db.insert(messageReactions).values({
        messageId,
        userId: currentUser.userId,
        emoji,
      });

      return c.json({ success: true, message: "Reaction added" }, 201);
    } catch (error) {
      console.error("Add reaction error:", error);
      return c.json({ success: false, message: "Failed to add reaction" }, 500);
    }
  }
);

// Remove reaction from message
chat.delete("/messages/:id/reactions/:emoji", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");
    const messageId = parseInt(c.req.param("id"));
    const emoji = decodeURIComponent(c.req.param("emoji"));

    await db
      .delete(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, currentUser.userId),
          eq(messageReactions.emoji, emoji)
        )
      );

    return c.json({ success: true, message: "Reaction removed" });
  } catch (error) {
    console.error("Remove reaction error:", error);
    return c.json(
      { success: false, message: "Failed to remove reaction" },
      500
    );
  }
});

// ============================================
// READ STATUS ROUTES
// ============================================

// Mark messages as read
chat.post("/conversations/:id/read", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");
    const conversationId = parseInt(c.req.param("id"));
    const { messageId } = await c.req.json();

    // Check if user is participant
    const isParticipant = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, currentUser.userId),
        isNull(conversationParticipants.leftAt)
      ),
    });

    if (!isParticipant) {
      return c.json({ success: false, message: "Not a participant" }, 403);
    }

    // Get all unread messages up to messageId
    const unreadMessages = await db
      .select({ id: messages.id })
      .from(messages)
      .leftJoin(
        messageReadStatus,
        and(
          eq(messages.id, messageReadStatus.messageId),
          eq(messageReadStatus.userId, currentUser.userId)
        )
      )
      .where(
        and(
          eq(messages.conversationId, conversationId),
          isNull(messageReadStatus.id),
          messageId ? sql`${messages.id} <= ${messageId}` : sql`1=1`
        )
      );

    // Mark as read
    for (const msg of unreadMessages) {
      try {
        await db.insert(messageReadStatus).values({
          messageId: msg.id,
          userId: currentUser.userId,
        });
      } catch {
        // Ignore duplicate key errors
      }
    }

    return c.json({
      success: true,
      message: "Messages marked as read",
      count: unreadMessages.length,
    });
  } catch (error) {
    console.error("Mark read error:", error);
    return c.json({ success: false, message: "Failed to mark as read" }, 500);
  }
});

// ============================================
// FORWARD MESSAGE
// ============================================

// Imports moved to top

// Forward a message to one or more conversations
chat.post(
  "/messages/forward",
  authMiddleware,
  zValidator("json", forwardMessageSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const {
        messageId,
        targetConversationIds,
        targetUserIds,
        caption,
        attachmentId,
      } = c.req.valid("json");

      // Get original message
      const originalMessage = await db.query.messages.findFirst({
        where: eq(messages.id, messageId),
      });

      if (!originalMessage) {
        return c.json({ success: false, message: "Message not found" }, 404);
      }

      // Check if user is participant of original conversation
      const isParticipant = await db.query.conversationParticipants.findFirst({
        where: and(
          eq(
            conversationParticipants.conversationId,
            originalMessage.conversationId
          ),
          eq(conversationParticipants.userId, currentUser.userId),
          isNull(conversationParticipants.leftAt)
        ),
      });

      if (!isParticipant) {
        return c.json(
          { success: false, message: "Not authorized to forward this message" },
          403
        );
      }

      // Get original attachments
      const originalAttachments = await db
        .select()
        .from(messageAttachments)
        .where(eq(messageAttachments.messageId, messageId));

      // Filter attachments if specific attachmentId is requested
      const attachmentsToForward = attachmentId
        ? originalAttachments.filter((att) => att.id === attachmentId)
        : originalAttachments;

      if (attachmentId && attachmentsToForward.length === 0) {
        return c.json({ success: false, message: "Attachment not found" }, 404);
      }

      // Collect all target conversation IDs
      let allTargetConvIds = targetConversationIds
        ? [...targetConversationIds]
        : [];

      // Create conversations for target users if needed
      if (targetUserIds && targetUserIds.length > 0) {
        // Prepare to check existing private conversations
        const existingPrivateConvs = await db
          .select({
            id: conversations.id,
            userId: conversationParticipants.userId,
          })
          .from(conversations)
          .innerJoin(
            conversationParticipants,
            eq(conversations.id, conversationParticipants.conversationId)
          )
          .where(eq(conversations.type, "private"));

        // Group by conversation ID
        const convParticipants = new Map<number, number[]>();
        existingPrivateConvs.forEach((row) => {
          if (!convParticipants.has(row.id)) {
            convParticipants.set(row.id, []);
          }
          convParticipants.get(row.id)!.push(row.userId);
        });

        for (const userId of targetUserIds) {
          if (userId === currentUser.userId) continue;

          let foundConvId = null;
          // Check if private chat already exists
          for (const [convId, participants] of convParticipants.entries()) {
            if (
              participants.length === 2 &&
              participants.includes(currentUser.userId) &&
              participants.includes(userId)
            ) {
              foundConvId = convId;
              break;
            }
          }

          if (foundConvId) {
            if (!allTargetConvIds.includes(foundConvId)) {
              allTargetConvIds.push(foundConvId);
            }
          } else {
            // Create new conversation
            const newConvResult = await db.insert(conversations).values({
              type: "private",
              createdBy: currentUser.userId,
            });
            const newConvId = Number(newConvResult[0].insertId);

            // Add participants
            await db.insert(conversationParticipants).values([
              {
                conversationId: newConvId,
                userId: currentUser.userId,
                role: "admin",
              },
              { conversationId: newConvId, userId, role: "member" },
            ]);

            allTargetConvIds.push(newConvId);
          }
        }
      }

      if (allTargetConvIds.length === 0) {
        return c.json(
          {
            success: false,
            message: "No target conversations specified or created",
          },
          400
        );
      }

      const forwardedMessages = [];

      // Forward to each target conversation
      for (const targetConvId of allTargetConvIds) {
        // Check if user is participant (or just created this conversation)
        const isTargetParticipant =
          await db.query.conversationParticipants.findFirst({
            where: and(
              eq(conversationParticipants.conversationId, targetConvId),
              eq(conversationParticipants.userId, currentUser.userId),
              isNull(conversationParticipants.leftAt)
            ),
          });

        if (!isTargetParticipant) {
          continue; // Skip if not a participant
        }

        // Build forwarded content
        let forwardedContent = caption || "";

        // Handling forwarding indicator and content
        // If forwarding specific attachment (image), mostly likely just caption + image
        // If forwarding text message, caption + text

        let finalContent = "";

        if (attachmentId) {
          // Forwarding specific attachment
          if (caption) {
            finalContent = caption;
          } else {
            finalContent = "";
          }
        } else {
          // Forwarding message (potentially with text)
          const originalText = originalMessage.content || "";
          if (caption) {
            finalContent = originalText
              ? `${caption}\n\n${originalText}`
              : caption;
          } else {
            finalContent = originalText || "";
          }
        }

        // Create forwarded message
        const messageResult = await db.insert(messages).values({
          conversationId: targetConvId,
          senderId: currentUser.userId,
          content: finalContent,
          messageType: originalMessage.messageType,
          isForwarded: true,
          isSigned: originalMessage.isSigned,
          originalSignerId:
            originalMessage.originalSignerId ||
            (originalMessage.isSigned ? originalMessage.senderId : null),
          // Let database use defaultNow() which respects MySQL timezone
        });

        const newMessageId = Number(messageResult[0].insertId);
        const newAttachments = [];

        // Copy attachments
        for (const att of attachmentsToForward) {
          // Copy file with new name
          const ext = path.extname(att.fileName);
          const newFileName = `fwd_${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}${ext}`;

          // Use fileType for directory to match uploads route restriction
          const subDir = att.fileType || "document";

          // DB path should include 'uploads/' to match standard upload behavior
          // e.g. "uploads/image/filename.png"
          const dbFilePath = `uploads/${subDir}/${newFileName}`;

          // Resolve source path correctly. att.filePath usually starts with 'uploads/'
          // path.resolve(cwd, relative) handles this correctly
          const srcPath = path.resolve(process.cwd(), att.filePath);

          // Destination path
          const destPath = path.resolve(process.cwd(), dbFilePath);

          // Copy the file
          try {
            // Ensure directory exists
            const dir = path.dirname(destPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            if (fs.existsSync(srcPath)) {
              fs.copyFileSync(srcPath, destPath);
            } else {
              console.error("Source file not found for forwarding:", srcPath);
            }
          } catch (err) {
            console.error("Failed to copy attachment:", err);
          }

          // Create new attachment record
          const attResult = await db.insert(messageAttachments).values({
            messageId: newMessageId,
            fileType: att.fileType,
            fileName: newFileName,
            originalName: att.originalName,
            filePath: dbFilePath,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            width: att.width,
            height: att.height,
            thumbnailPath: att.thumbnailPath,
            duration: att.duration,
          });

          newAttachments.push({
            id: Number(attResult[0].insertId),
            fileType: att.fileType,
            fileName: newFileName,
            originalName: att.originalName,
            filePath: dbFilePath,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            width: att.width,
            height: att.height,
            thumbnailPath: att.thumbnailPath,
            duration: att.duration,
          });
        }

        // Update conversation's lastMessageAt
        await db
          .update(conversations)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversations.id, targetConvId));

        // Get the forwarded message with details
        const fwdMsg = await db
          .select({
            id: messages.id,
            content: messages.content,
            messageType: messages.messageType,
            senderId: messages.senderId,
            conversationId: messages.conversationId,
            createdAt: messages.createdAt,
            isForwarded: messages.isForwarded,
            isSigned: messages.isSigned,
            originalSignerId: messages.originalSignerId,
            senderEmail: users.email,
            senderName: users.name,
          })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(eq(messages.id, newMessageId))
          .limit(1);

        // Get original signer name if exists
        let originalSignerName = null;
        if (fwdMsg[0]?.originalSignerId) {
          const signer = await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, fwdMsg[0].originalSignerId))
            .limit(1);
          originalSignerName = signer[0]?.name || signer[0]?.email || null;
        }

        const fullMessage = {
          ...fwdMsg[0],
          attachments: newAttachments,
          reactions: {},
          originalSignerName,
        };

        // Prepare websocket message
        const wsMessage = {
          type: "new_message",
          data: {
            id: fullMessage.id,
            conversationId: fullMessage.conversationId,
            senderId: fullMessage.senderId,
            senderEmail: fullMessage.senderEmail,
            senderName: fullMessage.senderName,
            content: fullMessage.content,
            messageType: fullMessage.messageType,
            replyToId: null,
            replyTo: null,
            attachments: newAttachments,
            reactions: {},
            isEdited: false,
            isForwarded: fullMessage.isForwarded,
            isSigned: fullMessage.isSigned,
            originalSignerName: fullMessage.originalSignerName,
            // Format as local time (same format as REST API getMessages)
            createdAt: fullMessage.createdAt
              ? fullMessage.createdAt.toISOString().replace("Z", "")
              : new Date().toISOString().replace("Z", ""),
          },
        };

        // Broadcast to conversation participants
        await broadcastToConversation(targetConvId, wsMessage);

        forwardedMessages.push(fullMessage);
      }

      return c.json({
        success: true,
        message: `Message forwarded to ${forwardedMessages.length} conversation(s)`,
        data: forwardedMessages,
      });
    } catch (error) {
      console.error("Forward message error:", error);
      return c.json(
        { success: false, message: "Failed to forward message" },
        500
      );
    }
  }
);

// ============================================
// GROUP MANAGEMENT ROUTES
// ============================================

// Get group members
chat.get("/conversations/:id/members", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");
    const conversationId = parseInt(c.req.param("id"));

    // Check if user is participant
    const isParticipant = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, currentUser.userId),
        isNull(conversationParticipants.leftAt)
      ),
    });

    if (!isParticipant) {
      return c.json({ success: false, message: "Not a participant" }, 403);
    }

    // Get all members with user details
    const members = await db
      .select({
        id: conversationParticipants.id,
        userId: conversationParticipants.userId,
        role: conversationParticipants.role,
        joinedAt: conversationParticipants.joinedAt,
        email: users.email,
        name: users.name,
      })
      .from(conversationParticipants)
      .leftJoin(users, eq(conversationParticipants.userId, users.id))
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          isNull(conversationParticipants.leftAt)
        )
      );

    return c.json({ success: true, data: members });
  } catch (error) {
    console.error("Get group members error:", error);
    return c.json({ success: false, message: "Failed to get members" }, 500);
  }
});

// Add member to group
chat.post(
  "/conversations/:id/members",
  authMiddleware,
  zValidator("json", addParticipantSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const conversationId = parseInt(c.req.param("id"));
      const { userId } = c.req.valid("json");

      // Check if conversation is a group
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });

      if (!conversation) {
        return c.json(
          { success: false, message: "Conversation not found" },
          404
        );
      }

      if (conversation.type !== "group") {
        return c.json(
          { success: false, message: "Can only add members to groups" },
          400
        );
      }

      // Check if current user is admin
      const currentParticipant =
        await db.query.conversationParticipants.findFirst({
          where: and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, currentUser.userId),
            isNull(conversationParticipants.leftAt)
          ),
        });

      if (!currentParticipant || currentParticipant.role !== "admin") {
        return c.json(
          { success: false, message: "Only admins can add members" },
          403
        );
      }

      // Check if user to add exists
      const userToAdd = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!userToAdd) {
        return c.json({ success: false, message: "User not found" }, 404);
      }

      // Check if already a member
      const existingMember = await db.query.conversationParticipants.findFirst({
        where: and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
          isNull(conversationParticipants.leftAt)
        ),
      });

      if (existingMember) {
        return c.json(
          { success: false, message: "User is already a member" },
          400
        );
      }

      // Add member
      await db.insert(conversationParticipants).values({
        conversationId,
        userId,
        role: "member",
      });

      return c.json({
        success: true,
        message: "Member added successfully",
      });
    } catch (error) {
      console.error("Add group member error:", error);
      return c.json({ success: false, message: "Failed to add member" }, 500);
    }
  }
);

// Remove member from group
chat.delete("/conversations/:id/members/:userId", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");
    const conversationId = parseInt(c.req.param("id"));
    const userIdToRemove = parseInt(c.req.param("userId"));

    // Check if conversation is a group
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      return c.json({ success: false, message: "Conversation not found" }, 404);
    }

    if (conversation.type !== "group") {
      return c.json(
        { success: false, message: "Can only remove members from groups" },
        400
      );
    }

    // Check if current user is admin or removing themselves
    const currentParticipant =
      await db.query.conversationParticipants.findFirst({
        where: and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, currentUser.userId),
          isNull(conversationParticipants.leftAt)
        ),
      });

    const isAdmin = currentParticipant?.role === "admin";
    const isRemovingSelf = currentUser.userId === userIdToRemove;

    if (!isAdmin && !isRemovingSelf) {
      return c.json(
        { success: false, message: "Only admins can remove members" },
        403
      );
    }

    // Find member to remove
    const memberToRemove = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userIdToRemove),
        isNull(conversationParticipants.leftAt)
      ),
    });

    if (!memberToRemove) {
      return c.json({ success: false, message: "Member not found" }, 404);
    }

    // Update leftAt instead of deleting (soft delete)
    await db
      .update(conversationParticipants)
      .set({ leftAt: new Date() })
      .where(eq(conversationParticipants.id, memberToRemove.id));

    return c.json({
      success: true,
      message: isRemovingSelf
        ? "Left the group"
        : "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove group member error:", error);
    return c.json({ success: false, message: "Failed to remove member" }, 500);
  }
});

// Update group info (name)
chat.put(
  "/conversations/:id",
  authMiddleware,
  zValidator("json", updateConversationSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const conversationId = parseInt(c.req.param("id"));
      const { name } = c.req.valid("json");

      // Check if conversation is a group
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });

      if (!conversation) {
        return c.json(
          { success: false, message: "Conversation not found" },
          404
        );
      }

      if (conversation.type !== "group") {
        return c.json(
          { success: false, message: "Can only update group info" },
          400
        );
      }

      // Check if current user is admin
      const currentParticipant =
        await db.query.conversationParticipants.findFirst({
          where: and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, currentUser.userId),
            isNull(conversationParticipants.leftAt)
          ),
        });

      if (!currentParticipant || currentParticipant.role !== "admin") {
        return c.json(
          { success: false, message: "Only admins can update group" },
          403
        );
      }

      // Update group
      await db
        .update(conversations)
        .set({ name })
        .where(eq(conversations.id, conversationId));

      return c.json({
        success: true,
        message: "Group updated successfully",
      });
    } catch (error) {
      console.error("Update group error:", error);
      return c.json({ success: false, message: "Failed to update group" }, 500);
    }
  }
);

export default chat;
