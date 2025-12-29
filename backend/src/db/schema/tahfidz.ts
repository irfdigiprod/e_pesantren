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
  // Modified: examType is still useful, but adding category is better e.g. UPK vs UKJ
  examType: varchar("exam_type", { length: 50 }).notNull(), // e.g., "Juz 30", "Juz 29", "Semester 1"
  examCategory: mysqlEnum("exam_category", [
    "UPK",
    "UKJ",
    "UA",
    "Suluk",
    "Other",
  ]).default("Other"),

  // Specifics for Report Card
  juz: int("juz"), // For UKJ
  startPage: int("start_page"), // For UPK
  endPage: int("end_page"), // For UPK

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

// --- Tahfidz Report Settings (Pengaturan Kops & TTD) ---
export const tahfidzReportSettings = mysqlTable("tahfidz_report_settings", {
  id: int("id").primaryKey().autoincrement(),
  institutionName: varchar("institution_name", { length: 255 }).notNull(),
  institutionAddress: text("institution_address"),
  institutionLogo: varchar("institution_logo", { length: 255 }), // URL path
  contactInfo: varchar("contact_info", { length: 255 }), // Email/Phone
  headmasterName: varchar("headmaster_name", { length: 100 }),
  tahfidzHeadName: varchar("tahfidz_head_name", { length: 100 }), // Ketua Tahfidz Ikhwan
  tahfidzHeadNameAkhwat: varchar("tahfidz_head_name_akhwat", { length: 100 }), // Ketua Tahfidz Akhwat (optional)
  cityDate: varchar("city_date", { length: 100 }), // e.g. "Purwakarta" (Date is dynamic usually, but City is static)
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// --- Tahfidz Report Cards (Snapshot Data Rapor) ---
// Optional: Store generated report data if needed to be frozen
export const tahfidzReportCards = mysqlTable("tahfidz_report_cards", {
  id: int("id").primaryKey().autoincrement(),
  studentId: int("student_id")
    .references(() => students.id)
    .notNull(),
  academicYear: varchar("academic_year", { length: 20 }), // e.g. 2024/2025
  semester: mysqlEnum("semester", ["1", "2", "ganjil", "genap"]),

  // Custom Notes
  notes: text("notes"), // Catatan
  result: varchar("result", { length: 50 }), // Tercapai / Tidak

  // Attendance Snapshot (in case it differs from calculated)
  sickCount: int("sick_count").default(0),
  permissionCount: int("permission_count").default(0),
  alphaCount: int("alpha_count").default(0),

  generatedAt: timestamp("generated_at").defaultNow(),
});

// --- Tahfidz Exam Types (Jenis Ujian Dinamis) ---
export const tahfidzExamTypes = mysqlTable("tahfidz_exam_types", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 150 }).notNull(), // e.g., "Ujian Kenaikan Juz 29", "UPK Pekanan"
  category: mysqlEnum("category", ["UPK", "UKJ", "UA", "Suluk", "Other"])
    .notNull()
    .default("Other"),
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

export const tahfidzReportCardsRelations = relations(
  tahfidzReportCards,
  ({ one }) => ({
    student: one(students, {
      fields: [tahfidzReportCards.studentId],
      references: [students.id],
    }),
  })
);
