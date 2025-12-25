import {
  mysqlTable,
  varchar,
  int,
  text,
  date,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { users } from "./users";

export const teachers = mysqlTable("teachers", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id),
  nip: varchar("nip", { length: 50 }).unique(), // Nomor Induk Pegawai
  fullName: varchar("full_name", { length: 255 }).notNull(),
  birthDate: date("birth_date"),
  birthPlace: varchar("birth_place", { length: 255 }),
  gender: mysqlEnum("gender", ["male", "female"]),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  position: varchar("position", { length: 255 }), // Jabatan
  divisionId: int("division_id"), // ID Divisi (from divisions table)
  department: varchar("department", { length: 255 }), // Nama Divisi (auto-filled on assign)
  employeeType: mysqlEnum("employee_type", ["teacher", "staff"]).default(
    "teacher"
  ),
  joinDate: date("join_date"),
  status: mysqlEnum("status", ["active", "inactive", "retired"]).default(
    "active"
  ),
  salaryGradeId: int("salary_grade_id"), // Relation to salary_grades
  positionAllowanceId: int("position_allowance_id"), // Relation to position_allowances
  teachingHours: int("teaching_hours").default(0), // Jam mengajar per minggu
  bankName: varchar("bank_name", { length: 100 }), // Nama Bank
  bankCode: varchar("bank_code", { length: 20 }), // Kode Bank
  bankAccountNumber: varchar("bank_account_number", { length: 50 }), // Nomor Rekening
  bankAccountName: varchar("bank_account_name", { length: 255 }), // Nama pada Rekening
  photo: varchar("photo", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;
