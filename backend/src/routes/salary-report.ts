import { Hono } from "hono";
import { db } from "../db";
import { and, eq, sql } from "drizzle-orm";
import { teachers } from "../db/schema/teachers";
import { teacherAttendances } from "../db/schema/attendance";
import {
  salarySettings,
  positionAllowances,
  tenureAllowances,
  customAllowances,
} from "../db/schema/salary";
import { authMiddleware, requireRole } from "../middleware/auth";

const salaryReportRoute = new Hono();

salaryReportRoute.use("*", authMiddleware);
salaryReportRoute.use("*", requireRole("admin", "staff"));

salaryReportRoute.get("/", async (c) => {
  try {
    const month = parseInt(
      c.req.query("month") || String(new Date().getMonth() + 1)
    );
    const year = parseInt(
      c.req.query("year") || String(new Date().getFullYear())
    );

    // 1. Get Settings & Master Data
    const positions = await db.query.positionAllowances.findMany();
    const tenures = await db.query.tenureAllowances.findMany();
    const customs = await db.query.customAllowances.findMany({
      where: (customs, { eq }) => eq(customs.isActive, true),
    });

    // 2. Determine Period
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    // Format dates for SQL comparison
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // 3. Get Teachers with Salary Grade and Position Allowance
    const activeTeachers = await db.query.teachers.findMany({
      where: (t, { eq }) => eq(t.status, "active"),
      with: {
        salaryGrade: true,
        positionAllowance: true,
      },
    });

    // 4. Calculate for each teacher
    const reportData = [];

    for (const teacher of activeTeachers) {
      // Get rates from grade or default to 0
      const grade = teacher.salaryGrade;
      const baseSalary = Number(grade?.baseSalary || 0);
      const dailyRate = Number(grade?.dailyAttendanceRate || 0);
      const healthRate = Number(grade?.healthAllowance || 0);
      const teachingHourRate = Number(grade?.teachingHourRate || 0);
      const housingRate = Number(grade?.housingAllowance || 0);
      const transportRate = Number(grade?.transportAllowance || 0);

      // a. Count Attendance
      const attendanceCount = await db
        .select({ count: sql`count(*)` })
        .from(teacherAttendances)
        .where(
          and(
            eq(teacherAttendances.teacherId, teacher.id),
            eq(teacherAttendances.status, "present"),
            sql`${teacherAttendances.date} >= ${startStr}`,
            sql`${teacherAttendances.date} <= ${endStr}`
          )
        );

      const daysPresent = Number(attendanceCount[0]?.count || 0);

      // b. Calculate Components

      // i. Tunjangan Kehadiran
      const attendanceAllowance = daysPresent * dailyRate;

      // ii. Tunjangan Jabatan - Use positionAllowanceId from teacher record
      let positionAllowanceAmount = 0;
      let positionName = teacher.position || "";

      if (teacher.positionAllowance) {
        // Use the assigned position allowance
        positionAllowanceAmount = Number(teacher.positionAllowance.amount);
        positionName = teacher.positionAllowance.position;
      } else if (teacher.positionAllowanceId) {
        // Fallback: find by ID
        const match = positions.find(
          (p) => p.id === teacher.positionAllowanceId
        );
        if (match) {
          positionAllowanceAmount = Number(match.amount);
          positionName = match.position;
        }
      }

      // iii. Tunjangan Masa Kerja
      let tenureAllowance = 0;
      let yearsService = 0;
      if (teacher.joinDate) {
        try {
          const join = new Date(teacher.joinDate);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - join.getTime());
          yearsService = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
        } catch (e) {
          console.error("Date parse error", e);
        }

        const match = tenures.find(
          (t) => yearsService >= t.minYears && yearsService <= t.maxYears
        );
        if (match) tenureAllowance = Number(match.amount);
      }

      // iv. Tunjangan Jam Mengajar - Use teachingHours from teacher record
      const teachingHours = teacher.teachingHours || 0;
      const teachingAllowance = teachingHours * teachingHourRate;

      // v. Custom Allowances
      let customAllowanceTotal = 0;
      const customComponents = [];
      for (const ca of customs) {
        const amount = Number(ca.amount);
        customAllowanceTotal += amount;
        customComponents.push({ name: ca.name, amount });
      }

      // vi. Total Salary
      const totalSalary =
        baseSalary +
        attendanceAllowance +
        positionAllowanceAmount +
        tenureAllowance +
        teachingAllowance +
        customAllowanceTotal +
        healthRate +
        housingRate +
        transportRate;

      reportData.push({
        teacher: {
          id: teacher.id,
          name: teacher.fullName,
          nip: teacher.nip,
          position: positionName,
          joinDate: teacher.joinDate,
          yearsService,
          teachingHours,
          gradeName: grade?.name || "Belum diatur",
          // Additional fields for filtering
          gender: teacher.gender,
          salaryGradeId: teacher.salaryGradeId,
          divisionId: teacher.divisionId,
        },
        baseSalary,
        attendance: {
          days: daysPresent,
          rate: dailyRate,
          total: attendanceAllowance,
        },
        allowances: {
          position: positionAllowanceAmount,
          tenure: tenureAllowance,
          teaching: teachingAllowance,
          health: healthRate,
          housing: housingRate,
          transport: transportRate,
          custom: customComponents,
          customTotal: customAllowanceTotal,
        },
        totalSalary,
      });
    }

    return c.json({
      success: true,
      data: {
        period: { month, year },
        rows: reportData,
      },
    });
  } catch (error) {
    console.error("Salary report error:", error);
    return c.json(
      { success: false, message: "Failed to generate report" },
      500
    );
  }
});

export default salaryReportRoute;
