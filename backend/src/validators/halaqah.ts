import { z } from "zod";

// Halaqah Group schemas
export const createHalaqahSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  schedule: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const updateHalaqahSchema = createHalaqahSchema.partial();

// Halaqah Member schemas
export const addMemberSchema = z.object({
  studentId: z.number().int().positive(),
  joinedAt: z.string().optional(), // Date string
  status: z.enum(["active", "inactive", "graduated"]).optional(),
});

export const updateMemberSchema = z.object({
  status: z.enum(["active", "inactive", "graduated"]).optional(),
  joinedAt: z.string().optional(),
});

// Halaqah Mentor schemas
export const addMentorSchema = z.object({
  teacherId: z.number().int().positive(),
  role: z.enum(["lead", "assistant"]).optional(),
  assignedAt: z.string().optional(), // Date string
  status: z.enum(["active", "inactive"]).optional(),
});

export const updateMentorSchema = z.object({
  role: z.enum(["lead", "assistant"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  assignedAt: z.string().optional(),
});
