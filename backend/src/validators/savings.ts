import { z } from "zod";

export const createSavingSchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  transferDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal transfer harus berformat YYYY-MM-DD"),
  nominal: z.number().min(1, "Nominal harus lebih dari 0"),
  receiptPath: z.string().optional().nullable(),
  type: z.enum(["deposit", "withdrawal"]).default("deposit"),
  description: z.string().optional().nullable(),
});

export const updateSavingSchema = z.object({
  userId: z.number().min(1, "User ID is required").optional(),
  transferDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal transfer harus berformat YYYY-MM-DD")
    .optional(),
  nominal: z.number().min(1, "Nominal harus lebih dari 0").optional(),
  receiptPath: z.string().optional().nullable(),
  type: z.enum(["deposit", "withdrawal"]).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["pending", "confirmed", "rejected"]).optional(),
});

export type CreateSavingInput = z.infer<typeof createSavingSchema>;
export type UpdateSavingInput = z.infer<typeof updateSavingSchema>;

export const createSavingsBankAccountSchema = z.object({
  bankName: z.string().min(1, "Nama bank harus diisi"),
  accountNumber: z.string().min(1, "Nomor rekening harus diisi"),
  accountName: z.string().min(1, "Nama pemilik rekening harus diisi"),
  isActive: z.boolean().default(true),
});

export const updateSavingsBankAccountSchema = z.object({
  bankName: z.string().min(1, "Nama bank harus diisi").optional(),
  accountNumber: z.string().min(1, "Nomor rekening harus diisi").optional(),
  accountName: z.string().min(1, "Nama pemilik rekening harus diisi").optional(),
  isActive: z.boolean().optional(),
});

export type CreateSavingsBankAccountInput = z.infer<typeof createSavingsBankAccountSchema>;
export type UpdateSavingsBankAccountInput = z.infer<typeof updateSavingsBankAccountSchema>;
