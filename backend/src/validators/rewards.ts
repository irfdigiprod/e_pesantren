import { z } from "zod";

export const createRewardPunishmentSchema = z.object({
  studentId: z.number().min(1, "Student ID is required"),
  type: z.enum(["reward", "punishment"]),
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  points: z.number().optional(),
  ruleId: z.number().optional(), // Link to rule
  images: z.array(z.string()).optional(), // Array of image URLs
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  notes: z.string().optional(),
});

export const updateRewardPunishmentSchema = z.object({
  type: z.enum(["reward", "punishment"]).optional(),
  category: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  points: z.number().optional(),
  ruleId: z.number().optional(),
  images: z.array(z.string()).optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateRewardPunishmentInput = z.infer<
  typeof createRewardPunishmentSchema
>;
export type UpdateRewardPunishmentInput = z.infer<
  typeof updateRewardPunishmentSchema
>;
