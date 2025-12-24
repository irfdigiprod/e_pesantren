import {
  mysqlTable,
  varchar,
  int,
  text,
  date,
  time,
  timestamp,
  decimal,
  mysqlEnum,
  boolean,
} from "drizzle-orm/mysql-core";
import { students } from "./students";
import { teachers } from "./teachers";
import { users } from "./users";

export const studentAttendances = mysqlTable("student_attendances", {
  id: int("id").primaryKey().autoincrement(),
  studentId: int("student_id")
    .references(() => students.id)
    .notNull(),
  date: date("date").notNull(),
  status: mysqlEnum("status", [
    "present",
    "absent",
    "sick",
    "permitted",
    "late",
  ]).notNull(),
  notes: text("notes"),
  createdBy: int("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teacherAttendances = mysqlTable("teacher_attendances", {
  id: int("id").primaryKey().autoincrement(),
  teacherId: int("teacher_id")
    .references(() => teachers.id)
    .notNull(),
  teacherName: varchar("teacher_name", { length: 255 }),
  teacherDivision: varchar("teacher_division", { length: 255 }),
  divisionId: varchar("division_id", { length: 100 }), // Store division IDs (comma-separated if multiple)
  date: date("date").notNull(),
  checkIn: time("check_in"),
  checkOut: time("check_out"),
  // Geolocation untuk check-in
  checkInLatitude: decimal("check_in_latitude", { precision: 10, scale: 8 }),
  checkInLongitude: decimal("check_in_longitude", { precision: 11, scale: 8 }),
  // Geolocation untuk check-out
  checkOutLatitude: decimal("check_out_latitude", { precision: 10, scale: 8 }),
  checkOutLongitude: decimal("check_out_longitude", {
    precision: 11,
    scale: 8,
  }),
  status: mysqlEnum("status", [
    "present",
    "absent",
    "sick",
    "permitted",
    "late",
    "sick_deduct", // Sakit - Potong Gaji
    "sick_no_deduct", // Sakit - Tidak Potong Gaji
    "permit_deduct", // Izin - Potong Gaji
    "permit_no_deduct", // Izin - Tidak Potong Gaji
  ]).notNull(),
  activity: varchar("activity", { length: 100 }),
  notes: text("notes"),
  isClaim: boolean("is_claim").default(false), // Klaim kehadiran
  createdAt: timestamp("created_at").defaultNow(),
});

export type StudentAttendance = typeof studentAttendances.$inferSelect;
export type NewStudentAttendance = typeof studentAttendances.$inferInsert;
export type TeacherAttendance = typeof teacherAttendances.$inferSelect;
export type NewTeacherAttendance = typeof teacherAttendances.$inferInsert;
