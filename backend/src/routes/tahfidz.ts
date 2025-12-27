import { Hono } from "hono";
import { db } from "../db";
import {
  tahfidzDeposits,
  tahfidzExams,
  tahfidzTargets,
  students,
  teachers,
  halaqahMembers,
  halaqahGroups,
  halaqahMentors,
} from "../db/schema";
import { eq, desc, and, gte, lte, sql, inArray, like, or } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const app = new Hono();

// --- Schemas ---
const depositSchema = z.object({
  studentId: z.number(),
  teacherId: z.number(),
  type: z.enum(["ziyadah", "murajaah", "izin", "alpha", "sakit"]),
  isLate: z.boolean().optional(),
  // New line-based position fields
  startSurah: z.number().nullable().optional(),
  startAyat: z.number().nullable().optional(),
  startPage: z.number().nullable().optional(),
  endSurah: z.number().nullable().optional(),
  endAyat: z.number().nullable().optional(),
  endPage: z.number().nullable().optional(),
  totalLines: z.number().nullable().optional(),
  totalPages: z.number().nullable().optional(),
  // Legacy fields (kept for backward compatibility)
  juz: z.number().optional(),
  surahNumber: z.number().optional(),
  surahName: z.string().optional(),
  ayatStart: z.number().optional(),
  ayatEnd: z.number().optional(),
  pageNumber: z.number().optional(),
  // Other
  fluency: z.enum(["lancar", "kurang_lancar", "mengulang"]).optional(),
  notes: z.string().optional(),
  depositDate: z.string().optional(),
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
        // New line-based fields
        startSurah: tahfidzDeposits.startSurah,
        startAyat: tahfidzDeposits.startAyat,
        endSurah: tahfidzDeposits.endSurah,
        endAyat: tahfidzDeposits.endAyat,
        totalLines: tahfidzDeposits.totalLines,
        totalPages: tahfidzDeposits.totalPages,
        // Legacy
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
      isLate: body.isLate || false,
      // New line-based fields
      startSurah: body.startSurah,
      startAyat: body.startAyat,
      startPage: body.startPage,
      endSurah: body.endSurah,
      endAyat: body.endAyat,
      endPage: body.endPage,
      totalLines: body.totalLines,
      totalPages: body.totalPages ? String(body.totalPages) : undefined,
      // Legacy fields
      juz: body.juz,
      surahNumber: body.surahNumber,
      surahName: body.surahName,
      ayatStart: body.ayatStart,
      ayatEnd: body.ayatEnd,
      pageNumber: body.pageNumber,
      // Other
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
        isLate: body.isLate || false,
        // New line-based fields
        startSurah: body.startSurah,
        startAyat: body.startAyat,
        startPage: body.startPage,
        endSurah: body.endSurah,
        endAyat: body.endAyat,
        endPage: body.endPage,
        totalLines: body.totalLines,
        totalPages: body.totalPages ? String(body.totalPages) : undefined,
        // Legacy fields
        juz: body.juz,
        surahNumber: body.surahNumber,
        surahName: body.surahName,
        ayatStart: body.ayatStart,
        ayatEnd: body.ayatEnd,
        pageNumber: body.pageNumber,
        // Other
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

// DELETE /deposits/:id - Delete
app.delete("/deposits/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  try {
    await db.delete(tahfidzDeposits).where(eq(tahfidzDeposits.id, id));
    return c.json({ success: true, message: "Data setoran berhasil dihapus" });
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
            : studentDeposit.type === "sakit"
            ? "sakit"
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
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

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

    // { "2024-12-01": { done: 5, permission: 1, alpha: 0, sick: 0 } }
    const stats: Record<
      string,
      { done: number; permission: number; alpha: number; sick: number }
    > = {};

    deposits.forEach((d) => {
      let dateKey = String(d.date);
      if ((d.date as any) instanceof Date) {
        dateKey = (d.date as any).toISOString().split("T")[0];
      }

      if (!stats[dateKey]) {
        stats[dateKey] = { done: 0, permission: 0, alpha: 0, sick: 0 };
      }

      if (d.type === "izin") {
        stats[dateKey]!.permission += d.count;
      } else if (d.type === "alpha") {
        stats[dateKey]!.alpha += d.count;
      } else if (d.type === "sakit") {
        stats[dateKey]!.sick += d.count;
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

// --- HALAQAH REPORT ---
app.get("/halaqah-report", async (c) => {
  const halaqahId = c.req.query("halaqahId");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const gender = c.req.query("gender");

  if (!halaqahId || !startDate || !endDate) {
    return c.json(
      { success: false, message: "halaqahId, startDate, endDate required" },
      400
    );
  }

  try {
    // 1. Get halaqah info
    const halaqah = await db.query.halaqahGroups.findFirst({
      where: eq(halaqahGroups.id, Number(halaqahId)),
      with: {
        targetLevel: true,
      },
    });

    if (!halaqah) {
      return c.json({ success: false, message: "Halaqah not found" }, 404);
    }

    // 2. Get first mentor
    const mentorRecord = await db
      .select({
        teacherId: halaqahMentors.teacherId,
        fullName: teachers.fullName,
      })
      .from(halaqahMentors)
      .leftJoin(teachers, eq(halaqahMentors.teacherId, teachers.id))
      .where(eq(halaqahMentors.halaqahId, Number(halaqahId)))
      .orderBy(sql`${halaqahMentors.id} ASC`)
      .limit(1);

    // 3. Get members of this halaqah
    let membersQuery = db
      .select({
        studentId: halaqahMembers.studentId,
        fullName: students.fullName,
        nis: students.nis,
        gender: students.gender,
        classId: students.classId,
      })
      .from(halaqahMembers)
      .leftJoin(students, eq(halaqahMembers.studentId, students.id))
      .where(
        and(
          eq(halaqahMembers.halaqahId, Number(halaqahId)),
          eq(halaqahMembers.status, "active")
        )
      );

    const members = await membersQuery;

    // Filter by gender if provided
    const filteredMembers = gender
      ? members.filter((m) => m.gender === gender)
      : members;

    // 4. For each member, get deposits in date range
    const memberData = await Promise.all(
      filteredMembers.map(async (member) => {
        const deposits = await db
          .select()
          .from(tahfidzDeposits)
          .where(
            and(
              eq(tahfidzDeposits.studentId, member.studentId),
              gte(tahfidzDeposits.depositDate, new Date(startDate)),
              lte(tahfidzDeposits.depositDate, new Date(endDate))
            )
          );

        // Count attendance
        const attendance = {
          izin: deposits.filter((d) => d.type === "izin").length,
          alpha: deposits.filter((d) => d.type === "alpha").length,
          sakit: deposits.filter((d) => d.type === "sakit").length,
          terlambat: deposits.filter((d) => d.isLate).length,
        };

        // Get page numbers
        const actualDeposits = deposits.filter((d) => d.type === "ziyadah");

        // Calculate pages (Hybrid: New Fields + Legacy)
        let totalPagesSum = 0;
        const depositRanges: { start: number; end: number }[] = [];

        actualDeposits.forEach((d) => {
          // Amount
          if (d.totalPages) {
            totalPagesSum += Number(d.totalPages);
          } else if (d.pageNumber) {
            totalPagesSum += 1; // Assume 1 page for legacy
          }

          // Range Collection
          const start = d.startPage || d.pageNumber;
          const end = d.endPage || d.pageNumber;
          if (start && end) {
            depositRanges.push({ start, end });
          }
        });

        // Merge Ranges
        depositRanges.sort((a, b) => a.start - b.start);
        const mergedRanges: { start: number; end: number }[] = [];

        depositRanges.forEach((r) => {
          const last = mergedRanges[mergedRanges.length - 1];
          if (last && r.start <= last.end + 1) {
            // Contiguous or Overlap
            if (r.end > last.end) last.end = r.end;
          } else {
            mergedRanges.push({ ...r });
          }
        });

        const hafalanRanges =
          mergedRanges.length > 0
            ? mergedRanges
                .map((r) =>
                  r.start === r.end
                    ? `Hal. ${r.start}`
                    : `Hal. ${r.start}-${r.end}`
                )
                .join(", ")
            : "-";

        const awalHalaman =
          mergedRanges.length > 0 ? mergedRanges[0]!.start : null;
        const akhirHalaman =
          mergedRanges.length > 0
            ? mergedRanges[mergedRanges.length - 1]!.end
            : null;
        const jumlahHalaman = Number(totalPagesSum.toFixed(2));

        return {
          studentId: member.studentId,
          fullName: member.fullName,
          nis: member.nis,
          classId: member.classId,
          attendance,
          awalHalaman,
          akhirHalaman,
          jumlahHalaman,
          hafalanRanges,
          totalDeposits: actualDeposits.length,
        };
      })
    );

    return c.json({
      success: true,
      data: {
        halaqah: halaqah, // Pass full object including targetLevel
        mentor: mentorRecord[0] || null,
        dateRange: { start: startDate, end: endDate },
        members: memberData,
      },
    });
  } catch (e: any) {
    console.error("Halaqah report error:", e);
    return c.json(
      { success: false, message: e.message || "Internal Error" },
      500
    );
  }
});

// --- TARGET SETTINGS CRUD ---
const targetSchema = z.object({
  level: z.string().min(1),
  targetPages: z.number().min(1),
  description: z.string().optional(),
});

// GET /targets - List all
app.get("/targets", async (c) => {
  try {
    const targets = await db
      .select()
      .from(tahfidzTargets)
      .orderBy(tahfidzTargets.level);
    return c.json({ success: true, data: targets });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// POST /targets - Create
app.post("/targets", zValidator("json", targetSchema), async (c) => {
  const body = c.req.valid("json");
  try {
    await db.insert(tahfidzTargets).values(body);
    return c.json({ success: true, message: "Target created" });
  } catch (e: any) {
    if (e.code === "ER_DUP_ENTRY") {
      return c.json({ success: false, message: "Level already exists" }, 400);
    }
    return c.json({ success: false, message: e.message }, 500);
  }
});

// PUT /targets/:id - Update
app.put("/targets/:id", zValidator("json", targetSchema), async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = c.req.valid("json");
  try {
    await db.update(tahfidzTargets).set(body).where(eq(tahfidzTargets.id, id));
    return c.json({ success: true, message: "Target updated" });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// DELETE /targets/:id - Delete
app.delete("/targets/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  try {
    await db.delete(tahfidzTargets).where(eq(tahfidzTargets.id, id));
    return c.json({ success: true, message: "Target deleted" });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

export default app;
