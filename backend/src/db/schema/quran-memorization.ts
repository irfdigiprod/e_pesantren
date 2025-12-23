import { mysqlTable, varchar, int, text, date, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { students } from "./students";
import { teachers } from "./teachers";

export const quranMemorizations = mysqlTable("quran_memorizations", {
    id: int("id").primaryKey().autoincrement(),
    studentId: int("student_id").references(() => students.id).notNull(),
    surahNumber: int("surah_number").notNull(),
    surahName: varchar("surah_name", { length: 100 }).notNull(),
    juz: int("juz"),
    startAyah: int("start_ayah").notNull(),
    endAyah: int("end_ayah").notNull(),
    status: mysqlEnum("status", ["memorizing", "completed", "reviewing", "need_improvement"]).default("memorizing"),
    grade: varchar("grade", { length: 10 }),
    score: int("score"), // 0-100
    teacherId: int("teacher_id").references(() => teachers.id),
    memorizedAt: date("memorized_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type QuranMemorization = typeof quranMemorizations.$inferSelect;
export type NewQuranMemorization = typeof quranMemorizations.$inferInsert;
