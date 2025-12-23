import { z } from "zod";

// ============================================
// CONVERSATION VALIDATORS
// ============================================

export const createConversationSchema = z.object({
  type: z.enum(["private", "group"]).default("private"),
  name: z.string().max(255).optional(), // Required for group chats
  participantIds: z.array(z.number().int().positive()).min(1), // User IDs to add
  inviteMode: z.enum(["direct", "invite"]).default("direct"), // "direct" = langsung masuk, "invite" = kirim undangan
});

export const updateConversationSchema = z.object({
  name: z.string().max(255).optional(),
  avatarUrl: z.string().max(500).optional().nullable(),
  isLocked: z.boolean().optional(),
});

export const addMembersSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "member"]),
});

export const addParticipantSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(["admin", "member"]).default("member"),
});

// ============================================
// MESSAGE VALIDATORS
// ============================================

export const createMessageSchema = z.object({
  conversationId: z.number().int().positive(),
  content: z.string().max(5000).optional(), // Optional if attachments exist
  messageType: z
    .enum(["text", "image", "document", "audio", "video", "mixed"])
    .default("text"),
  replyToId: z.number().int().positive().optional(),
  attachmentIds: z.array(z.number().int().positive()).optional(), // Pre-uploaded attachment IDs
  isSigned: z.boolean().optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().max(5000).min(1),
});

export const forwardMessageSchema = z.object({
  messageId: z.number().int().positive(),
  targetConversationIds: z.array(z.number().int().positive()).optional(), // Existing conversations
  targetUserIds: z.array(z.number().int().positive()).optional(), // For users without existing conversation
  attachmentId: z.number().int().positive().optional(), // Specific attachment to forward (if not set, forward all)
  caption: z.string().max(1000).optional(),
});

// ============================================
// REACTION VALIDATORS
// ============================================

export const addReactionSchema = z.object({
  emoji: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[\p{Emoji}\p{Emoji_Component}]+$/u, "Invalid emoji"),
});

// ============================================
// ATTACHMENT UPLOAD VALIDATOR
// ============================================

export const uploadAttachmentSchema = z.object({
  fileType: z.enum(["image", "document", "audio", "video"]),
  conversationId: z.number().int().positive().optional(), // Optional at upload time
});

// ============================================
// QUERY VALIDATORS
// ============================================

export const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.coerce.number().int().positive().optional(), // Message ID for cursor pagination
  after: z.coerce.number().int().positive().optional(),
});

export const getConversationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().max(100).optional(),
});

// ============================================
// WEBSOCKET MESSAGE VALIDATORS
// ============================================

export const wsMessageSchema = z.discriminatedUnion("type", [
  // Send a new message
  z.object({
    type: z.literal("message"),
    data: z.object({
      conversationId: z.number().int().positive(),
      content: z.string().max(5000).optional(),
      messageType: z
        .enum(["text", "image", "document", "audio", "video", "mixed"])
        .default("text"),
      replyToId: z.number().int().positive().optional(),
      attachmentIds: z.array(z.number().int().positive()).optional(),
      attachmentFiles: z
        .array(
          z.object({
            fileName: z.string(),
            originalName: z.string(),
            filePath: z.string(),
            fileType: z.string(),
            fileSize: z.number(),
            mimeType: z.string(),
            url: z.string().optional(),
          })
        )
        .optional(),
      isSigned: z.boolean().optional(),
    }),
  }),
  // Typing indicator
  z.object({
    type: z.literal("typing"),
    data: z.object({
      conversationId: z.number().int().positive(),
      isTyping: z.boolean(),
    }),
  }),
  // Mark messages as read
  z.object({
    type: z.literal("read"),
    data: z.object({
      conversationId: z.number().int().positive(),
      messageId: z.number().int().positive(),
    }),
  }),
  // Add reaction
  z.object({
    type: z.literal("reaction"),
    data: z.object({
      messageId: z.number().int().positive(),
      emoji: z.string().min(1).max(50),
      action: z.enum(["add", "remove"]),
    }),
  }),
  // Get online users
  z.object({
    type: z.literal("get_online_users"),
    data: z.object({}).optional(),
  }),
]);

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type AddParticipantInput = z.infer<typeof addParticipantSchema>;
export type AddMembersInput = z.infer<typeof addMembersSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type ForwardMessageInput = z.infer<typeof forwardMessageSchema>;
export type AddReactionInput = z.infer<typeof addReactionSchema>;
export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
export type GetConversationsQuery = z.infer<typeof getConversationsQuerySchema>;
export type WSMessage = z.infer<typeof wsMessageSchema>;
