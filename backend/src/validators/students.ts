import { z } from "zod";

export const createStudentSchema = z.object({
  nis: z.string().min(1, "NIS is required"),
  fullName: z.string().min(1, "Full name is required"),
  fullNameAr: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  address: z.string().optional(),
  // Separate address fields
  province: z.string().optional(),
  regency: z.string().optional(),
  district: z.string().optional(),
  village: z.string().optional(),
  addressDetail: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  parentId: z.number().optional(),
  classId: z.number().optional(),
  enrollmentDate: z.string().optional(),
  status: z.enum(["active", "graduated", "transferred", "dropped"]).optional(),
  photo: z.string().optional(),
  // Optional: create user account for student
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export const updateStudentSchema = z.object({
  nis: z.string().min(1).optional(),
  fullName: z.string().min(1).optional(),
  fullNameAr: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  address: z.string().optional(),
  // Separate address fields
  province: z.string().optional(),
  regency: z.string().optional(),
  district: z.string().optional(),
  village: z.string().optional(),
  addressDetail: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  parentId: z.number().optional().nullable(),
  classId: z.number().optional().nullable(),
  roomId: z.number().optional().nullable(),
  enrollmentDate: z.string().optional(),
  status: z
    .enum(["active", "inactive", "graduated", "transferred", "dropped"])
    .optional(),
  photo: z.string().optional(),
});

export const createParentSchema = z.object({
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  // Separate address fields
  province: z.string().optional(),
  regency: z.string().optional(),
  district: z.string().optional(),
  village: z.string().optional(),
  addressDetail: z.string().optional(),
  postalCode: z.string().optional(),
  // Optional: create user account for parent
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export const updateParentSchema = z.object({
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  // Separate address fields
  province: z.string().optional(),
  regency: z.string().optional(),
  district: z.string().optional(),
  village: z.string().optional(),
  addressDetail: z.string().optional(),
  postalCode: z.string().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateParentInput = z.infer<typeof createParentSchema>;
export type UpdateParentInput = z.infer<typeof updateParentSchema>;
