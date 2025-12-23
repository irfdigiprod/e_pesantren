import { z } from "zod";

// Student-Parent relation schema (simplified - no relationship field)
export const addStudentParentSchema = z.object({
  parentId: z.number().int().positive(),
  isPrimary: z.boolean().optional(),
});

export const updateStudentParentSchema = z.object({
  isPrimary: z.boolean().optional(),
});

// Parent-Student relation schema (from parent side)
export const addParentChildSchema = z.object({
  studentId: z.number().int().positive(),
  isPrimary: z.boolean().optional(),
});
