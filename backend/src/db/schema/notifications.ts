import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  timestamp,
  json,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const notifications = mysqlTable("notifications", {
  id: int("id").primaryKey().autoincrement(),
  recipientId: int("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // 'group_invite', 'permission_request', etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: json("data"), // Metadata like conversationId, inviterId, etc.
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
