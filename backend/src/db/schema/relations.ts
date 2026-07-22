import { relations } from "drizzle-orm";
import { teachers } from "./teachers";
import { divisions, teacherDivisions } from "./divisions";
import { pharmacies, pharmacyPharmacists, medicines } from "./clinic";

import { salaryGrades, positionAllowances } from "./salary";

export const teachersRelations = relations(teachers, ({ many, one }) => ({
  teacherDivisions: many(teacherDivisions),
  pharmacyPharmacists: many(pharmacyPharmacists),
  salaryGrade: one(salaryGrades, {
    fields: [teachers.salaryGradeId],
    references: [salaryGrades.id],
  }),
  positionAllowance: one(positionAllowances, {
    fields: [teachers.positionAllowanceId],
    references: [positionAllowances.id],
  }),
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

import { permissionRequests } from "./permissions";

export const permissionRequestsRelations = relations(
  permissionRequests,
  ({ one }) => ({
    teacher: one(teachers, {
      fields: [permissionRequests.teacherId],
      references: [teachers.id],
    }),
  })
);

import { students } from "./students";
import { classes } from "./academic";
import { rooms } from "./rooms";

export const studentsRelations = relations(students, ({ one }) => ({
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  room: one(rooms, {
    fields: [students.roomId],
    references: [rooms.id],
  }),
}));

import { studentAttendances } from "./attendance";

export const studentAttendancesRelations = relations(
  studentAttendances,
  ({ one }) => ({
    student: one(students, {
      fields: [studentAttendances.studentId],
      references: [students.id],
    }),
  })
);

import { studentClasses } from "./academic";

export const studentClassesRelations = relations(studentClasses, ({ one }) => ({
  student: one(students, {
    fields: [studentClasses.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [studentClasses.classId],
    references: [classes.id],
  }),
}));

export const pharmaciesRelations = relations(pharmacies, ({ many }) => ({
  pharmacyPharmacists: many(pharmacyPharmacists),
  medicines: many(medicines),
}));

export const pharmacyPharmacistsRelations = relations(
  pharmacyPharmacists,
  ({ one }) => ({
    pharmacy: one(pharmacies, {
      fields: [pharmacyPharmacists.pharmacyId],
      references: [pharmacies.id],
    }),
    teacher: one(teachers, {
      fields: [pharmacyPharmacists.teacherId],
      references: [teachers.id],
    }),
  })
);

export const medicinesRelations = relations(
  medicines,
  ({ one }) => ({
    pharmacy: one(pharmacies, {
      fields: [medicines.pharmacyId],
      references: [pharmacies.id],
    }),
  })
);
