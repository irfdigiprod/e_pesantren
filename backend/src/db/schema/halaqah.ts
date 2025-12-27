import {
  mysqlTable,
  varchar,
  int,
  text,
  date,
  timestamp,
  mysqlEnum,
  unique,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { students } from "./students";
import { teachers } from "./teachers";
import { tahfidzTargets } from "./tahfidz";

// Halaqah Groups - Main halaqah group table
export const halaqahGroups = mysqlTable("halaqah_groups", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  schedule: varchar("schedule", { length: 255 }), // e.g., "Senin-Jumat 06:00-07:00"
  location: varchar("location", { length: 255 }),
  // Link to Target Level
  targetLevelId: int("target_level_id"),
  // .references(() => tahfidzTargets.id) // Need to import tahfidzTargets.
  // Circular dependency risk? halaqah -> tahfidz -> students -> halaqah.
  // tahfidz.ts imports students/teachers. relationships are separate.
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Halaqah Members - Many-to-many: students <-> halaqah_groups
export const halaqahMembers = mysqlTable(
  "halaqah_members",
  {
    id: int("id").primaryKey().autoincrement(),
    halaqahId: int("halaqah_id")
      .notNull()
      .references(() => halaqahGroups.id),
    studentId: int("student_id")
      .notNull()
      .references(() => students.id),
    joinedAt: date("joined_at"),
    status: mysqlEnum("status", ["active", "inactive", "graduated"]).default(
      "active"
    ),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uniqueMember: unique().on(table.halaqahId, table.studentId),
  })
);

// Halaqah Mentors - Many-to-many: teachers <-> halaqah_groups
export const halaqahMentors = mysqlTable(
  "halaqah_mentors",
  {
    id: int("id").primaryKey().autoincrement(),
    halaqahId: int("halaqah_id")
      .notNull()
      .references(() => halaqahGroups.id),
    teacherId: int("teacher_id")
      .notNull()
      .references(() => teachers.id),
    role: mysqlEnum("role", ["lead", "assistant"]).default("assistant"),
    assignedAt: date("assigned_at"),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uniqueMentor: unique().on(table.halaqahId, table.teacherId),
  })
);

// Relations
export const halaqahGroupsRelations = relations(
  halaqahGroups,
  ({ many, one }) => ({
    members: many(halaqahMembers),
    mentors: many(halaqahMentors),
    targetLevel: one(tahfidzTargets, {
      fields: [halaqahGroups.targetLevelId],
      references: [tahfidzTargets.id],
    }),
  })
);

export const halaqahMembersRelations = relations(halaqahMembers, ({ one }) => ({
  halaqah: one(halaqahGroups, {
    fields: [halaqahMembers.halaqahId],
    references: [halaqahGroups.id],
  }),
  student: one(students, {
    fields: [halaqahMembers.studentId],
    references: [students.id],
  }),
}));

export const halaqahMentorsRelations = relations(halaqahMentors, ({ one }) => ({
  halaqah: one(halaqahGroups, {
    fields: [halaqahMentors.halaqahId],
    references: [halaqahGroups.id],
  }),
  teacher: one(teachers, {
    fields: [halaqahMentors.teacherId],
    references: [teachers.id],
  }),
}));

// Types
export type HalaqahGroup = typeof halaqahGroups.$inferSelect;
export type NewHalaqahGroup = typeof halaqahGroups.$inferInsert;
export type HalaqahMember = typeof halaqahMembers.$inferSelect;
export type NewHalaqahMember = typeof halaqahMembers.$inferInsert;
export type HalaqahMentor = typeof halaqahMentors.$inferSelect;
export type NewHalaqahMentor = typeof halaqahMentors.$inferInsert;
