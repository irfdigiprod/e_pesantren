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

export const parents = mysqlTable("parents", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id),
  fatherName: varchar("father_name", { length: 255 }),
  motherName: varchar("mother_name", { length: 255 }),
  fatherOccupation: varchar("father_occupation", { length: 255 }),
  motherOccupation: varchar("mother_occupation", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  // Separate address fields for structured address data
  province: text("province"), // JSON: { code, name }
  regency: text("regency"), // JSON: { code, name }
  district: text("district"), // JSON: { code, name }
  village: text("village"), // JSON: { code, name }
  addressDetail: text("address_detail"),
  postalCode: varchar("postal_code", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const students = mysqlTable("students", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id),
  nis: varchar("nis", { length: 50 }).notNull().unique(), // Nomor Induk Siswa (Kemenag/Sekolah)
  nisn: varchar("nisn", { length: 20 }), // NISN (Nasional)
  nisSantri: varchar("nis_santri", { length: 50 }), // NIS Internal Pesantren
  fullName: varchar("full_name", { length: 255 }).notNull(),
  fullNameAr: varchar("full_name_ar", { length: 255 }),
  birthDate: date("birth_date"),
  birthPlace: varchar("birth_place", { length: 255 }),
  gender: mysqlEnum("gender", ["male", "female"]),
  address: text("address"),
  // Separate address fields for structured address data
  province: text("province"), // JSON: { code, name }
  regency: text("regency"), // JSON: { code, name }
  district: text("district"), // JSON: { code, name }
  village: text("village"), // JSON: { code, name }
  addressDetail: text("address_detail"),
  postalCode: varchar("postal_code", { length: 10 }),
  phone: varchar("phone", { length: 20 }),
  parentId: int("parent_id").references(() => parents.id),
  classId: int("class_id"),
  roomId: int("room_id"), // FK to rooms table - kamar siswa
  enrollmentDate: date("enrollment_date"),
  status: mysqlEnum("status", [
    "active",
    "inactive",
    "graduated",
    "transferred",
    "dropped",
  ]).default("active"),
  photo: varchar("photo", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Parent = typeof parents.$inferSelect;
export type NewParent = typeof parents.$inferInsert;
