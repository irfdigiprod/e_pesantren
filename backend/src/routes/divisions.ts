import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { divisions, teacherDivisions } from "../db/schema/divisions";
import { teachers } from "../db/schema/teachers";
import { authMiddleware, requireRole } from "../middleware/auth";

const divisionsRoute = new Hono();

// Apply auth to all routes
divisionsRoute.use("*", authMiddleware);

// Validation schemas
const createDivisionSchema = z.object({
  name: z.string().min(1, "Nama divisi wajib diisi"),
  description: z.string().optional(),
});

const updateDivisionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

// ============ DIVISIONS CRUD ============

// Get all divisions with member count
divisionsRoute.get("/", async (c) => {
  try {
    const allDivisions = await db.query.divisions.findMany();

    // Get member count for each division
    const divisionsWithCount = await Promise.all(
      allDivisions.map(async (div) => {
        const members = await db.query.teacherDivisions.findMany({
          where: eq(teacherDivisions.divisionId, div.id),
        });
        return {
          ...div,
          memberCount: members.length,
        };
      })
    );

    return c.json({
      success: true,
      data: divisionsWithCount,
    });
  } catch (error) {
    console.error("Get divisions error:", error);
    return c.json({ success: false, message: "Failed to get divisions" }, 500);
  }
});

// Get division by ID with members
divisionsRoute.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const division = await db.query.divisions.findFirst({
      where: eq(divisions.id, id),
    });

    if (!division) {
      return c.json({ success: false, message: "Division not found" }, 404);
    }

    // Get members with teacher details
    const memberRecords = await db.query.teacherDivisions.findMany({
      where: eq(teacherDivisions.divisionId, id),
    });

    const members = await Promise.all(
      memberRecords.map(async (m) => {
        const teacher = await db.query.teachers.findFirst({
          where: eq(teachers.id, m.teacherId),
        });
        return { ...m, teacher };
      })
    );

    return c.json({
      success: true,
      data: { ...division, members },
    });
  } catch (error) {
    console.error("Get division error:", error);
    return c.json({ success: false, message: "Failed to get division" }, 500);
  }
});

// Create division
divisionsRoute.post(
  "/",
  requireRole("admin", "staff"),
  zValidator("json", createDivisionSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const result = await db.insert(divisions).values(data);

      const newDivision = await db.query.divisions.findFirst({
        where: eq(divisions.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Division created successfully",
        data: newDivision,
      });
    } catch (error) {
      console.error("Create division error:", error);
      return c.json(
        { success: false, message: "Failed to create division" },
        500
      );
    }
  }
);

// Update division
divisionsRoute.put(
  "/:id",
  requireRole("admin", "staff"),
  zValidator("json", updateDivisionSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.divisions.findFirst({
        where: eq(divisions.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Division not found" }, 404);
      }

      await db.update(divisions).set(data).where(eq(divisions.id, id));

      const updated = await db.query.divisions.findFirst({
        where: eq(divisions.id, id),
      });

      return c.json({
        success: true,
        message: "Division updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update division error:", error);
      return c.json(
        { success: false, message: "Failed to update division" },
        500
      );
    }
  }
);

// Delete division
divisionsRoute.delete("/:id", requireRole("admin"), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    // Delete all member relationships first
    await db
      .delete(teacherDivisions)
      .where(eq(teacherDivisions.divisionId, id));

    await db.delete(divisions).where(eq(divisions.id, id));

    return c.json({
      success: true,
      message: "Division deleted successfully",
    });
  } catch (error) {
    console.error("Delete division error:", error);
    return c.json(
      { success: false, message: "Failed to delete division" },
      500
    );
  }
});

// ============ DIVISION MEMBERS ============

// Get members of a division
divisionsRoute.get("/:id/members", async (c) => {
  try {
    const divisionId = parseInt(c.req.param("id"));

    const memberRecords = await db.query.teacherDivisions.findMany({
      where: eq(teacherDivisions.divisionId, divisionId),
    });

    const members = await Promise.all(
      memberRecords.map(async (m) => {
        const teacher = await db.query.teachers.findFirst({
          where: eq(teachers.id, m.teacherId),
        });
        return { ...m, teacher };
      })
    );

    return c.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("Get division members error:", error);
    return c.json({ success: false, message: "Failed to get members" }, 500);
  }
});

// Add member to division
divisionsRoute.post(
  "/:id/members",
  requireRole("admin", "staff"),
  async (c) => {
    try {
      const divisionId = parseInt(c.req.param("id"));
      const body = await c.req.json();
      const teacherId = body.teacherId;
      const force = body.force === true; // Force move from another division

      if (!teacherId) {
        return c.json(
          { success: false, message: "Teacher ID is required" },
          400
        );
      }

      // Check if already member of THIS division
      const existingInSame = await db.query.teacherDivisions.findFirst({
        where: and(
          eq(teacherDivisions.divisionId, divisionId),
          eq(teacherDivisions.teacherId, teacherId)
        ),
      });

      if (existingInSame) {
        return c.json(
          { success: false, message: "Guru sudah menjadi anggota divisi ini" },
          400
        );
      }

      // Check if teacher is in ANY OTHER division
      const existingInOther = await db.query.teacherDivisions.findFirst({
        where: eq(teacherDivisions.teacherId, teacherId),
      });

      if (existingInOther && !force) {
        // Get the other division name
        const otherDivision = await db.query.divisions.findFirst({
          where: eq(divisions.id, existingInOther.divisionId),
        });

        return c.json({
          success: false,
          message: `Guru sudah terdaftar di divisi "${
            otherDivision?.name || "lain"
          }"`,
          requiresConfirm: true,
          existingDivision: {
            id: existingInOther.divisionId,
            name: otherDivision?.name || "Divisi Lain",
          },
        });
      }

      // If force=true, remove from other division first
      if (existingInOther && force) {
        await db
          .delete(teacherDivisions)
          .where(eq(teacherDivisions.id, existingInOther.id));
      }

      // Add to new division
      await db.insert(teacherDivisions).values({
        divisionId,
        teacherId,
        role: body.role || "member",
      });

      return c.json({
        success: true,
        message: force
          ? "Guru berhasil dipindahkan ke divisi ini"
          : "Anggota berhasil ditambahkan",
      });
    } catch (error) {
      console.error("Add division member error:", error);
      return c.json(
        { success: false, message: "Gagal menambahkan anggota" },
        500
      );
    }
  }
);

// Remove member from division
divisionsRoute.delete(
  "/:id/members/:teacherId",
  requireRole("admin"),
  async (c) => {
    try {
      const divisionId = parseInt(c.req.param("id"));
      const teacherId = parseInt(c.req.param("teacherId"));

      const existing = await db.query.teacherDivisions.findFirst({
        where: and(
          eq(teacherDivisions.divisionId, divisionId),
          eq(teacherDivisions.teacherId, teacherId)
        ),
      });

      if (!existing) {
        return c.json({ success: false, message: "Member not found" }, 404);
      }

      await db
        .delete(teacherDivisions)
        .where(eq(teacherDivisions.id, existing.id));

      return c.json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      console.error("Remove division member error:", error);
      return c.json(
        { success: false, message: "Failed to remove member" },
        500
      );
    }
  }
);

export default divisionsRoute;
