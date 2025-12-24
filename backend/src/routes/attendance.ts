import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import {
  studentAttendances,
  teacherAttendances,
} from "../db/schema/attendance";
import { teachers } from "../db/schema/teachers";
import { teacherDivisions, divisions } from "../db/schema/divisions";
import { authMiddleware, requireRole } from "../middleware/auth";
import {
  createStudentAttendanceSchema,
  bulkStudentAttendanceSchema,
  createTeacherAttendanceSchema,
  teacherCheckInSchema,
  teacherCheckOutSchema,
} from "../validators/attendance";

const attendanceRoute = new Hono();

// Apply auth to all routes
attendanceRoute.use("*", authMiddleware);

// ============ STUDENT ATTENDANCE ============

// Get student attendances
attendanceRoute.get("/students", async (c) => {
  try {
    const date = c.req.query("date");
    const studentId = c.req.query("studentId");

    let conditions: any[] = [];
    if (date) conditions.push(sql`${studentAttendances.date} = ${date}`);
    if (studentId)
      conditions.push(eq(studentAttendances.studentId, parseInt(studentId)));

    const attendances =
      conditions.length > 0
        ? await db.query.studentAttendances.findMany({
            where: and(...conditions),
          })
        : await db.query.studentAttendances.findMany();

    return c.json({
      success: true,
      data: attendances,
    });
  } catch (error) {
    console.error("Get student attendances error:", error);
    return c.json(
      { success: false, message: "Failed to get attendances" },
      500
    );
  }
});

// Create student attendance
attendanceRoute.post(
  "/students",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", createStudentAttendanceSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const user = c.get("user");

      // Check if attendance already exists for this student on this date
      const existing = await db.query.studentAttendances.findFirst({
        where: and(
          eq(studentAttendances.studentId, data.studentId),
          sql`${studentAttendances.date} = ${data.date}`
        ),
      });

      if (existing) {
        // Update existing
        await db
          .update(studentAttendances)
          .set({
            status: data.status,
            notes: data.notes,
          })
          .where(eq(studentAttendances.id, existing.id));

        const updated = await db.query.studentAttendances.findFirst({
          where: eq(studentAttendances.id, existing.id),
        });

        return c.json({
          success: true,
          message: "Attendance updated successfully",
          data: updated,
        });
      }

      const result = await db.insert(studentAttendances).values({
        studentId: data.studentId,
        date: new Date(data.date),
        status: data.status,
        notes: data.notes,
        createdBy: user.userId,
      });

      const newAttendance = await db.query.studentAttendances.findFirst({
        where: eq(studentAttendances.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Attendance recorded successfully",
        data: newAttendance,
      });
    } catch (error) {
      console.error("Create student attendance error:", error);
      return c.json(
        { success: false, message: "Failed to record attendance" },
        500
      );
    }
  }
);

// Bulk create student attendance
attendanceRoute.post(
  "/students/bulk",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", bulkStudentAttendanceSchema),
  async (c) => {
    try {
      const { date, attendances } = c.req.valid("json");
      const user = c.get("user");

      const results = [];

      for (const attendance of attendances) {
        // Check if attendance already exists
        const existing = await db.query.studentAttendances.findFirst({
          where: and(
            eq(studentAttendances.studentId, attendance.studentId),
            sql`${studentAttendances.date} = ${date}`
          ),
        });

        if (existing) {
          // Update existing
          await db
            .update(studentAttendances)
            .set({
              status: attendance.status,
              notes: attendance.notes,
            })
            .where(eq(studentAttendances.id, existing.id));

          const updated = await db.query.studentAttendances.findFirst({
            where: eq(studentAttendances.id, existing.id),
          });
          results.push(updated);
        } else {
          // Create new
          const result = await db.insert(studentAttendances).values({
            studentId: attendance.studentId,
            date: new Date(date),
            status: attendance.status,
            notes: attendance.notes,
            createdBy: user.userId,
          });

          const newAttendance = await db.query.studentAttendances.findFirst({
            where: eq(studentAttendances.id, Number(result[0].insertId)),
          });
          results.push(newAttendance);
        }
      }

      return c.json({
        success: true,
        message: "Bulk attendance recorded successfully",
        data: results,
      });
    } catch (error) {
      console.error("Bulk attendance error:", error);
      return c.json(
        { success: false, message: "Failed to record bulk attendance" },
        500
      );
    }
  }
);

// ============ TEACHER ATTENDANCE ============

// Get teacher attendances
attendanceRoute.get("/teachers", async (c) => {
  try {
    const date = c.req.query("date");
    const teacherId = c.req.query("teacherId");

    let conditions: any[] = [];
    if (date) conditions.push(sql`${teacherAttendances.date} = ${date}`);
    if (teacherId)
      conditions.push(eq(teacherAttendances.teacherId, parseInt(teacherId)));

    const attendances =
      conditions.length > 0
        ? await db.query.teacherAttendances.findMany({
            where: and(...conditions),
          })
        : await db.query.teacherAttendances.findMany();

    return c.json({
      success: true,
      data: attendances,
    });
  } catch (error) {
    console.error("Get teacher attendances error:", error);
    return c.json(
      { success: false, message: "Failed to get attendances" },
      500
    );
  }
});

// Create teacher attendance
attendanceRoute.post(
  "/teachers",
  requireRole("admin", "staff"),
  zValidator("json", createTeacherAttendanceSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const result = await db.insert(teacherAttendances).values({
        teacherId: data.teacherId,
        date: new Date(data.date),
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        checkInLatitude: data.checkInLatitude?.toString(),
        checkInLongitude: data.checkInLongitude?.toString(),
        checkOutLatitude: data.checkOutLatitude?.toString(),
        checkOutLongitude: data.checkOutLongitude?.toString(),
        status: data.status,
        notes: data.notes,
      });

      const newAttendance = await db.query.teacherAttendances.findFirst({
        where: eq(teacherAttendances.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Attendance recorded successfully",
        data: newAttendance,
      });
    } catch (error) {
      console.error("Create teacher attendance error:", error);
      return c.json(
        { success: false, message: "Failed to record attendance" },
        500
      );
    }
  }
);

// Teacher check-in
attendanceRoute.post(
  "/teachers/check-in",
  zValidator("json", teacherCheckInSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const today = new Date().toISOString().split("T")[0];
      const currentTime = new Date().toTimeString().split(" ")[0];

      // Check for existing active session (checked in but not checked out)
      const existing = await db.query.teacherAttendances.findFirst({
        where: and(
          eq(teacherAttendances.teacherId, data.teacherId),
          sql`${teacherAttendances.date} = ${today}`
        ),
        orderBy: (attendances, { desc }) => [desc(attendances.id)],
      });

      if (existing && !existing.checkOut) {
        return c.json(
          {
            success: false,
            message: "Already checked in today. Please check out first.",
            data: existing,
          },
          400
        );
      }
      // If existing checkOut is present, we allow creating a NEW session.

      // Fetch teacher info (now includes divisionId and department)
      const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.id, data.teacherId),
      });

      const result = await db.insert(teacherAttendances).values({
        teacherId: data.teacherId,
        teacherName: teacher?.fullName || null,
        teacherDivision: teacher?.department || null,
        divisionId: teacher?.divisionId?.toString() || null,
        date: new Date(today),
        checkIn: currentTime,
        checkInLatitude: data.latitude?.toString(),
        checkInLongitude: data.longitude?.toString(),
        status: "present",
        activity: data.activity,
        notes: data.notes,
      });

      const attendance = await db.query.teacherAttendances.findFirst({
        where: eq(teacherAttendances.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Check-in successful",
        data: attendance,
      });
    } catch (error) {
      console.error("Check-in error:", error);
      return c.json({ success: false, message: "Failed to check in" }, 500);
    }
  }
);

// Teacher check-out
attendanceRoute.post(
  "/teachers/check-out",
  zValidator("json", teacherCheckOutSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const today = new Date().toISOString().split("T")[0];
      const currentTime = new Date().toTimeString().split(" ")[0];

      // Find today's latest attendance
      const existing = await db.query.teacherAttendances.findFirst({
        where: and(
          eq(teacherAttendances.teacherId, data.teacherId),
          sql`${teacherAttendances.date} = ${today}`
        ),
        orderBy: (attendances, { desc }) => [desc(attendances.id)],
      });

      if (!existing) {
        return c.json(
          {
            success: false,
            message: "No check-in record found for today",
          },
          400
        );
      }

      if (existing.checkOut) {
        return c.json(
          {
            success: false,
            message:
              "Already checked out. Please check in manually to start new session.",
            data: existing,
          },
          400
        );
      }

      await db
        .update(teacherAttendances)
        .set({
          checkOut: currentTime,
          checkOutLatitude: data.latitude?.toString(),
          checkOutLongitude: data.longitude?.toString(),
          notes: data.notes || existing.notes,
        })
        .where(eq(teacherAttendances.id, existing.id));

      const updated = await db.query.teacherAttendances.findFirst({
        where: eq(teacherAttendances.id, existing.id),
      });

      return c.json({
        success: true,
        message: "Check-out successful",
        data: updated,
      });
    } catch (error) {
      console.error("Check-out error:", error);
      return c.json({ success: false, message: "Failed to check out" }, 500);
    }
  }
);

export default attendanceRoute;
