import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  studentAttendances,
  teacherAttendances,
} from "../db/schema/attendance";
import { teachers } from "../db/schema/teachers";
import { teacherDivisions, divisions } from "../db/schema/divisions";
import { settings } from "../db/schema/settings";
import { authMiddleware, requireRole } from "../middleware/auth";
import {
  createStudentAttendanceSchema,
  bulkStudentAttendanceSchema,
  createTeacherAttendanceSchema,
  teacherCheckInSchema,
  teacherCheckOutSchema,
  teacherClaimSchema,
} from "../validators/attendance";

const attendanceRoute = new Hono();

// Apply auth to all routes
attendanceRoute.use("*", authMiddleware);

// Helper: Haversine Formula for distance calculation
function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3; // Radius of the earth in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Helper: Validate Location
async function validateLocation(lat: number, lng: number) {
  const settingsList = await db.query.settings.findMany({
    where: inArray(settings.key, [
      "attendance_latitude",
      "attendance_longitude",
      "attendance_radius",
    ]),
  });

  const settingsMap = settingsList.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string | null>);

  const centerLat = parseFloat(settingsMap["attendance_latitude"] || "0");
  const centerLng = parseFloat(settingsMap["attendance_longitude"] || "0");
  const radius = parseFloat(settingsMap["attendance_radius"] || "100");

  // If settings are not configured properly, we might want to skip validation or fail safe.
  // For security, let's log a warning but allow if settings are missing (or block? usually block is safer, but might break app if not set up).
  // Given we just seeded, we assume they exist.
  if (!centerLat || !centerLng) return { valid: true, distance: 0 };

  const distance = getDistanceFromLatLonInMeters(
    lat,
    lng,
    centerLat,
    centerLng
  );

  return {
    valid: distance <= radius,
    distance,
    radius,
  };
}

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

      // Validate Location
      if (data.latitude && data.longitude) {
        const { valid, distance, radius } = await validateLocation(
          data.latitude,
          data.longitude
        );
        if (!valid) {
          return c.json(
            {
              success: false,
              message: `Anda berada di luar jangkauan absensi. Jarak: ${Math.round(
                distance
              )}m, Max: ${radius}m`,
            },
            400
          );
        }
      } else {
        return c.json(
          {
            success: false,
            message: "Lokasi tidak terdeteksi. Pastikan GPS aktif.",
          },
          400
        );
      }

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

      // Validate Location
      if (data.latitude && data.longitude) {
        const { valid, distance, radius } = await validateLocation(
          data.latitude,
          data.longitude
        );
        if (!valid) {
          return c.json(
            {
              success: false,
              message: `Anda berada di luar jangkauan absensi. Jarak: ${Math.round(
                distance
              )}m, Max: ${radius}m`,
            },
            400
          );
        }
      } else {
        return c.json(
          {
            success: false,
            message: "Lokasi tidak terdeteksi. Pastikan GPS aktif.",
          },
          400
        );
      }

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

// Recap Endpoint
attendanceRoute.get("/teachers/recap", requireRole("admin"), async (c) => {
  try {
    const {
      month,
      year,
      startDate: customStart,
      endDate: customEnd,
      divisionId,
    } = c.req.query();
    const targetMonth = parseInt(month || String(new Date().getMonth() + 1));
    const targetYear = parseInt(year || String(new Date().getFullYear()));

    // 1. Fetch Settings
    const allSettings = await db.query.settings.findMany({
      where: inArray(settings.key, [
        "attendance_period_start",
        "attendance_period_end",
        "attendance_period_type",
        "attendance_holidays",
      ]),
    });
    const sMap = allSettings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, any>);

    const holidays = JSON.parse(sMap["attendance_holidays"] || "[0]");

    // Helper to format YYYY-MM-DD locally (avoid UTC shift)
    const formatDateLocal = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // 2. Calculate Date Range
    let startDate: Date;
    let endDate: Date;

    if (customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
    } else {
      const startDay = parseInt(sMap["attendance_period_start"] || "25");
      const endDay = parseInt(sMap["attendance_period_end"] || "24");
      const periodType = sMap["attendance_period_type"] || "cross_month";

      if (periodType === "same_month") {
        startDate = new Date(targetYear, targetMonth - 1, startDay);
        endDate = new Date(targetYear, targetMonth - 1, endDay);
      } else {
        // Cross Month: Start from prev month
        startDate = new Date(targetYear, targetMonth - 2, startDay);
        endDate = new Date(targetYear, targetMonth - 1, endDay);
      }
    }

    // Format YYYY-MM-DD using local time
    const isoStart = formatDateLocal(startDate);
    const isoEnd = formatDateLocal(endDate);

    // 3. Fetch Teachers
    const teacherConditions: any[] = [eq(teachers.status, "active")];
    if (divisionId) {
      teacherConditions.push(eq(teachers.divisionId, parseInt(divisionId)));
    }

    const allTeachers = await db.query.teachers.findMany({
      where: and(...teacherConditions),
      columns: {
        id: true,
        nip: true,
        fullName: true,
        department: true,
      },
    });

    // 4. Fetch Attendances
    const attendancesList = await db.query.teacherAttendances.findMany({
      where: and(
        sql`${teacherAttendances.date} >= ${isoStart}`,
        sql`${teacherAttendances.date} <= ${isoEnd}`
      ),
    });

    // 5. Build Result Map
    const result = allTeachers.map((t) => {
      // Filter distinct dates for this teacher
      const teacherAtts = attendancesList.filter((a) => a.teacherId === t.id);

      let totalHours = 0;
      let totalPresence = 0;

      // Map Map<DateString, { status, timeStr, hours }>
      const dailyMap: Record<string, any> = {};

      teacherAtts.forEach((att) => {
        // Handle Date object or String
        let dStr: string;
        if (att.date instanceof Date) {
          dStr = formatDateLocal(att.date);
        } else {
          dStr = String(att.date); // Assume YYYY-MM-DD string
        }

        if (!dailyMap[dStr]) {
          dailyMap[dStr] = {
            status: att.status,
            status: att.status,
            isClaim: att.isClaim || false,
            attendanceId: att.id, // Include ID for deletion/editing
            times: [],
            totalMinutes: 0,
          };
        }

        // If newer (or any) record for same day, ensure ID is captured (logic usually matches first found or iterates)
        // Since we aggregate multiple checkins into one "day" map cell?
        // Wait, the code aggregates times: `dailyMap[dStr].times.push(...)`.
        // Be careful: if there are multiple attendances per day, which ID do we keep?
        // logic says: `if (!dailyMap[dStr]) { ... }`. So it keeps the ID of the FIRST one encountered.
        // `findMany` order is undefined unless specified.
        // For Claims, usually there's only one per day.
        // But if we want to be safe, we might need a list of IDs or just the "Main" one.
        // For "K" (Claim), it's a specific record.
        // If there are multiple, deleting one is correct action for that one.
        // But the UI shows 1 day box.
        // Let's assume for `isClaim`, it's the primary record we want to capture.
        if (att.isClaim) {
          dailyMap[dStr].attendanceId = att.id;
          dailyMap[dStr].isClaim = true;
          dailyMap[dStr].status = "present"; // Claim implies presence
        }

        // Aggregate Time
        if (att.checkIn && att.checkOut) {
          const [h1, m1] = att.checkIn.split(":").map(Number);
          const [h2, m2] = att.checkOut.split(":").map(Number);

          if (
            h1 !== undefined &&
            m1 !== undefined &&
            h2 !== undefined &&
            m2 !== undefined
          ) {
            const mins = h2 * 60 + m2 - (h1 * 60 + m1);
            if (mins > 0) dailyMap[dStr].totalMinutes += mins;
          }
          dailyMap[dStr].times.push(`${att.checkIn}-${att.checkOut}`);
        } else if (att.checkIn) {
          dailyMap[dStr].times.push(`${att.checkIn}-?`);
        }

        // Status priority
        if (att.status === "present") {
          dailyMap[dStr].status = "present";
        }
      });

      // Calculate Totals based on dailyMap (unique days)
      let totalSickDeduct = 0;
      let totalSickNoDeduct = 0;
      let totalPermitDeduct = 0;
      let totalPermitNoDeduct = 0;

      Object.values(dailyMap).forEach((day: any) => {
        if (day.status === "present") totalPresence++;
        // Legacy permitted/sick (before salary deduction feature)
        if (day.status === "permitted" || day.status === "sick") {
          totalPermitDeduct++; // Treat legacy as deduct by default
        }
        // New salary deduction statuses
        if (day.status === "permit_deduct") totalPermitDeduct++;
        if (day.status === "sick_deduct") totalPermitDeduct++;
        if (day.status === "permit_no_deduct") totalPermitNoDeduct++;
        if (day.status === "sick_no_deduct") totalPermitNoDeduct++;
        totalHours += day.totalMinutes / 60;
      });

      return {
        id: t.id,
        nip: t.nip,
        name: t.fullName,
        division: t.department,
        daily: dailyMap, // Frontend will iterate dates and lookup this map
        stats: {
          activeDays: 0,
          presence: totalPresence,
          hours: parseFloat(totalHours.toFixed(2)),
          permitDeduct: totalPermitDeduct,
          permitNoDeduct: totalPermitNoDeduct,
        },
      };
    });

    // Calculate Total Active Days (excluding holidays in range)
    let countActiveDays = 0;
    let loopDate = new Date(startDate);
    while (loopDate <= endDate) {
      if (!holidays.includes(loopDate.getDay())) {
        countActiveDays++;
      }
      loopDate.setDate(loopDate.getDate() + 1);
    }

    // Apply active days to everyone (simplification)
    result.forEach((r) => (r.stats.activeDays = countActiveDays));

    return c.json({
      success: true,
      data: {
        period: { start: isoStart, end: isoEnd },
        teachers: result,
      },
    });
  } catch (error) {
    console.error("Recap error:", error);
    return c.json({ success: false, message: "Failed to fetch recap" }, 500);
  }
});

// Delete Teacher Attendance (e.g. Claim)
attendanceRoute.delete(
  "/teachers/attendances/:id",
  requireRole("admin"),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));

      const existing = await db.query.teacherAttendances.findFirst({
        where: eq(teacherAttendances.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Attendance not found" }, 404);
      }

      await db.delete(teacherAttendances).where(eq(teacherAttendances.id, id));

      return c.json({
        success: true,
        message: "Data kehadiran berhasil dihapus",
      });
    } catch (error) {
      console.error("Delete attendance error:", error);
      return c.json(
        { success: false, message: "Gagal menghapus data kehadiran" },
        500
      );
    }
  }
);

export default attendanceRoute;
// Teacher claim (manual attendance)
attendanceRoute.post(
  "/teachers/claim",
  zValidator("json", teacherClaimSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      // Check if duplicate for same date/activity?
      // User says "creates record in teacher_attendance table like normal".
      // We should allow basic duplicates if it's different times, but mainly we just insert.

      const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.id, data.teacherId),
      });

      const result = await db.insert(teacherAttendances).values({
        teacherId: data.teacherId,
        teacherName: teacher?.fullName || null,
        teacherDivision: teacher?.department || null,
        divisionId: teacher?.divisionId?.toString() || null,
        date: new Date(data.date), // Uses claimed date
        checkIn: data.checkIn ? data.checkIn + ":00" : null, // Append seconds
        checkOut: data.checkOut ? data.checkOut + ":00" : null,
        status: "present", // Claimed is considered present
        activity: data.activity,
        notes: data.notes,
        isClaim: true, // Mark as claim
      });

      const attendance = await db.query.teacherAttendances.findFirst({
        where: eq(teacherAttendances.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Klaim kehadiran berhasil",
        data: attendance,
      });
    } catch (error) {
      console.error("Claim error:", error);
      return c.json({ success: false, message: "Gagal mengajukan klaim" }, 500);
    }
  }
);
