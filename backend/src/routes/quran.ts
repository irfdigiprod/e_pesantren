import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { quranMemorizations } from "../db/schema/quran-memorization";
import { authMiddleware, requireRole } from "../middleware/auth";
import {
  createMemorizationSchema,
  updateMemorizationSchema,
} from "../validators/quran";

const quranRoute = new Hono();

// Apply auth to all routes
quranRoute.use("*", authMiddleware);

// Get all memorizations
quranRoute.get("/memorizations", async (c) => {
  try {
    const memorizations = await db.query.quranMemorizations.findMany();

    return c.json({
      success: true,
      data: memorizations,
    });
  } catch (error) {
    console.error("Get memorizations error:", error);
    return c.json(
      { success: false, message: "Failed to get memorizations" },
      500
    );
  }
});

// Get memorizations by student ID
quranRoute.get("/memorizations/student/:studentId", async (c) => {
  try {
    const studentId = parseInt(c.req.param("studentId"));
    const memorizations = await db.query.quranMemorizations.findMany({
      where: eq(quranMemorizations.studentId, studentId),
    });

    return c.json({
      success: true,
      data: memorizations,
    });
  } catch (error) {
    console.error("Get student memorizations error:", error);
    return c.json(
      { success: false, message: "Failed to get memorizations" },
      500
    );
  }
});

// Get memorization by ID
quranRoute.get("/memorizations/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const memorization = await db.query.quranMemorizations.findFirst({
      where: eq(quranMemorizations.id, id),
    });

    if (!memorization) {
      return c.json({ success: false, message: "Memorization not found" }, 404);
    }

    return c.json({
      success: true,
      data: memorization,
    });
  } catch (error) {
    console.error("Get memorization error:", error);
    return c.json(
      { success: false, message: "Failed to get memorization" },
      500
    );
  }
});

// Create memorization
quranRoute.post(
  "/memorizations",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", createMemorizationSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const user = c.get("user");

      const result = await db.insert(quranMemorizations).values({
        studentId: data.studentId,
        surahNumber: data.surahNumber,
        surahName: data.surahName,
        juz: data.juz,
        startAyah: data.startAyah,
        endAyah: data.endAyah,
        status: data.status || "memorizing",
        grade: data.grade,
        score: data.score,
        teacherId: data.teacherId,
        memorizedAt: data.memorizedAt ? new Date(data.memorizedAt) : new Date(),
        notes: data.notes,
      });

      const newMemorization = await db.query.quranMemorizations.findFirst({
        where: eq(quranMemorizations.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Memorization added successfully",
        data: newMemorization,
      });
    } catch (error) {
      console.error("Create memorization error:", error);
      return c.json(
        { success: false, message: "Failed to add memorization" },
        500
      );
    }
  }
);

// Update memorization
quranRoute.put(
  "/memorizations/:id",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", updateMemorizationSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.quranMemorizations.findFirst({
        where: eq(quranMemorizations.id, id),
      });

      if (!existing) {
        return c.json(
          { success: false, message: "Memorization not found" },
          404
        );
      }

      await db
        .update(quranMemorizations)
        .set({
          ...data,
          memorizedAt: data.memorizedAt
            ? new Date(data.memorizedAt)
            : undefined,
        })
        .where(eq(quranMemorizations.id, id));

      const updated = await db.query.quranMemorizations.findFirst({
        where: eq(quranMemorizations.id, id),
      });

      return c.json({
        success: true,
        message: "Memorization updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update memorization error:", error);
      return c.json(
        { success: false, message: "Failed to update memorization" },
        500
      );
    }
  }
);

// Delete memorization
quranRoute.delete(
  "/memorizations/:id",
  requireRole("admin", "teacher"),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));

      const existing = await db.query.quranMemorizations.findFirst({
        where: eq(quranMemorizations.id, id),
      });

      if (!existing) {
        return c.json(
          { success: false, message: "Memorization not found" },
          404
        );
      }

      await db.delete(quranMemorizations).where(eq(quranMemorizations.id, id));

      return c.json({
        success: true,
        message: "Memorization deleted successfully",
      });
    } catch (error) {
      console.error("Delete memorization error:", error);
      return c.json(
        { success: false, message: "Failed to delete memorization" },
        500
      );
    }
  }
);

export default quranRoute;
