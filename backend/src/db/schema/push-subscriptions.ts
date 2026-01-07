import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";
import { users } from "./users";

// Push notification subscriptions for Web Push API
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .references(() => users.id)
    .notNull(),
  endpoint: text("endpoint").notNull(), // Push service URL
  p256dh: varchar("p256dh", { length: 255 }).notNull(), // Public key
  auth: varchar("auth", { length: 255 }).notNull(), // Auth secret
  userAgent: varchar("user_agent", { length: 500 }), // Browser info for debugging
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
