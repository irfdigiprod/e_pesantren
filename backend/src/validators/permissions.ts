import { z } from "zod";

export const createPermissionSchema = z.object({
  type: z.enum(["sick", "permit"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  attachment: z.string().optional(), // File path or URL
});

export const updatePermissionStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  deductSalary: z.boolean().optional(), // Only relevant when status = approved
});
