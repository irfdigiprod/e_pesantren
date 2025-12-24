import {
  mysqlTable,
  int,
  varchar,
  text,
  date,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { teachers } from "./teachers";
import { users } from "./users";

export const permissionRequests = mysqlTable("permission_requests", {
  id: int("id").primaryKey().autoincrement(),
  teacherId: int("teacher_id")
    .references(() => teachers.id)
    .notNull(),
  type: mysqlEnum("type", ["sick", "permit"]).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason").notNull(),
  attachment: varchar("attachment", { length: 500 }), // URL/Path to file
  status: mysqlEnum("status", ["pending", "approved", "rejected"])
    .default("pending")
    .notNull(),

  // Audit
  approvedBy: int("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PermissionRequest = typeof permissionRequests.$inferSelect;
export type NewPermissionRequest = typeof permissionRequests.$inferInsert;
