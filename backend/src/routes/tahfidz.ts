import { Hono } from "hono";
import { db } from "../db";
import {
  tahfidzDeposits,
  tahfidzExams,
  students,
  teachers,
  halaqahMembers,
  halaqahGroups,
} from "../db/schema";
import { eq, desc, and, gte, lte, sql, inArray, like, or } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const app = new Hono();

// --- Schemas ---
const depositSchema = z.object({
  studentId: z.number(),
  teacherId: z.number(),
  type: z.enum(["ziyadah", "murajaah", "izin", "alpha"]), // Added 'alpha'
  juz: z.number().optional(),
  surahNumber: z.number().optional(),
  surahName: z.string().optional(),
  ayatStart: z.number().optional(),
  ayatEnd: z.number().optional(),
  fluency: z.enum(["lancar", "kurang_lancar", "mengulang"]).optional(), // Made optional
  notes: z.string().optional(),
  depositDate: z.string().optional(), // ISO string from frontend
});

const examSchema = z.object({
  studentId: z.number(),
  examinerId: z.number(),
  examType: z.string(),
  examDate: z.string(),
  scoreFluency: z.number().optional(),
  scoreTajwid: z.number().optional(),
  scoreMakhraj: z.number().optional(),
  scoreAdab: z.number().optional(),
  finalScore: z.number(),
  verdict: z.enum(["pass", "fail", "conditional"]),
  notes: z.string().optional(),
});

// --- Routes ---

// GET /stats - Dashboard Stats
app.get("/stats", async (c) => {
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const halaqahId = c.req.query("halaqahId");
  const gender = c.req.query("gender");

  try {
    const conditions: any[] = [];

    if (startDate) {
      conditions.push(gte(tahfidzDeposits.depositDate, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(sql`DATE(${tahfidzDeposits.depositDate}) <= ${endDate}`);
    }

    if (gender) {
      conditions.push(eq(students.gender, gender as "male" | "female"));
    }

    if (halaqahId) {
      conditions.push(eq(halaqahMembers.halaqahId, Number(halaqahId)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Helper to build base query with joins if needed
    // We strictly need joins only if filtering by gender or halaqah
    // But for simplicity/consistency, let's always join if no perf hit
    const buildQuery = () => {
      const query = db
        .select({ count: sql<number>`count(*)` })
        .from(tahfidzDeposits)
        .leftJoin(students, eq(tahfidzDeposits.studentId, students.id))
        .leftJoin(
          halaqahMembers,
          and(
            eq(tahfidzDeposits.studentId, halaqahMembers.studentId),
            eq(halaqahMembers.status, "active")
          )
        );

      if (whereClause) {
        query.where(whereClause);
      }
      return query;
    };

    // Total deposits count
    const [totalDepositsResult] = await buildQuery();

    // Total students with at least 1 deposit (in the filtered range)
    const activeStudentsQuery = db
      .select({
        count: sql<number>`count(distinct ${tahfidzDeposits.studentId})`,
      })
      .from(tahfidzDeposits)
      .leftJoin(students, eq(tahfidzDeposits.studentId, students.id))
      .leftJoin(
        halaqahMembers,
        and(
          eq(tahfidzDeposits.studentId, halaqahMembers.studentId),
          eq(halaqahMembers.status, "active")
        )
      );

    if (whereClause) {
      activeStudentsQuery.where(whereClause);
    }

    const [activeStudentsResult] = await activeStudentsQuery;

    return c.json({
      success: true,
      data: {
        totalDeposits: totalDepositsResult?.count || 0,
        activeStudents: activeStudentsResult?.count || 0,
      },
    });
  } catch (e: any) {
    return c.json(
      { success: false, message: e.message || "Internal Error" },
      500
    );
  }
});

// GET /deposits - History
app.get("/deposits", async (c) => {
  const studentId = c.req.query("studentId");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const halaqahId = c.req.query("halaqahId");
  const gender = c.req.query("gender"); // male | female

  try {
    let query = db
      .select({
        id: tahfidzDeposits.id,
        date: tahfidzDeposits.depositDate,
        type: tahfidzDeposits.type,
        surah: tahfidzDeposits.surahName,
        ayatStart: tahfidzDeposits.ayatStart,
        ayatEnd: tahfidzDeposits.ayatEnd,
        juz: tahfidzDeposits.juz,
        fluency: tahfidzDeposits.fluency,
        notes: tahfidzDeposits.notes,
        studentName: students.fullName,
        teacherName: teachers.fullName,
      })
      .from(tahfidzDeposits)
      .leftJoin(students, eq(tahfidzDeposits.studentId, students.id))
      .leftJoin(teachers, eq(tahfidzDeposits.teacherId, teachers.id))
      // Join with halaqahMembers if filtering by halaqah
      .leftJoin(
        halaqahMembers,
        and(
          eq(tahfidzDeposits.studentId, halaqahMembers.studentId),
          eq(halaqahMembers.status, "active") // Only active members? Maybe not strictly needed if we want history
        )
      )
      .orderBy(desc(tahfidzDeposits.depositDate));

    const page = Number(c.req.query("page") || 1);
    const limit = Number(c.req.query("limit") || 10);
    const offset = (page - 1) * limit;
    const search = c.req.query("search");

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        or(
          like(students.fullName, `%${search}%`),
          like(students.nis, `%${search}%`)
        )
      );
    }

    if (studentId) {
      conditions.push(eq(tahfidzDeposits.studentId, Number(studentId)));
    }

    if (startDate) {
      conditions.push(gte(tahfidzDeposits.depositDate, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(sql`DATE(${tahfidzDeposits.depositDate}) <= ${endDate}`);
    }

    if (gender) {
      conditions.push(eq(students.gender, gender as "male" | "female"));
    }

    if (halaqahId) {
      conditions.push(eq(halaqahMembers.halaqahId, Number(halaqahId)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Get Total Count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tahfidzDeposits)
      .leftJoin(students, eq(tahfidzDeposits.studentId, students.id))
      .leftJoin(teachers, eq(tahfidzDeposits.teacherId, teachers.id))
      .leftJoin(
        halaqahMembers,
        and(
          eq(tahfidzDeposits.studentId, halaqahMembers.studentId),
          eq(halaqahMembers.status, "active")
        )
      )
      .where(whereClause);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // 2. Get Data
    if (whereClause) {
      query.where(whereClause);
    }

    const data = await query.limit(limit).offset(offset);

    return c.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (e: any) {
    return c.json(
      { success: false, message: e.message || "Internal Error" },
      500
    );
  }
});

// POST /deposits - Create
app.post("/deposits", zValidator("json", depositSchema), async (c) => {
  const body = c.req.valid("json");
  try {
    await db.insert(tahfidzDeposits).values({
      studentId: body.studentId,
      teacherId: body.teacherId,
      type: body.type,
      juz: body.juz,
      surahNumber: body.surahNumber,
      surahName: body.surahName,
      ayatStart: body.ayatStart,
      ayatEnd: body.ayatEnd,
      fluency: body.fluency,
      notes: body.notes,
      depositDate: body.depositDate ? new Date(body.depositDate) : new Date(),
    });
    return c.json({ success: true, message: "Setoran berhasil dicatat" });
  } catch (e: any) {
    return c.json(
      { success: false, message: e.message || "Internal Error" },
      500
    );
  }
});

// PUT /deposits/:id - Update
app.put("/deposits/:id", zValidator("json", depositSchema), async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = c.req.valid("json");
  try {
    await db
      .update(tahfidzDeposits)
      .set({
        studentId: body.studentId,
        teacherId: body.teacherId,
        type: body.type,
        juz: body.juz,
        surahNumber: body.surahNumber,
        surahName: body.surahName,
        ayatStart: body.ayatStart,
        ayatEnd: body.ayatEnd,
        fluency: body.fluency,
        notes: body.notes,
        depositDate: body.depositDate ? new Date(body.depositDate) : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tahfidzDeposits.id, id));

    return c.json({ success: true, message: "Setoran berhasil diperbarui" });
  } catch (e: any) {
    return c.json(
      { success: false, message: e.message || "Internal Error" },
      500
    );
  }
});

// GET /exams
app.get("/exams", async (c) => {
  const page = Number(c.req.query("page") || 1);
  const limit = Number(c.req.query("limit") || 10);
  const offset = (page - 1) * limit;

  const studentId = c.req.query("studentId");
  const search = c.req.query("search");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const verdict = c.req.query("verdict");
  const gender = c.req.query("gender");
  const examinerId = c.req.query("examinerId");

  try {
    const conditions: any[] = [];

    if (studentId)
      conditions.push(eq(tahfidzExams.studentId, Number(studentId)));
    if (search) {
      conditions.push(
        or(
          like(students.fullName, `%${search}%`),
          like(students.nis, `%${search}%`)
        )
      );
    }
    if (startDate)
      conditions.push(gte(tahfidzExams.examDate, new Date(startDate)));
    if (endDate)
      conditions.push(sql`DATE(${tahfidzExams.examDate}) <= ${endDate}`);
    if (verdict) conditions.push(eq(tahfidzExams.verdict, verdict as any));
    if (gender) conditions.push(eq(students.gender, gender as any));
    if (examinerId)
      conditions.push(eq(tahfidzExams.examinerId, Number(examinerId)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Get Total Count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(tahfidzExams)
      .leftJoin(students, eq(tahfidzExams.studentId, students.id));

    if (whereClause) {
      countQuery.where(whereClause);
    }

    const [countResult] = await countQuery;
    const total = Number(countResult?.count || 0);

    // 2. Get Data
    const dataQuery = db
      .select({
        id: tahfidzExams.id,
        date: tahfidzExams.examDate,
        type: tahfidzExams.examType,
        finalScore: tahfidzExams.finalScore,
        verdict: tahfidzExams.verdict,
        studentName: students.fullName,
        examinerName: teachers.fullName,
        // Detailed fields for Edit
        studentId: tahfidzExams.studentId,
        examinerId: tahfidzExams.examinerId,
        scoreFluency: tahfidzExams.scoreFluency,
        scoreTajwid: tahfidzExams.scoreTajwid,
        scoreMakhraj: tahfidzExams.scoreMakhraj,
        scoreAdab: tahfidzExams.scoreAdab,
        notes: tahfidzExams.notes,
      })
      .from(tahfidzExams)
      .leftJoin(students, eq(tahfidzExams.studentId, students.id))
      .leftJoin(teachers, eq(tahfidzExams.examinerId, teachers.id))
      .orderBy(desc(tahfidzExams.examDate))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      dataQuery.where(whereClause);
    }

    const data = await dataQuery;

    return c.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e: any) {
    return c.json(
      { success: false, message: e.message || "Internal Error" },
      500
    );
  }
});

// POST /exams
app.post("/exams", zValidator("json", examSchema), async (c) => {
  const body = c.req.valid("json");
  try {
    await db.insert(tahfidzExams).values({
      ...body,
      examDate: new Date(body.examDate),
    });
    return c.json({ success: true, message: "Nilai ujian berhasil disimpan" });
  } catch (e: any) {
    return c.json(
      { success: false, message: e.message || "Internal Error" },
      500
    );
  }
});

// PUT /exams/:id - Update
app.put("/exams/:id", zValidator("json", examSchema), async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = c.req.valid("json");
  try {
    await db
      .update(tahfidzExams)
      .set({
        ...body,
        examDate: new Date(body.examDate),
        updatedAt: new Date(),
      })
      .where(eq(tahfidzExams.id, id));

    return c.json({
      success: true,
      message: "Nilai ujian berhasil diperbarui",
    });
  } catch (e: any) {
    return c.json(
      { success: false, message: e.message || "Internal Error" },
      500
    );
  }
});

// DELETE /exams/:id - Delete
app.delete("/exams/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  try {
    await db.delete(tahfidzExams).where(eq(tahfidzExams.id, id));
    return c.json({ success: true, message: "Data ujian berhasil dihapus" });
  } catch (e: any) {
    return c.json(
      { success: false, message: e.message || "Internal Error" },
      500
    );
  }
});

// GET /halaqah/:groupId/daily-summary
app.get("/halaqah/:groupId/daily-summary", async (c) => {
  try {
    const groupId = parseInt(c.req.param("groupId"));
    const dateStr =
      c.req.query("date") || new Date().toISOString().split("T")[0];

    // 1. Get all students in the halaqah group
    const members = await db.query.halaqahMembers.findMany({
      where: eq(halaqahMembers.halaqahId, groupId),
      with: {
        student: true,
      },
    });

    if (!members.length) {
      return c.json({ success: true, data: [] });
    }

    const studentIds = members.map((m) => m.studentId);

    // 2. Get deposits for these students on the specific date
    const deposits = await db.query.tahfidzDeposits.findMany({
      where: and(
        inArray(tahfidzDeposits.studentId, studentIds),
        sql`DATE(${tahfidzDeposits.depositDate}) = ${dateStr}`
      ),
    });

    // 3. Map students to their status
    const summary = members.map((m) => {
      const studentDeposit = deposits.find((d) => d.studentId === m.studentId);
      // Determine status: 'done' if deposit exists, else 'none'
      // Only students in the group are returned.

      return {
        student: {
          id: m.student.id,
          name: m.student.fullName,
          nis: m.student.nis,
          avatar: m.student.photo,
        },
        status: studentDeposit
          ? studentDeposit.type === "izin"
            ? "izin"
            : studentDeposit.type === "alpha"
            ? "alpha"
            : "done"
          : "none",
        deposit: studentDeposit || null,
      };
    });

    return c.json({
      success: true,
      data: summary,
      meta: {
        date: dateStr,
        totalStudents: members.length,
        totalDone: deposits.length,
      },
    });
  } catch (e: any) {
    return c.json(
      { success: false, message: e.message || "Internal Error" },
      500
    );
  }
});

// GET /halaqah/:groupId/monthly-summary
app.get("/halaqah/:groupId/monthly-summary", async (c) => {
  try {
    const groupId = parseInt(c.req.param("groupId"));
    const month = parseInt(c.req.query("month") || ""); // 1-12
    const year = parseInt(c.req.query("year") || "");

    if (!month || !year) {
      return c.json(
        { success: false, message: "Month and Year required" },
        400
      );
    }

    // 1. Get total students in halaqah
    // Using findMany to ensure consistency with daily-summary logic 100%
    const members = await db.query.halaqahMembers.findMany({
      where: and(
        eq(halaqahMembers.halaqahId, groupId),
        eq(halaqahMembers.status, "active")
      ),
    });

    const totalStudents = members.length;

    if (totalStudents === 0) {
      return c.json({ success: true, data: {}, totalStudents: 0 });
    }

    // 2. Get students IDs
    // Optimization: We could just query deposits filtered by halaqah members subquery,
    // but for now let's reuse logic or just join.
    // Let's use a join approach for efficiency.

    // Query deposits for this halaqah's students in the date range
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

    const deposits = await db
      .select({
        date: sql<string>`DATE(${tahfidzDeposits.depositDate})`,
        type: tahfidzDeposits.type,
        count: sql<number>`count(distinct ${tahfidzDeposits.studentId})`,
      })
      .from(tahfidzDeposits)
      .innerJoin(
        halaqahMembers,
        and(
          eq(tahfidzDeposits.studentId, halaqahMembers.studentId),
          eq(halaqahMembers.halaqahId, groupId)
        )
      )
      .where(
        and(
          sql`DATE(${tahfidzDeposits.depositDate}) >= ${startDate}`,
          sql`DATE(${tahfidzDeposits.depositDate}) <= ${endDate}`
        )
      )
      .groupBy(sql`DATE(${tahfidzDeposits.depositDate})`, tahfidzDeposits.type);

    // { "2024-12-01": { done: 5, permission: 1, alpha: 0 } }
    const stats: Record<
      string,
      { done: number; permission: number; alpha: number }
    > = {};

    deposits.forEach((d) => {
      let dateKey = String(d.date);
      if ((d.date as any) instanceof Date) {
        dateKey = (d.date as any).toISOString().split("T")[0];
      }

      if (!stats[dateKey]) {
        stats[dateKey] = { done: 0, permission: 0, alpha: 0 };
      }

      if (d.type === "izin") {
        stats[dateKey]!.permission += d.count;
      } else if (d.type === "alpha") {
        stats[dateKey]!.alpha += d.count;
      } else {
        stats[dateKey]!.done += d.count;
      }
    });

    return c.json({
      success: true,
      data: stats,
      totalStudents,
    });
  } catch (e: any) {
    return c.json(
      { success: false, message: e.message || "Internal Error" },
      500
    );
  }
});

export default app;
