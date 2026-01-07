import {
  mysqlTable,
  varchar,
  int,
  text,
  time,
  timestamp,
  decimal,
  boolean,
  date,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { teachers } from "./teachers";
import { students } from "./students";

// Kelas
export const classes = mysqlTable("classes", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 50 }).notNull(), // e.g., "1A", "2B"
  grade: int("grade").notNull(), // e.g., 1, 2, 3
  academicYear: varchar("academic_year", { length: 20 }).notNull(), // e.g., "2024/2025"
  homeroomTeacherId: int("homeroom_teacher_id").references(() => teachers.id), // Kept for backward compatibility
  capacity: int("capacity").default(30),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Pivot table for multiple homeroom teachers per class
export const classHomeroomTeachers = mysqlTable("class_homeroom_teachers", {
  id: int("id").primaryKey().autoincrement(),
  classId: int("class_id")
    .references(() => classes.id)
    .notNull(),
  teacherId: int("teacher_id")
    .references(() => teachers.id)
    .notNull(),
  role: varchar("role", { length: 50 }).default("wali_kelas"), // wali_kelas, wakil_wali
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Classes Pivot (Pivot Siswa-Kelas)
export const studentClasses = mysqlTable("student_classes", {
  id: int("id").primaryKey().autoincrement(),
  studentId: int("student_id")
    .references(() => students.id)
    .notNull(),
  classId: int("class_id")
    .references(() => classes.id)
    .notNull(),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  status: mysqlEnum("status", [
    "active",
    "promoted",
    "transferred",
    "graduated",
    "dropped",
  ]).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Mata Pelajaran
export const subjects = mysqlTable("subjects", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }), // Arabic Name
  code: varchar("code", { length: 20 }).unique(),
  category: varchar("category", { length: 100 }), // e.g., "wajib", "muatan_lokal", "ekstrakurikuler"
  grades: text("grades"), // JSON string of grade levels, e.g. "[7,8,9]"
  kkm: decimal("kkm", { precision: 5, scale: 2 }).default("70.00"),
  sortOrder: int("sort_order").default(0),
  description: text("description"),
  creditHours: int("credit_hours").default(2),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Jadwal Pelajaran
export const schedules = mysqlTable("schedules", {
  id: int("id").primaryKey().autoincrement(),
  classId: int("class_id")
    .references(() => classes.id)
    .notNull(),
  subjectId: int("subject_id")
    .references(() => subjects.id)
    .notNull(),
  teacherId: int("teacher_id")
    .references(() => teachers.id)
    .notNull(),
  dayOfWeek: int("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  room: varchar("room", { length: 100 }),
  academicYear: varchar("academic_year", { length: 20 }),
  semester: int("semester"), // 1 or 2
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Nilai
export const grades = mysqlTable("grades", {
  id: int("id").primaryKey().autoincrement(),
  studentId: int("student_id")
    .references(() => students.id)
    .notNull(),
  subjectId: int("subject_id")
    .references(() => subjects.id)
    .notNull(),
  classId: int("class_id").references(() => classes.id),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  semester: int("semester").notNull(), // 1 or 2
  dailyScore: decimal("daily_score", { precision: 5, scale: 2 }),
  homeworkScore: decimal("homework_score", { precision: 5, scale: 2 }),
  midtermScore: decimal("midterm_score", { precision: 5, scale: 2 }),
  finalScore: decimal("final_score", { precision: 5, scale: 2 }),
  practiceScore: decimal("practice_score", { precision: 5, scale: 2 }),
  averageScore: decimal("average_score", { precision: 5, scale: 2 }),
  letterGrade: varchar("letter_grade", { length: 5 }), // A, B, C, D, E
  letterGradeAr: varchar("letter_grade_ar", { length: 10 }), // أ, ب, ج, د, هـ
  predicate: varchar("predicate", { length: 50 }), // Sangat Baik, Baik, Cukup, Kurang
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Rapor
export const reports = mysqlTable("reports", {
  id: int("id").primaryKey().autoincrement(),
  studentId: int("student_id")
    .references(() => students.id)
    .notNull(),
  classId: int("class_id").references(() => classes.id),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  semester: int("semester").notNull(),
  totalScore: decimal("total_score", { precision: 10, scale: 2 }),
  averageScore: decimal("average_score", { precision: 5, scale: 2 }),
  ranking: int("ranking"),
  totalStudents: int("total_students"),
  attendanceSummary: text("attendance_summary"), // JSON string
  quranProgress: text("quran_progress"), // JSON string
  rewardPoints: int("reward_points").default(0),
  punishmentPoints: int("punishment_points").default(0),
  behaviorNotes: text("behavior_notes"),
  teacherNotes: text("teacher_notes"),
  principalNotes: text("principal_notes"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default(
    "draft"
  ),
  publishedAt: timestamp("published_at"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Catatan Wali Kelas (Homeroom Notes)
export const homeroomNotes = mysqlTable("homeroom_notes", {
  id: int("id").primaryKey().autoincrement(),
  studentId: int("student_id")
    .references(() => students.id)
    .notNull(),
  classId: int("class_id").references(() => classes.id),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  semester: int("semester").notNull(),
  // Manual attendance input
  sickDays: int("sick_days").default(0),
  permissionDays: int("permission_days").default(0),
  absentDays: int("absent_days").default(0),
  // Notes
  teacherNotes: text("teacher_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
export type ClassHomeroomTeacher = typeof classHomeroomTeachers.$inferSelect;
export type NewClassHomeroomTeacher = typeof classHomeroomTeachers.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type Grade = typeof grades.$inferSelect;
export type NewGrade = typeof grades.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type HomeroomNote = typeof homeroomNotes.$inferSelect;
export type NewHomeroomNote = typeof homeroomNotes.$inferInsert;
// Titi Mangsa Rapor
export const reportCardDates = mysqlTable("report_card_dates", {
  id: int("id").primaryKey().autoincrement(),
  academicYear: varchar("academic_year", { length: 20 }).notNull(), // e.g., "2024-2025"
  semester: int("semester").notNull(), // 1 or 2
  reportDate: date("report_date").notNull(), // Tanggal pembagian rapor
  notes: text("notes"), // Optional notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Predikat Nilai Rapor (Dynamic Report Card Predicates)
export const reportCardPredicates = mysqlTable("report_card_predicates", {
  id: int("id").primaryKey().autoincrement(),
  grade: varchar("grade", { length: 5 }).notNull(), // A, B, C...
  minScore: decimal("min_score", { precision: 5, scale: 2 }).notNull(),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }).notNull(),
  description: varchar("description", { length: 100 }), // e.g., "Sangat Baik"
  descriptionAr: varchar("description_ar", { length: 100 }), // e.g., "Muntaz"
  sortOrder: int("sort_order").default(0), // For ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
