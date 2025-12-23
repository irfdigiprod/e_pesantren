import {
  mysqlTable,
  varchar,
  int,
  text,
  boolean,
  timestamp,
  mysqlEnum,
  bigint,
  unique,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

// ============================================
// CONVERSATIONS TABLE
// ============================================
export const conversations = mysqlTable("conversations", {
  id: int("id").primaryKey().autoincrement(),
  type: mysqlEnum("type", ["private", "group"]).notNull().default("private"),
  name: varchar("name", { length: 255 }), // nullable, used for group chats
  avatarUrl: varchar("avatar_url", { length: 500 }), // group avatar
  isLocked: boolean("is_locked").notNull().default(false), // When locked, only admins can send messages
  createdBy: int("created_by")
    .notNull()
    .references(() => users.id),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [conversations.createdBy],
      references: [users.id],
    }),
    participants: many(conversationParticipants),
    messages: many(messages),
  })
);

// ============================================
// CONVERSATION PARTICIPANTS TABLE
// ============================================
export const conversationParticipants = mysqlTable(
  "conversation_participants",
  {
    id: int("id").primaryKey().autoincrement(),
    conversationId: int("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["admin", "member"]).notNull().default("member"),
    nickname: varchar("nickname", { length: 100 }), // optional nickname in group
    isMuted: boolean("is_muted").notNull().default(false),
    joinedAt: timestamp("joined_at").defaultNow(),
    leftAt: timestamp("left_at"), // null if still in conversation
    // Status: 'invited' (pending), 'joined' (active), 'left' (history)
    status: mysqlEnum("status", ["invited", "joined", "left"])
      .notNull()
      .default("joined"), // Default 'joined' for backward compatibility when creating groups
  },
  (table) => [
    unique("unique_participant").on(table.conversationId, table.userId),
  ]
);

export const conversationParticipantsRelations = relations(
  conversationParticipants,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationParticipants.conversationId],
      references: [conversations.id],
    }),
    user: one(users, {
      fields: [conversationParticipants.userId],
      references: [users.id],
    }),
  })
);

// ============================================
// MESSAGES TABLE
// ============================================
export const messages = mysqlTable("messages", {
  id: int("id").primaryKey().autoincrement(),
  conversationId: int("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: int("sender_id")
    .notNull()
    .references(() => users.id),
  content: text("content"), // nullable for attachment-only messages
  messageType: mysqlEnum("message_type", [
    "text",
    "image",
    "document",
    "audio",
    "video",
    "mixed", // text + attachments
  ])
    .notNull()
    .default("text"),
  replyToId: int("reply_to_id"), // self-reference for replies
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  isForwarded: boolean("is_forwarded").notNull().default(false),
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at"),
  isSigned: boolean("is_signed").notNull().default(false),
  originalSignerId: int("original_signer_id"), // Nullable, set if isSigned is true
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
    relationName: "reply",
  }),
  attachments: many(messageAttachments),
  reactions: many(messageReactions),
  readStatus: many(messageReadStatus),
}));

// ============================================
// MESSAGE ATTACHMENTS TABLE
// ============================================
export const messageAttachments = mysqlTable("message_attachments", {
  id: int("id").primaryKey().autoincrement(),
  messageId: int("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  fileType: mysqlEnum("file_type", [
    "image",
    "document",
    "audio",
    "video",
  ]).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(), // in bytes
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  // For images: width, height, thumbnail
  width: int("width"),
  height: int("height"),
  thumbnailPath: varchar("thumbnail_path", { length: 500 }),
  // For audio/video: duration in seconds
  duration: int("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageAttachmentsRelations = relations(
  messageAttachments,
  ({ one }) => ({
    message: one(messages, {
      fields: [messageAttachments.messageId],
      references: [messages.id],
    }),
  })
);

// ============================================
// MESSAGE REACTIONS TABLE
// ============================================
export const messageReactions = mysqlTable(
  "message_reactions",
  {
    id: int("id").primaryKey().autoincrement(),
    messageId: int("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: varchar("emoji", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("unique_reaction").on(table.messageId, table.userId, table.emoji),
  ]
);

export const messageReactionsRelations = relations(
  messageReactions,
  ({ one }) => ({
    message: one(messages, {
      fields: [messageReactions.messageId],
      references: [messages.id],
    }),
    user: one(users, {
      fields: [messageReactions.userId],
      references: [users.id],
    }),
  })
);

// ============================================
// MESSAGE READ STATUS TABLE
// ============================================
export const messageReadStatus = mysqlTable(
  "message_read_status",
  {
    id: int("id").primaryKey().autoincrement(),
    messageId: int("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at").defaultNow(),
  },
  (table) => [unique("unique_read_status").on(table.messageId, table.userId)]
);

export const messageReadStatusRelations = relations(
  messageReadStatus,
  ({ one }) => ({
    message: one(messages, {
      fields: [messageReadStatus.messageId],
      references: [messages.id],
    }),
    user: one(users, {
      fields: [messageReadStatus.userId],
      references: [users.id],
    }),
  })
);

// ============================================
// STARRED MESSAGES TABLE
// ============================================
export const starredMessages = mysqlTable(
  "starred_messages",
  {
    id: int("id").primaryKey().autoincrement(),
    messageId: int("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attachmentId: int("attachment_id").references(() => messageAttachments.id, {
      onDelete: "cascade",
    }), // Optional: star specific attachment
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("unique_starred").on(
      table.messageId,
      table.userId,
      table.attachmentId
    ),
  ]
);

export const starredMessagesRelations = relations(
  starredMessages,
  ({ one }) => ({
    message: one(messages, {
      fields: [starredMessages.messageId],
      references: [messages.id],
    }),
    user: one(users, {
      fields: [starredMessages.userId],
      references: [users.id],
    }),
    attachment: one(messageAttachments, {
      fields: [starredMessages.attachmentId],
      references: [messageAttachments.id],
    }),
  })
);

// ============================================
// TYPE EXPORTS
// ============================================
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type ConversationParticipant =
  typeof conversationParticipants.$inferSelect;
export type NewConversationParticipant =
  typeof conversationParticipants.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type NewMessageAttachment = typeof messageAttachments.$inferInsert;

export type MessageReaction = typeof messageReactions.$inferSelect;
export type NewMessageReaction = typeof messageReactions.$inferInsert;

export type MessageReadStatus = typeof messageReadStatus.$inferSelect;
export type NewMessageReadStatus = typeof messageReadStatus.$inferInsert;

export type StarredMessage = typeof starredMessages.$inferSelect;
export type NewStarredMessage = typeof starredMessages.$inferInsert;
