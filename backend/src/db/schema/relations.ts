import { relations } from "drizzle-orm";
import { teachers } from "./teachers";
import { divisions, teacherDivisions } from "./divisions";

export const teachersRelations = relations(teachers, ({ many }) => ({
  teacherDivisions: many(teacherDivisions),
}));

export const divisionsRelations = relations(divisions, ({ many }) => ({
  teacherDivisions: many(teacherDivisions),
}));

export const teacherDivisionsRelations = relations(
  teacherDivisions,
  ({ one }) => ({
    teacher: one(teachers, {
      fields: [teacherDivisions.teacherId],
      references: [teachers.id],
    }),
    division: one(divisions, {
      fields: [teacherDivisions.divisionId],
      references: [divisions.id],
    }),
  })
);
