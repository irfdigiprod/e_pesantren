import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { academicPeriods } from "../db/schema/long-term-foundation";
import { authMiddleware, requirePermission } from "../middleware/auth";
import { writeAuditLog } from "../utils/academic-periods";

const academicPeriodsRoute = new Hono();

academicPeriodsRoute.use("*", authMiddleware);

const periodSchema = z.object({
  academicYear: z.string().min(1, "Tahun ajaran wajib diisi"),
  semester: z.number().int().min(1).max(2),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(["draft", "active", "locked", "archived"]).optional(),
  notes: z.string().optional().nullable(),
});

const updatePeriodSchema = periodSchema.partial();

function toDate(value?: string | null) {
  return value ? new Date(value) : null;
}

academicPeriodsRoute.get("/", async (c) => {
  try {
    const status = c.req.query("status");
    const academicYear = c.req.query("academicYear");
    const semester = c.req.query("semester");

    const conditions: any[] = [];
    if (status) conditions.push(eq(academicPeriods.status, status as any));
    if (academicYear) conditions.push(eq(academicPeriods.academicYear, academicYear));
    if (semester) conditions.push(eq(academicPeriods.semester, Number(semester)));

    const data = await db.query.academicPeriods.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [desc(academicPeriods.academicYear), desc(academicPeriods.semester)],
    });

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("Get academic periods error:", error);
    return c.json({ success: false, message: error.message || "Gagal mengambil periode akademik" }, 500);
  }
});

academicPeriodsRoute.get("/active", async (c) => {
  try {
    const data = await db.query.academicPeriods.findFirst({
      where: eq(academicPeriods.status, "active"),
      orderBy: [desc(academicPeriods.academicYear), desc(academicPeriods.semester)],
    });

    return c.json({ success: true, data: data || null });
  } catch (error: any) {
    console.error("Get active academic period error:", error);
    return c.json({ success: false, message: error.message || "Gagal mengambil periode aktif" }, 500);
  }
});

academicPeriodsRoute.get("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const data = await db.query.academicPeriods.findFirst({
      where: eq(academicPeriods.id, id),
    });

    if (!data) {
      return c.json({ success: false, message: "Periode akademik tidak ditemukan" }, 404);
    }

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("Get academic period error:", error);
    return c.json({ success: false, message: error.message || "Gagal mengambil periode akademik" }, 500);
  }
});

academicPeriodsRoute.post(
  "/",
  requirePermission("/apps/academic/classes"),
  zValidator("json", periodSchema),
  async (c) => {
    try {
      const user = c.get("user");
      const body = c.req.valid("json");

      const existing = await db.query.academicPeriods.findFirst({
        where: and(
          eq(academicPeriods.academicYear, body.academicYear),
          eq(academicPeriods.semester, body.semester),
        ),
      });

      if (existing) {
        return c.json({ success: false, message: "Periode akademik sudah ada" }, 409);
      }

      const result = await db.insert(academicPeriods).values({
        academicYear: body.academicYear,
        semester: body.semester,
        startDate: toDate(body.startDate),
        endDate: toDate(body.endDate),
        status: body.status || "draft",
        notes: body.notes || null,
        createdBy: user?.userId || null,
        lockedAt: body.status === "locked" || body.status === "archived" ? new Date() : null,
        lockedBy: body.status === "locked" || body.status === "archived" ? user?.userId || null : null,
      });

      const created = await db.query.academicPeriods.findFirst({
        where: eq(academicPeriods.id, Number(result[0].insertId)),
      });

      await writeAuditLog({
        actorUserId: user?.userId || null,
        entityType: "academic_period",
        entityId: created?.id,
        action: "create",
        afterJson: created,
        ipAddress: c.req.header("x-forwarded-for") || null,
        userAgent: c.req.header("user-agent") || null,
      });

      return c.json({ success: true, message: "Periode akademik berhasil dibuat", data: created });
    } catch (error: any) {
      console.error("Create academic period error:", error);
      return c.json({ success: false, message: error.message || "Gagal membuat periode akademik" }, 500);
    }
  },
);

academicPeriodsRoute.put(
  "/:id",
  requirePermission("/apps/academic/classes"),
  zValidator("json", updatePeriodSchema),
  async (c) => {
    try {
      const id = Number(c.req.param("id"));
      const user = c.get("user");
      const body = c.req.valid("json");

      const existing = await db.query.academicPeriods.findFirst({
        where: eq(academicPeriods.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Periode akademik tidak ditemukan" }, 404);
      }

      if (existing.status === "locked" || existing.status === "archived") {
        return c.json(
          {
            success: false,
            message: `Periode ${existing.academicYear} semester ${existing.semester} sudah ${existing.status}; tidak bisa diedit lewat update normal. Gunakan flow revisi resmi jika perlu membuka perubahan.`,
            periodStatus: existing.status,
          },
          409,
        );
      }

      await db
        .update(academicPeriods)
        .set({
          academicYear: body.academicYear ?? existing.academicYear,
          semester: body.semester ?? existing.semester,
          startDate: body.startDate === undefined ? existing.startDate : toDate(body.startDate),
          endDate: body.endDate === undefined ? existing.endDate : toDate(body.endDate),
          status: body.status ?? existing.status,
          notes: body.notes === undefined ? existing.notes : body.notes,
          lockedAt:
            body.status === "locked" || body.status === "archived"
              ? existing.lockedAt || new Date()
              : body.status === "draft" || body.status === "active"
                ? null
                : existing.lockedAt,
          lockedBy:
            body.status === "locked" || body.status === "archived"
              ? user?.userId || existing.lockedBy || null
              : body.status === "draft" || body.status === "active"
                ? null
                : existing.lockedBy,
        })
        .where(eq(academicPeriods.id, id));

      const updated = await db.query.academicPeriods.findFirst({
        where: eq(academicPeriods.id, id),
      });

      await writeAuditLog({
        actorUserId: user?.userId || null,
        entityType: "academic_period",
        entityId: id,
        action: "update",
        beforeJson: existing,
        afterJson: updated,
        ipAddress: c.req.header("x-forwarded-for") || null,
        userAgent: c.req.header("user-agent") || null,
      });

      return c.json({ success: true, message: "Periode akademik berhasil diperbarui", data: updated });
    } catch (error: any) {
      console.error("Update academic period error:", error);
      return c.json({ success: false, message: error.message || "Gagal memperbarui periode akademik" }, 500);
    }
  },
);

academicPeriodsRoute.post("/:id/lock", requirePermission("/apps/academic/classes"), async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const user = c.get("user");
    const existing = await db.query.academicPeriods.findFirst({ where: eq(academicPeriods.id, id) });
    if (!existing) return c.json({ success: false, message: "Periode akademik tidak ditemukan" }, 404);

    await db.update(academicPeriods).set({ status: "locked", lockedAt: new Date(), lockedBy: user?.userId || null }).where(eq(academicPeriods.id, id));
    const updated = await db.query.academicPeriods.findFirst({ where: eq(academicPeriods.id, id) });
    await writeAuditLog({ actorUserId: user?.userId || null, entityType: "academic_period", entityId: id, action: "lock", beforeJson: existing, afterJson: updated });

    return c.json({ success: true, message: "Periode akademik berhasil dikunci", data: updated });
  } catch (error: any) {
    console.error("Lock academic period error:", error);
    return c.json({ success: false, message: error.message || "Gagal mengunci periode akademik" }, 500);
  }
});

academicPeriodsRoute.post("/:id/archive", requirePermission("/apps/academic/classes"), async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const user = c.get("user");
    const existing = await db.query.academicPeriods.findFirst({ where: eq(academicPeriods.id, id) });
    if (!existing) return c.json({ success: false, message: "Periode akademik tidak ditemukan" }, 404);

    await db.update(academicPeriods).set({ status: "archived", lockedAt: existing.lockedAt || new Date(), lockedBy: user?.userId || existing.lockedBy || null }).where(eq(academicPeriods.id, id));
    const updated = await db.query.academicPeriods.findFirst({ where: eq(academicPeriods.id, id) });
    await writeAuditLog({ actorUserId: user?.userId || null, entityType: "academic_period", entityId: id, action: "archive", beforeJson: existing, afterJson: updated });

    return c.json({ success: true, message: "Periode akademik berhasil diarsipkan", data: updated });
  } catch (error: any) {
    console.error("Archive academic period error:", error);
    return c.json({ success: false, message: error.message || "Gagal mengarsipkan periode akademik" }, 500);
  }
});

export default academicPeriodsRoute;
