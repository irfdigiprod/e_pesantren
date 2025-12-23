import { z } from "zod";

// Room schemas
export const createRoomSchema = z.object({
  name: z.string().min(1, "Name is required"),
  building: z.string().optional(),
  floor: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  description: z.string().optional(),
  status: z.enum(["active", "maintenance", "inactive"]).optional(),
});

export const updateRoomSchema = createRoomSchema.partial();

// Room Supervisor schemas
export const addSupervisorSchema = z.object({
  teacherId: z.number().int().positive(),
  role: z.enum(["lead", "assistant"]).optional(),
});

export const updateSupervisorSchema = z.object({
  role: z.enum(["lead", "assistant"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// Assign student to room
export const assignStudentRoomSchema = z.object({
  roomId: z.number().int().positive(),
});
