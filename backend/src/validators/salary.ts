import { z } from "zod";

export const updateSalarySettingsSchema = z.object({
  dailyAttendanceRate: z.number().min(0).optional(),
  healthAllowance: z.number().min(0).optional(),
  teachingHourRate: z.number().min(0).optional(),
  housingAllowance: z.number().min(0).optional(),
  transportAllowance: z.number().min(0).optional(),
});

export const createPositionAllowanceSchema = z.object({
  position: z.string().min(1, "Position name is required"),
  amount: z.number().min(0, "Amount must be greater than or equal to 0"),
});

export const updatePositionAllowanceSchema = z.object({
  position: z.string().min(1).optional(),
  amount: z.number().min(0).optional(),
});

export const createTenureAllowanceSchema = z.object({
  minYears: z.number().int().min(0),
  maxYears: z.number().int().min(0),
  amount: z.number().min(0),
});

export const updateTenureAllowanceSchema = z.object({
  minYears: z.number().int().min(0).optional(),
  maxYears: z.number().int().min(0).optional(),
  amount: z.number().min(0).optional(),
});

export const createCustomAllowanceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(0),
});

export const updateCustomAllowanceSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const createSalaryGradeSchema = z.object({
  name: z.string().min(1, "Grade name is required"),
  baseSalary: z.number().min(0).optional(),
  dailyAttendanceRate: z.number().min(0).optional(),
  healthAllowance: z.number().min(0).optional(),
  teachingHourRate: z.number().min(0).optional(),
  housingAllowance: z.number().min(0).optional(),
  transportAllowance: z.number().min(0).optional(),
});

export const updateSalaryGradeSchema = z.object({
  name: z.string().min(1).optional(),
  baseSalary: z.number().min(0).optional(),
  dailyAttendanceRate: z.number().min(0).optional(),
  healthAllowance: z.number().min(0).optional(),
  teachingHourRate: z.number().min(0).optional(),
  housingAllowance: z.number().min(0).optional(),
  transportAllowance: z.number().min(0).optional(),
});
