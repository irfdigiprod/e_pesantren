import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { z } from "zod";
import {
  permissionRequests,
  teacherAttendances,
  teachers,
  settings,
} from "../db/schema";
import { authMiddleware, requirePermission } from "../middleware/auth";
import {
  createPermissionSchema,
  updatePermissionStatusSchema,
} from "../validators/permissions";
import { createNotification, notifyAdmins } from "../utils/notifications";
import { rolePermissions, userPermissions } from "../db/schema/permissions";

const permissionsRoute = new Hono();

permissionsRoute.use("*", authMiddleware);

// Helper function to check if user has permission to view all permissions
async function hasPermissionToViewAll(user: any): Promise<boolean> {
  try {
    // Check user-specific permissions first
    const userPerm = await db.query.userPermissions.findFirst({
      where: and(
        eq(userPermissions.userId, user.userId),
        eq(userPermissions.routePath, "/apps/attendance/approvals"),
      ),
    });

    if (userPerm) {
      return userPerm.isAllowed;
    }

    // Check role-based permissions
    const rolePerm = await db.query.rolePermissions.findFirst({
      where: and(
        eq(rolePermissions.role, user.role),
        eq(rolePermissions.routePath, "/apps/attendance/approvals"),
      ),
    });

    return rolePerm?.isAllowed ?? false;
  } catch (error) {
    console.error("Error checking view all permissions:", error);
    return false;
  }
}

// Get My Permissions (or All if Admin/Has Permission)
permissionsRoute.get("/", async (c) => {
  try {
    const user = c.get("user");
    let results;

    // Check if user has admin role OR has explicit permission to manage permissions
    const hasFullAccess =
      user.role === "admin" || (await hasPermissionToViewAll(user));

    if (hasFullAccess) {
      // Admin or authorized user sees all permissions
      const teacherId = c.req.query("teacherId");
      if (teacherId) {
        results = await db.query.permissionRequests.findMany({
          where: eq(permissionRequests.teacherId, parseInt(teacherId)),
          orderBy: [desc(permissionRequests.createdAt)],
          with: { teacher: true },
        });
      } else {
        // Fetch all permissions
        const allPermissions = await db
          .select()
          .from(permissionRequests)
          .orderBy(desc(permissionRequests.createdAt));

        // Fetch teachers manually to avoid join issues
        const teacherIds = [...new Set(allPermissions.map((p) => p.teacherId))];

        let teachersMap = new Map();
        if (teacherIds.length > 0) {
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
          teacherGender: teachersMap.get(p.teacherId)?.gender,
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
          404,
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
      500,
    );
  }
});

// Get My Own Permissions Only (regardless of role - for PermissionList page)
permissionsRoute.get("/mine", async (c) => {
  try {
    const user = c.get("user");

    // Find teacher profile for current user
    const myTeacher = await db.query.teachers.findFirst({
      where: eq(teachers.userId, user.userId),
    });

    if (!myTeacher) {
      return c.json({
        success: true,
        data: [], // Return empty if no teacher profile
      });
    }

    // Always return only current user's permissions
    const results = await db.query.permissionRequests.findMany({
      where: eq(permissionRequests.teacherId, myTeacher.id),
      orderBy: [desc(permissionRequests.createdAt)],
    });

    return c.json({ success: true, data: results });
  } catch (e) {
    console.error("Get my permissions error", e);
    return c.json(
      {
        success: false,
        message:
          "Failed to fetch permissions: " +
          (e instanceof Error ? e.message : String(e)),
      },
      500,
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
          403,
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

      // Submit Permission Notification -> Notify Admins
      // Need user name for notification message
      const userName = teacherProfile.fullName || user.email.split("@")[0];

      // Fire and forget notification
      notifyAdmins(
        "permission_request",
        "Pengajuan Izin Baru",
        `${userName} mengajukan izin: ${payload.reason}`,
        {
          permissionId: null, // Insert ID not easily available with simple insert if not returned, but insert returns result object in mysql usually
          teacherId,
          type: payload.type,
        },
      );

      return c.json({
        success: true,
        message: "Pengajuan izin berhasil dikirim.",
      });
    } catch (e) {
      console.error("Submit permission error", e);
      return c.json(
        { success: false, message: "Failed to submit permission" },
        500,
      );
    }
  },
);

// Approve/Reject (Admin)
permissionsRoute.post(
  "/:id/status",
  requirePermission("/security/roles"),
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
          rejectionReason:
            status === "rejected" ? c.req.valid("json").rejectionReason : null,
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
        } else if (req.type === "leave") {
          attendStatus = deductSalary ? "leave_deduct" : "leave_no_deduct";
        } else {
          attendStatus = deductSalary ? "permit_deduct" : "permit_no_deduct";
        }

        // Loop dates
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          // Skip weekly holidays
          if (holidays.includes(d.getDay())) {
            continue;
          }

          const isoDate = (d.toISOString().split("T")[0]) as string;

          // Check if attendance already exists
          const existing = await db.query.teacherAttendances.findFirst({
            where: and(
              eq(teacherAttendances.teacherId, req.teacherId),
              eq(teacherAttendances.date, isoDate as any),
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
      } // End of attendance loop

      // Notify User (Teacher)
      const teacherRecord = await db.query.teachers.findFirst({
        where: eq(teachers.id, req.teacherId),
      });

      if (teacherRecord && teacherRecord.userId) {
        const title =
          status === "approved"
            ? "Pengajuan Izin Disetujui"
            : "Pengajuan Izin Ditolak";
        const message = `Pengajuan izin Anda untuk tanggal ${
          req.startDate
        } telah ${status === "approved" ? "disetujui" : "ditolak"}.`;

        createNotification(
          teacherRecord.userId,
          "permission_status",
          title,
          message,
          { permissionId: id, status },
        );
      }

      return c.json({ success: true, message: `Request ${status}` });
    } catch (e) {
      console.error("Update status error", e);
      return c.json(
        { success: false, message: "Failed to update status" },
        500,
      );
    }
  },
);

// Manage Permission by Date (Toggle/Delete)
permissionsRoute.post(
  "/manage-by-date",
  requirePermission("/security/roles"),
  zValidator(
    "json",
    z.object({
      action: z.enum(["toggle", "delete"]),
      teacherId: z.number(),
      date: z.string(), // YYYY-MM-DD
    }),
  ),
  async (c) => {
    const { action, teacherId, date } = c.req.valid("json");

    try {
      // 1. Find the Approved Request covering this date
      const requests = await db.query.permissionRequests.findMany({
        where: and(
          eq(permissionRequests.teacherId, teacherId),
          eq(permissionRequests.status, "approved"),
        ),
      });

      const targetDate = new Date(date);
      const req = requests.find((r) => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        return targetDate >= start && targetDate <= end;
      });

      if (!req) {
        return c.json(
          {
            success: false,
            message: "No active permission found for this date.",
          },
          404,
        );
      }

      if (action === "toggle") {
        // Find all attendance records for this request
        // We match by date range and teacherId
        const start = new Date(req.startDate).toISOString().split("T")[0];
        const end = new Date(req.endDate).toISOString().split("T")[0];

        const attendances = await db.query.teacherAttendances.findMany({
          where: and(
            eq(teacherAttendances.teacherId, teacherId),
            sql`${teacherAttendances.date} >= ${start}`,
            sql`${teacherAttendances.date} <= ${end}`,
          ),
        });

        // Toggle Logic
        // We check the first record to determine current state
        if (attendances.length === 0) {
          return c.json({
            success: false,
            message: "No attendance records found to toggle.",
          });
        }

        const currentStatus = attendances[0]?.status;
        let newStatus: string | null = null;
        let newNoteSuffix = "";

        if (
          currentStatus === "permit_deduct" ||
          currentStatus === "sick_deduct" ||
          currentStatus === "leave_deduct"
        ) {
          // Switch to No Deduct
          newStatus =
            currentStatus === "sick_deduct"
              ? "sick_no_deduct"
              : currentStatus === "leave_deduct"
              ? "leave_no_deduct"
              : "permit_no_deduct";
          newNoteSuffix = " (Tidak Potong Gaji)";
        } else if (
          currentStatus === "permit_no_deduct" ||
          currentStatus === "sick_no_deduct" ||
          currentStatus === "leave_no_deduct"
        ) {
          // Switch to Deduct
          newStatus =
            currentStatus === "sick_no_deduct"
              ? "sick_deduct"
              : currentStatus === "leave_no_deduct"
              ? "leave_deduct"
              : "permit_deduct";
          newNoteSuffix = " (Potong Gaji)";
        } else {
          // Use req.type to decide default if somehow status is weird
          // But usually we just return error if not a toggleable status
          // Fallback legacy "permitted" -> "permit_deduct"
          if (currentStatus === "permitted") newStatus = "permit_deduct";
          else if (currentStatus === "sick") newStatus = "sick_deduct";
          else if ((currentStatus as any) === "leave") newStatus = "leave_deduct";
        }

        if (newStatus) {
          // Update all
          for (const att of attendances) {
            await db
              .update(teacherAttendances)
              .set({
                status: newStatus as any,
                notes: `Updated Permission: ${req.reason}${newNoteSuffix}`,
              })
              .where(eq(teacherAttendances.id, att.id));
          }

          return c.json({
            success: true,
            message: "Permission status toggled successfully.",
          });
        } else {
          return c.json(
            {
              success: false,
              message: "Current status cannot be toggled.",
            },
            400,
          );
        }
      } else if (action === "delete") {
        // Delete Permission Request and Attendances
        const start = new Date(req.startDate).toISOString().split("T")[0];
        const end = new Date(req.endDate).toISOString().split("T")[0];

        // 1. Delete Attendances
        await db
          .delete(teacherAttendances)
          .where(
            and(
              eq(teacherAttendances.teacherId, teacherId),
              sql`${teacherAttendances.date} >= ${start}`,
              sql`${teacherAttendances.date} <= ${end}`,
            ),
          );

        // 2. Delete Request
        await db
          .delete(permissionRequests)
          .where(eq(permissionRequests.id, req.id));

        return c.json({
          success: true,
          message: "Permission and attendance records deleted.",
        });
      }

      return c.json({ success: false, message: "Invalid action." }, 400);
    } catch (e) {
      console.error("Manage permission error", e);
      return c.json(
        { success: false, message: "Failed to manage permission." },
        500,
      );
    }
  },
);

export default permissionsRoute;
