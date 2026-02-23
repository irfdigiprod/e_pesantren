import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "../db";
import { salaryGrades } from "../db/schema/salary";
import { authMiddleware, requirePermission } from "../middleware/auth";
import {
  createSalaryGradeSchema,
  updateSalaryGradeSchema,
} from "../validators/salary";

const salaryGradesRoute = new Hono();

// Middleware: Auth required, admin/staff access
salaryGradesRoute.use("*", authMiddleware);
salaryGradesRoute.use("*", requirePermission("/settings/salary-grading"));

// GET all grades
salaryGradesRoute.get("/", async (c) => {
  try {
    const grades = await db.query.salaryGrades.findMany({
      orderBy: [asc(salaryGrades.name)],
    });
    return c.json({ success: true, data: grades });
  } catch (error) {
    console.error("Get salary grades error:", error);
    return c.json(
      { success: false, message: "Failed to get salary grades" },
      500
    );
  }
});

// GET single grade
salaryGradesRoute.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const grade = await db.query.salaryGrades.findFirst({
      where: eq(salaryGrades.id, id),
    });
    if (!grade) {
      return c.json({ success: false, message: "Grade not found" }, 404);
    }
    return c.json({ success: true, data: grade });
  } catch (error) {
    return c.json(
      { success: false, message: "Failed to get salary grade" },
      500
    );
  }
});

// CREATE grade
salaryGradesRoute.post(
  "/",
  zValidator("json", createSalaryGradeSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const result = await db.insert(salaryGrades).values({
        name: data.name,
        baseSalary: data.baseSalary ? String(data.baseSalary) : "0",
        dailyAttendanceRate: data.dailyAttendanceRate
          ? String(data.dailyAttendanceRate)
          : "0",
        healthAllowance: data.healthAllowance
          ? String(data.healthAllowance)
          : "0",
        teachingHourRate: data.teachingHourRate
          ? String(data.teachingHourRate)
          : "0",
        housingAllowance: data.housingAllowance
          ? String(data.housingAllowance)
          : "0",
        transportAllowance: data.transportAllowance
          ? String(data.transportAllowance)
          : "0",
      });

      const newItem = await db.query.salaryGrades.findFirst({
        where: eq(salaryGrades.id, Number(result[0].insertId)),
      });

      return c.json({ success: true, data: newItem });
    } catch (error) {
      console.error("Create salary grade error:", error);
      return c.json(
        { success: false, message: "Failed to create salary grade" },
        500
      );
    }
  }
);

// UPDATE grade
salaryGradesRoute.put(
  "/:id",
  zValidator("json", updateSalaryGradeSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      await db
        .update(salaryGrades)
        .set({
          name: data.name,
          baseSalary:
            data.baseSalary !== undefined ? String(data.baseSalary) : undefined,
          dailyAttendanceRate:
            data.dailyAttendanceRate !== undefined
              ? String(data.dailyAttendanceRate)
              : undefined,
          healthAllowance:
            data.healthAllowance !== undefined
              ? String(data.healthAllowance)
              : undefined,
          teachingHourRate:
            data.teachingHourRate !== undefined
              ? String(data.teachingHourRate)
              : undefined,
          housingAllowance:
            data.housingAllowance !== undefined
              ? String(data.housingAllowance)
              : undefined,
          transportAllowance:
            data.transportAllowance !== undefined
              ? String(data.transportAllowance)
              : undefined,
        })
        .where(eq(salaryGrades.id, id));

      const updated = await db.query.salaryGrades.findFirst({
        where: eq(salaryGrades.id, id),
      });

      return c.json({ success: true, data: updated });
    } catch (error) {
      console.error("Update salary grade error:", error);
      return c.json(
        { success: false, message: "Failed to update salary grade" },
        500
      );
    }
  }
);

// DELETE grade
salaryGradesRoute.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    // TODO: Check if any teacher is assigned to this grade before deleting?
    // For now, let's allow delete but maybe we should set teacher's salaryGradeId to null?
    // Drizzle/MySQL relations might handle this if cascade is set, but we define foreign key loosely.

    await db.delete(salaryGrades).where(eq(salaryGrades.id, id));
    return c.json({ success: true });
  } catch (error) {
    return c.json(
      { success: false, message: "Failed to delete salary grade" },
      500
    );
  }
});

export default salaryGradesRoute;
