import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, and, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  permissionRequests,
  teacherAttendances,
  teachers,
  settings,
} from "../db/schema";
import { authMiddleware, requireRole } from "../middleware/auth";
import {
  createPermissionSchema,
  updatePermissionStatusSchema,
} from "../validators/permissions";

const permissionsRoute = new Hono();

permissionsRoute.use("*", authMiddleware);

// Get My Permissions (or All if Admin)
permissionsRoute.get("/", async (c) => {
  try {
    const user = c.get("user");
    let results;

    if (user.role === "admin") {
      // Admin sees specific teacher or all
      const teacherId = c.req.query("teacherId");
      if (teacherId) {
        results = await db.query.permissionRequests.findMany({
          where: eq(permissionRequests.teacherId, parseInt(teacherId)),
          orderBy: [desc(permissionRequests.createdAt)],
          with: { teacher: true }, // Assuming relation exists or we just fetch manually
        });
      } else {
        // Fetch all permissions
        const allPermissions = await db
          .select()
          .from(permissionRequests)
          .orderBy(desc(permissionRequests.createdAt));

        // Fetch teachers manually to avoid join issues (lateral join or otherwise)
        const teacherIds = [...new Set(allPermissions.map((p) => p.teacherId))];

        let teachersMap = new Map();
        if (teacherIds.length > 0) {
          // Import inArray dynamically if needed or assume existing import (will check imports)
          // For now, let's just use Promise.all if ID list is small, or use inArray if available.
          // Better: Check imports at top of file, but I am in a replace block.
          // I'll assume I need to add inArray to imports.
          // Let's use a clear findMany for teachers.
          const teachersList = await db.query.teachers.findMany({
            where: (t, { inArray }) => inArray(t.id, teacherIds),
          });

          teachersList.forEach((t) => teachersMap.set(t.id, t));
        }

        results = allPermissions.map((p) => ({
          ...p,
          teacherName: teachersMap.get(p.teacherId)?.fullName,
          teacherNip: teachersMap.get(p.teacherId)?.nip,
          teacherDivision: teachersMap.get(p.teacherId)?.department,
        }));
      }
    } else {
      // Teacher sees own
      // Need to find my teacherId first
      const myTeacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, user.userId),
      });
      if (!myTeacher)
        return c.json(
          {
            success: false,
            message: "Teacher profile not found. Your role is: " + user.role,
          },
          404
        );

      results = await db.query.permissionRequests.findMany({
        where: eq(permissionRequests.teacherId, myTeacher.id),
        orderBy: [desc(permissionRequests.createdAt)],
      });
    }

    return c.json({ success: true, data: results });
  } catch (e) {
    console.error("Get permissions error", e);
    return c.json(
      {
        success: false,
        message:
          "Failed to fetch permissions: " +
          (e instanceof Error ? e.message : String(e)),
      },
      500
    );
  }
});

// Submit Permission
// Submit Permission
permissionsRoute.post(
  "/",
  zValidator("json", createPermissionSchema),
  async (c) => {
    try {
      const user = c.get("user");
      const payload = c.req.valid("json");

      let teacherId: number;
      const teacherProfile = await db.query.teachers.findFirst({
        where: eq(teachers.userId, user.userId),
      });

      if (teacherProfile) {
        teacherId = teacherProfile.id;
      } else {
        return c.json(
          { success: false, message: "Only teachers can submit currently." },
          403
        );
      }

      await db.insert(permissionRequests).values({
        teacherId,
        type: payload.type,
        startDate: new Date(payload.startDate) as any, // Cast for Drizzle date compat
        endDate: new Date(payload.endDate) as any,
        reason: payload.reason,
        attachment: payload.attachment || null,
        status: "pending",
      });

      return c.json({
        success: true,
        message: "Pengajuan izin berhasil dikirim.",
      });
    } catch (e) {
      console.error("Submit permission error", e);
      return c.json(
        { success: false, message: "Failed to submit permission" },
        500
      );
    }
  }
);

// Approve/Reject (Admin)
permissionsRoute.post(
  "/:id/status",
  requireRole("admin"),
  zValidator("json", updatePermissionStatusSchema),
  async (c) => {
    const id = parseInt(c.req.param("id"));
    const { status, deductSalary } = c.req.valid("json");
    const adminUser = c.get("user");

    try {
      const req = await db.query.permissionRequests.findFirst({
        where: eq(permissionRequests.id, id),
      });
      if (!req)
        return c.json({ success: false, message: "Request not found" }, 404);

      // Update status
      await db
        .update(permissionRequests)
        .set({
          status,
          approvedBy: adminUser.userId,
          approvedAt: new Date(),
        })
        .where(eq(permissionRequests.id, id));

      // If Approved, Generate Attendance Records
      if (status === "approved") {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);

        // Fetch holiday settings to skip weekly holidays
        let holidays: number[] = [0]; // Default: Sunday
        try {
          const holidaySetting = await db.query.settings.findFirst({
            where: eq(settings.key, "attendance_holidays"),
          });
          if (holidaySetting?.value) {
            holidays = JSON.parse(holidaySetting.value);
          }
        } catch (e) {
          // Use default if fetch fails
        }

        // Determine attendance status based on type and deductSalary
        let attendStatus: string;
        if (req.type === "sick") {
          attendStatus = deductSalary ? "sick_deduct" : "sick_no_deduct";
        } else {
          attendStatus = deductSalary ? "permit_deduct" : "permit_no_deduct";
        }

        // Loop dates
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          // Skip weekly holidays
          if (holidays.includes(d.getDay())) {
            continue;
          }

          const isoDate = d.toISOString().split("T")[0];

          // Check if attendance already exists
          const existing = await db.query.teacherAttendances.findFirst({
            where: and(
              eq(teacherAttendances.teacherId, req.teacherId),
              eq(teacherAttendances.date, isoDate as any)
            ),
          });

          if (existing) {
            // Update if not present
            if (existing.status !== "present") {
              await db
                .update(teacherAttendances)
                .set({
                  status: attendStatus as any,
                  notes: `Approved Permission: ${req.reason}${
                    deductSalary ? " (Potong Gaji)" : " (Tidak Potong Gaji)"
                  }`,
                })
                .where(eq(teacherAttendances.id, existing.id));
            }
          } else {
            // Create
            const t = await db.query.teachers.findFirst({
              where: eq(teachers.id, req.teacherId),
            });

            if (t) {
              await db.insert(teacherAttendances).values({
                teacherId: t.id,
                teacherName: t.fullName,
                teacherDivision: t.department,
                divisionId: String(t.divisionId || ""),
                date: new Date(isoDate),
                status: attendStatus as any,
                notes: `Approved Permission: ${req.reason}${
                  deductSalary ? " (Potong Gaji)" : " (Tidak Potong Gaji)"
                }`,
              });
            }
          }
        }
      }

      return c.json({ success: true, message: `Request ${status}` });
    } catch (e) {
      console.error("Update status error", e);
      return c.json(
        { success: false, message: "Failed to update status" },
        500
      );
    }
  }
);

export default permissionsRoute;
