import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "../db";
import {
  salarySettings,
  positionAllowances,
  tenureAllowances,
  customAllowances,
} from "../db/schema/salary";
import { authMiddleware, requirePermission } from "../middleware/auth";
import {
  updateSalarySettingsSchema,
  createPositionAllowanceSchema,
  updatePositionAllowanceSchema,
  createTenureAllowanceSchema,
  updateTenureAllowanceSchema,
  createCustomAllowanceSchema,
  updateCustomAllowanceSchema,
} from "../validators/salary";

const salaryRoute = new Hono();

// Middleware: Auth required, mostly admin/staff access
salaryRoute.use("*", authMiddleware);
salaryRoute.use("*", async (c, next) => {
  // Bypass middleware for salary report routes to avoid conflicts
  if (c.req.path.includes("/reports")) {
    await next();
    return;
  }
  return requirePermission("/settings/salary-grading")(c, next);
});

// Get all settings and allowances configuration
salaryRoute.get("/settings", async (c) => {
  try {
    // Get global settings (create default if not exists)
    let settings = await db.query.salarySettings.findFirst();
    if (!settings) {
      await db.insert(salarySettings).values({});
      settings = await db.query.salarySettings.findFirst();
    }

    // Get all master data lists
    const positions = await db.query.positionAllowances.findMany({
      orderBy: [asc(positionAllowances.position)],
    });

    const tenures = await db.query.tenureAllowances.findMany({
      orderBy: [asc(tenureAllowances.minYears)],
    });

    const customs = await db.query.customAllowances.findMany({
      orderBy: [asc(customAllowances.name)],
    });

    return c.json({
      success: true,
      data: {
        settings,
        positions,
        tenures,
        customs,
      },
    });
  } catch (error) {
    console.error("Get salary settings error:", error);
    return c.json(
      { success: false, message: "Failed to get salary settings" },
      500
    );
  }
});

// Update global settings
salaryRoute.put(
  "/settings",
  zValidator("json", updateSalarySettingsSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      let settings = await db.query.salarySettings.findFirst();

      if (settings) {
        await db
          .update(salarySettings)
          .set({
            ...data,
            // Convert numbers to strings for decimal fields if needed,
            // but Drizzle/MySQL driver usually handles basic number->decimal
            dailyAttendanceRate: data.dailyAttendanceRate
              ? String(data.dailyAttendanceRate)
              : undefined,
            healthAllowance: data.healthAllowance
              ? String(data.healthAllowance)
              : undefined,
            teachingHourRate: data.teachingHourRate
              ? String(data.teachingHourRate)
              : undefined,
            housingAllowance: data.housingAllowance
              ? String(data.housingAllowance)
              : undefined,
            transportAllowance: data.transportAllowance
              ? String(data.transportAllowance)
              : undefined,
          })
          .where(eq(salarySettings.id, settings.id));
      } else {
        // Should not happen as GET creates it, but safe to insert
        await db.insert(salarySettings).values({
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
      }

      const updated = await db.query.salarySettings.findFirst();
      return c.json({ success: true, data: updated });
    } catch (error) {
      console.error("Update salary settings error:", error);
      return c.json(
        { success: false, message: "Failed to update salary settings" },
        500
      );
    }
  }
);

// ============ POSITION ALLOWANCES ============

salaryRoute.post(
  "/positions",
  zValidator("json", createPositionAllowanceSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const result = await db.insert(positionAllowances).values({
        position: data.position,
        amount: String(data.amount),
      });

      const newItem = await db.query.positionAllowances.findFirst({
        where: eq(positionAllowances.id, Number(result[0].insertId)),
      });

      return c.json({ success: true, data: newItem });
    } catch (error) {
      console.error("Create position allowance error:", error);
      return c.json({ success: false, message: "Failed to create" }, 500);
    }
  }
);

salaryRoute.put(
  "/positions/:id",
  zValidator("json", updatePositionAllowanceSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      await db
        .update(positionAllowances)
        .set({
          position: data.position,
          amount: data.amount !== undefined ? String(data.amount) : undefined,
        })
        .where(eq(positionAllowances.id, id));

      const updated = await db.query.positionAllowances.findFirst({
        where: eq(positionAllowances.id, id),
      });

      return c.json({ success: true, data: updated });
    } catch (error) {
      console.error("Update position allowance error:", error);
      return c.json({ success: false, message: "Failed to update" }, 500);
    }
  }
);

salaryRoute.delete("/positions/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    await db.delete(positionAllowances).where(eq(positionAllowances.id, id));
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, message: "Failed to delete" }, 500);
  }
});

// ============ TENURE ALLOWANCES ============

salaryRoute.post(
  "/tenure",
  zValidator("json", createTenureAllowanceSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const result = await db.insert(tenureAllowances).values({
        minYears: data.minYears,
        maxYears: data.maxYears,
        amount: String(data.amount),
      });

      const newItem = await db.query.tenureAllowances.findFirst({
        where: eq(tenureAllowances.id, Number(result[0].insertId)),
      });

      return c.json({ success: true, data: newItem });
    } catch (error) {
      console.error("Create tenure allowance error:", error);
      return c.json({ success: false, message: "Failed to create" }, 500);
    }
  }
);

salaryRoute.put(
  "/tenure/:id",
  zValidator("json", updateTenureAllowanceSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      await db
        .update(tenureAllowances)
        .set({
          minYears: data.minYears,
          maxYears: data.maxYears,
          amount: data.amount !== undefined ? String(data.amount) : undefined,
        })
        .where(eq(tenureAllowances.id, id));

      const updated = await db.query.tenureAllowances.findFirst({
        where: eq(tenureAllowances.id, id),
      });

      return c.json({ success: true, data: updated });
    } catch (error) {
      console.error("Update tenure allowance error:", error);
      return c.json({ success: false, message: "Failed to update" }, 500);
    }
  }
);

salaryRoute.delete("/tenure/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    await db.delete(tenureAllowances).where(eq(tenureAllowances.id, id));
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, message: "Failed to delete" }, 500);
  }
});

// ============ CUSTOM ALLOWANCES ============

salaryRoute.post(
  "/custom",
  zValidator("json", createCustomAllowanceSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const result = await db.insert(customAllowances).values({
        name: data.name,
        amount: String(data.amount),
        isActive: true,
      });

      const newItem = await db.query.customAllowances.findFirst({
        where: eq(customAllowances.id, Number(result[0].insertId)),
      });

      return c.json({ success: true, data: newItem });
    } catch (error) {
      console.error("Create custom allowance error:", error);
      return c.json({ success: false, message: "Failed to create" }, 500);
    }
  }
);

salaryRoute.put(
  "/custom/:id",
  zValidator("json", updateCustomAllowanceSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      await db
        .update(customAllowances)
        .set({
          name: data.name,
          amount: data.amount !== undefined ? String(data.amount) : undefined,
          isActive: data.isActive,
        })
        .where(eq(customAllowances.id, id));

      const updated = await db.query.customAllowances.findFirst({
        where: eq(customAllowances.id, id),
      });

      return c.json({ success: true, data: updated });
    } catch (error) {
      console.error("Update custom allowance error:", error);
      return c.json({ success: false, message: "Failed to update" }, 500);
    }
  }
);

salaryRoute.delete("/custom/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    await db.delete(customAllowances).where(eq(customAllowances.id, id));
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, message: "Failed to delete" }, 500);
  }
});

export default salaryRoute;
