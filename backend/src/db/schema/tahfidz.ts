import {
  mysqlTable,
  int,
  varchar,
  text,
  date,
  timestamp,
  mysqlEnum,
  boolean,
  decimal,
} from "drizzle-orm/mysql-core";
import { students } from "./students";
import { teachers } from "./teachers";

// --- Tahfidz Deposits (Setoran Harian) ---
export const tahfidzDeposits = mysqlTable("tahfidz_deposits", {
  id: int("id").primaryKey().autoincrement(),
  studentId: int("student_id")
    .references(() => students.id)
    .notNull(),
  teacherId: int("teacher_id")
    .references(() => teachers.id)
    .notNull(), // Musyrif/Penerima setoran

  depositDate: timestamp("deposit_date").defaultNow().notNull(),
  type: mysqlEnum("type", [
    "ziyadah",
    "murajaah",
    "izin",
    "alpha",
    "sakit",
  ]).notNull(),
  isLate: boolean("is_late").default(false), // Terlambat flag

  // Start Position (Dari)
  startSurah: int("start_surah"),
  startAyat: int("start_ayat"),
  startPage: int("start_page"),

  // End Position (Sampai)
  endSurah: int("end_surah"),
  endAyat: int("end_ayat"),
  endPage: int("end_page"),

  // Calculated Values
  totalLines: int("total_lines"),
  totalPages: decimal("total_pages", { precision: 5, scale: 2 }),

  // Legacy fields (kept for backward compatibility)
  juz: int("juz"),
  surahNumber: int("surah_number"),
  surahName: varchar("surah_name", { length: 100 }),
  ayatStart: int("ayat_start"),
  ayatEnd: int("ayat_end"),
  pageNumber: int("page_number"),

  // Quality Assessment
  fluency: mysqlEnum("fluency", ["lancar", "kurang_lancar", "mengulang"]),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// --- Tahfidz Exams (Ujian Tahfidz / Kenaikan Jus) ---
export const tahfidzExams = mysqlTable("tahfidz_exams", {
  id: int("id").primaryKey().autoincrement(),
  studentId: int("student_id")
    .references(() => students.id)
    .notNull(),
  examinerId: int("examiner_id")
    .references(() => teachers.id)
    .notNull(),

  examDate: date("exam_date").notNull(),
  examType: varchar("exam_type", { length: 50 }).notNull(), // e.g., "Juz 30", "Juz 29", "Semester 1"

  // Scoring (0-100 or specific rubric)
  scoreFluency: int("score_fluency"), // Kelancaran
  scoreTajwid: int("score_tajwid"), // Tajwid
  scoreMakhraj: int("score_makhraj"), // Makhraj
  scoreAdab: int("score_adab"), // Adab

  finalScore: int("final_score").notNull(),
  verdict: mysqlEnum("verdict", ["pass", "fail", "conditional"]).notNull(), // Lulus / Tidak / Bersyarat

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// --- Tahfidz Targets (Target per Level) ---
export const tahfidzTargets = mysqlTable("tahfidz_targets", {
  id: int("id").primaryKey().autoincrement(),
  level: varchar("level", { length: 50 }).notNull().unique(), // e.g., "SD", "SMP", "SMA", "Tahfidz"
  targetPages: int("target_pages").notNull(), // Target halaman per bulan
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Relations
import { relations } from "drizzle-orm";

export const tahfidzDepositsRelations = relations(
  tahfidzDeposits,
  ({ one }) => ({
    student: one(students, {
      fields: [tahfidzDeposits.studentId],
      references: [students.id],
    }),
    teacher: one(teachers, {
      fields: [tahfidzDeposits.teacherId],
      references: [teachers.id],
    }),
  })
);

export const tahfidzExamsRelations = relations(tahfidzExams, ({ one }) => ({
  student: one(students, {
    fields: [tahfidzExams.studentId],
    references: [students.id],
  }),
  examiner: one(teachers, {
    fields: [tahfidzExams.examinerId],
    references: [teachers.id],
  }),
}));
