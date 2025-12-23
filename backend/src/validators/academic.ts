import { z } from "zod";

// Class validators
export const createClassSchema = z.object({
    name: z.string().min(1, "Name is required"),
    grade: z.number().min(1, "Grade is required"),
    academicYear: z.string().min(1, "Academic year is required"),
    homeroomTeacherId: z.number().optional(),
    capacity: z.number().min(1).optional(),
    description: z.string().optional(),
});

export const updateClassSchema = z.object({
    name: z.string().min(1).optional(),
    grade: z.number().min(1).optional(),
    academicYear: z.string().min(1).optional(),
    homeroomTeacherId: z.number().optional(),
    capacity: z.number().min(1).optional(),
    description: z.string().optional(),
});

// Subject validators
export const createSubjectSchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    creditHours: z.number().min(1).optional(),
});

export const updateSubjectSchema = z.object({
    name: z.string().min(1).optional(),
    code: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    creditHours: z.number().min(1).optional(),
});

// Schedule validators
export const createScheduleSchema = z.object({
    classId: z.number().min(1, "Class ID is required"),
    subjectId: z.number().min(1, "Subject ID is required"),
    teacherId: z.number().min(1, "Teacher ID is required"),
    dayOfWeek: z.number().min(0).max(6, "Day of week must be 0-6"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    room: z.string().optional(),
    academicYear: z.string().optional(),
    semester: z.number().min(1).max(2).optional(),
    isActive: z.boolean().optional(),
});

export const updateScheduleSchema = z.object({
    classId: z.number().min(1).optional(),
    subjectId: z.number().min(1).optional(),
    teacherId: z.number().min(1).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    startTime: z.string().min(1).optional(),
    endTime: z.string().min(1).optional(),
    room: z.string().optional(),
    academicYear: z.string().optional(),
    semester: z.number().min(1).max(2).optional(),
    isActive: z.boolean().optional(),
});

// Grade validators
export const createGradeSchema = z.object({
    studentId: z.number().min(1, "Student ID is required"),
    subjectId: z.number().min(1, "Subject ID is required"),
    classId: z.number().optional(),
    academicYear: z.string().min(1, "Academic year is required"),
    semester: z.number().min(1).max(2, "Semester must be 1 or 2"),
    dailyScore: z.number().min(0).max(100).optional(),
    homeworkScore: z.number().min(0).max(100).optional(),
    midtermScore: z.number().min(0).max(100).optional(),
    finalScore: z.number().min(0).max(100).optional(),
    practiceScore: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
});

export const updateGradeSchema = z.object({
    dailyScore: z.number().min(0).max(100).optional(),
    homeworkScore: z.number().min(0).max(100).optional(),
    midtermScore: z.number().min(0).max(100).optional(),
    finalScore: z.number().min(0).max(100).optional(),
    practiceScore: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
});

// Report validators
export const generateReportSchema = z.object({
    studentId: z.number().min(1, "Student ID is required"),
    academicYear: z.string().min(1, "Academic year is required"),
    semester: z.number().min(1).max(2, "Semester must be 1 or 2"),
    behaviorNotes: z.string().optional(),
    teacherNotes: z.string().optional(),
    principalNotes: z.string().optional(),
});

export const updateReportSchema = z.object({
    behaviorNotes: z.string().optional(),
    teacherNotes: z.string().optional(),
    principalNotes: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
