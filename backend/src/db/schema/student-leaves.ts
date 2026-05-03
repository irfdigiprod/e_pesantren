import {
  mysqlTable,
  int,
  varchar,
  text,
  date,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { students } from "./students";
import { healthExaminations } from "./clinic";
import { users } from "./users";
import { relations } from "drizzle-orm";

export const studentLeaves = mysqlTable("student_leaves", {
  id: int("id").primaryKey().autoincrement(),
  type: mysqlEnum("type", ["sick", "permit"]).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason").notNull(),
  attachment: varchar("attachment", { length: 500 }),
  createdBy: int("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const studentLeaveItems = mysqlTable("student_leave_items", {
  id: int("id").primaryKey().autoincrement(),
  leaveId: int("leave_id").references(() => studentLeaves.id, { onDelete: "cascade" }),
  studentId: int("student_id").references(() => students.id).notNull(),
  clinicExamId: int("clinic_exam_id").references(() => healthExaminations.id),
});

// Relations
export const studentLeavesRelations = relations(studentLeaves, ({ many, one }) => ({
  items: many(studentLeaveItems),
  creator: one(users, {
    fields: [studentLeaves.createdBy],
    references: [users.id],
  }),
}));

export const studentLeaveItemsRelations = relations(studentLeaveItems, ({ one }) => ({
  leave: one(studentLeaves, {
    fields: [studentLeaveItems.leaveId],
    references: [studentLeaves.id],
  }),
  student: one(students, {
    fields: [studentLeaveItems.studentId],
    references: [students.id],
  }),
  clinicExam: one(healthExaminations, {
    fields: [studentLeaveItems.clinicExamId],
    references: [healthExaminations.id],
  }),
}));
