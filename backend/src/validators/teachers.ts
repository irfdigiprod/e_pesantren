import { z } from "zod";

export const createTeacherSchema = z.object({
  nip: z.string().optional(),
  fullName: z.string().min(1, "Full name is required"),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  employeeType: z.enum(["teacher", "staff"]).optional(),
  joinDate: z.string().optional(),
  status: z.enum(["active", "inactive", "retired"]).optional(),
  photo: z.string().optional(),
  salaryGradeId: z.number().nullable().optional(),
  positionAllowanceId: z.number().nullable().optional(),
  teachingHours: z.number().min(0).optional(),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  // Optional: create user account
  password: z.string().min(6).optional(),
});

export const updateTeacherSchema = z.object({
  nip: z.string().optional(),
  fullName: z.string().min(1).optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  employeeType: z.enum(["teacher", "staff"]).optional(),
  joinDate: z.string().optional(),
  status: z.enum(["active", "inactive", "retired"]).optional(),
  photo: z.string().optional(),
  salaryGradeId: z.number().nullable().optional(),
  positionAllowanceId: z.number().nullable().optional(),
  teachingHours: z.number().min(0).optional(),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
