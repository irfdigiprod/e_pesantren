import { mysqlTable, varchar, int, text, date, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { students } from "./students";
import { users } from "./users";

export const rewardsPunishments = mysqlTable("rewards_punishments", {
    id: int("id").primaryKey().autoincrement(),
    studentId: int("student_id").references(() => students.id).notNull(),
    type: mysqlEnum("type", ["reward", "punishment"]).notNull(),
    category: varchar("category", { length: 100 }).notNull(), // e.g., "academic", "behavior", "quran"
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    points: int("points").default(0), // positive for reward, negative for punishment
    date: date("date").notNull(),
    givenBy: int("given_by").references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type RewardPunishment = typeof rewardsPunishments.$inferSelect;
export type NewRewardPunishment = typeof rewardsPunishments.$inferInsert;
