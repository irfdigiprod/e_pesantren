import {
  mysqlTable,
  int,
  timestamp,
  unique,
  boolean,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { students, parents } from "./students";

// Student-Parents pivot table - Many-to-many: students <-> parents
// Note: parent record already contains father_name and mother_name
export const studentParents = mysqlTable(
  "student_parents",
  {
    id: int("id").primaryKey().autoincrement(),
    studentId: int("student_id")
      .notNull()
      .references(() => students.id),
    parentId: int("parent_id")
      .notNull()
      .references(() => parents.id),
    isPrimary: boolean("is_primary").default(false), // Is this the primary parent/guardian?
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uniqueRelation: unique().on(table.studentId, table.parentId),
  })
);

// Relations
export const studentParentsRelations = relations(studentParents, ({ one }) => ({
  student: one(students, {
    fields: [studentParents.studentId],
    references: [students.id],
  }),
  parent: one(parents, {
    fields: [studentParents.parentId],
    references: [parents.id],
  }),
}));

// Types
export type StudentParent = typeof studentParents.$inferSelect;
export type NewStudentParent = typeof studentParents.$inferInsert;
