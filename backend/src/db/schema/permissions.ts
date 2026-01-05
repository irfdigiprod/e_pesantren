import {
  mysqlTable,
  int,
  varchar,
  text,
  date,
  timestamp,
  mysqlEnum,
  boolean,
  unique,
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
  rejectionReason: text("rejection_reason"),

  // Audit
  approvedBy: int("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PermissionRequest = typeof permissionRequests.$inferSelect;
export type NewPermissionRequest = typeof permissionRequests.$inferInsert;

// ============ RBAC (Role-Based Access Control) ============

// Role Permissions - default access for each role type
export const rolePermissions = mysqlTable(
  "role_permissions",
  {
    id: int("id").primaryKey().autoincrement(),
    role: mysqlEnum("role", [
      "admin",
      "teacher",
      "student",
      "parent",
      "staff",
      "clinic",
    ]).notNull(),
    routePath: varchar("route_path", { length: 255 }).notNull(),
    routeLabel: varchar("route_label", { length: 255 }),
    routeCategory: varchar("route_category", { length: 100 }),
    isAllowed: boolean("is_allowed").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    roleRouteUnique: unique().on(table.role, table.routePath),
  })
);

// User Permissions - individual user overrides
export const userPermissions = mysqlTable(
  "user_permissions",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    routePath: varchar("route_path", { length: 255 }).notNull(),
    routeLabel: varchar("route_label", { length: 255 }),
    routeCategory: varchar("route_category", { length: 100 }),
    isAllowed: boolean("is_allowed").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    userRouteUnique: unique().on(table.userId, table.routePath),
  })
);

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type UserPermission = typeof userPermissions.$inferSelect;
export type NewUserPermission = typeof userPermissions.$inferInsert;
