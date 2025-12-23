import { z } from "zod";

export const createMemorizationSchema = z.object({
    studentId: z.number().min(1, "Student ID is required"),
    surahNumber: z.number().min(1).max(114),
    surahName: z.string().min(1, "Surah name is required"),
    juz: z.number().min(1).max(30).optional(),
    startAyah: z.number().min(1),
    endAyah: z.number().min(1),
    status: z.enum(["memorizing", "completed", "reviewing", "need_improvement"]).optional(),
    grade: z.string().optional(),
    score: z.number().min(0).max(100).optional(),
    teacherId: z.number().optional(),
    memorizedAt: z.string().optional(),
    notes: z.string().optional(),
});

export const updateMemorizationSchema = z.object({
    surahNumber: z.number().min(1).max(114).optional(),
    surahName: z.string().min(1).optional(),
    juz: z.number().min(1).max(30).optional(),
    startAyah: z.number().min(1).optional(),
    endAyah: z.number().min(1).optional(),
    status: z.enum(["memorizing", "completed", "reviewing", "need_improvement"]).optional(),
    grade: z.string().optional(),
    score: z.number().min(0).max(100).optional(),
    teacherId: z.number().optional(),
    memorizedAt: z.string().optional(),
    notes: z.string().optional(),
});

export type CreateMemorizationInput = z.infer<typeof createMemorizationSchema>;
export type UpdateMemorizationInput = z.infer<typeof updateMemorizationSchema>;
