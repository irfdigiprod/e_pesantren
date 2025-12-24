import { z } from "zod";

export const createStudentAttendanceSchema = z.object({
  studentId: z.number().min(1, "Student ID is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  status: z.enum(["present", "absent", "sick", "permitted", "late"]),
  notes: z.string().optional(),
});

export const bulkStudentAttendanceSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  attendances: z.array(
    z.object({
      studentId: z.number().min(1),
      status: z.enum(["present", "absent", "sick", "permitted", "late"]),
      notes: z.string().optional(),
    })
  ),
});

export const createTeacherAttendanceSchema = z.object({
  teacherId: z.number().min(1, "Teacher ID is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  // Geolocation check-in
  checkInLatitude: z.number().min(-90).max(90).optional(),
  checkInLongitude: z.number().min(-180).max(180).optional(),
  // Geolocation check-out
  checkOutLatitude: z.number().min(-90).max(90).optional(),
  checkOutLongitude: z.number().min(-180).max(180).optional(),
  status: z.enum(["present", "absent", "sick", "permitted", "late"]),
  notes: z.string().optional(),
});

export const teacherCheckInSchema = z.object({
  teacherId: z.number().min(1, "Teacher ID is required"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  activity: z.string().optional(),
  notes: z.string().optional(),
});

export const teacherCheckOutSchema = z.object({
  teacherId: z.number().min(1, "Teacher ID is required"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  notes: z.string().optional(),
});

export type CreateStudentAttendanceInput = z.infer<
  typeof createStudentAttendanceSchema
>;
export type BulkStudentAttendanceInput = z.infer<
  typeof bulkStudentAttendanceSchema
>;
export type CreateTeacherAttendanceInput = z.infer<
  typeof createTeacherAttendanceSchema
>;
export type TeacherCheckInInput = z.infer<typeof teacherCheckInSchema>;
export type TeacherCheckOutInput = z.infer<typeof teacherCheckOutSchema>;
