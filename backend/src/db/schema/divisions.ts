import {
  mysqlTable,
  varchar,
  int,
  text,
  timestamp,
  decimal,
} from "drizzle-orm/mysql-core";
import { teachers } from "./teachers";

// Divisi/Departemen
export const divisions = mysqlTable("divisions", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  radius: int("radius"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Pivot table untuk guru di setiap divisi
export const teacherDivisions = mysqlTable("teacher_divisions", {
  id: int("id").primaryKey().autoincrement(),
  teacherId: int("teacher_id")
    .references(() => teachers.id)
    .notNull(),
  divisionId: int("division_id")
    .references(() => divisions.id)
    .notNull(),
  role: varchar("role", { length: 50 }).default("member"), // member, head, secretary
  createdAt: timestamp("created_at").defaultNow(),
});

export type Division = typeof divisions.$inferSelect;
export type NewDivision = typeof divisions.$inferInsert;
export type TeacherDivision = typeof teacherDivisions.$inferSelect;
export type NewTeacherDivision = typeof teacherDivisions.$inferInsert;
