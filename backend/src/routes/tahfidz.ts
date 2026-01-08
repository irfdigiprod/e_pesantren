import { Hono } from "hono";
import * as XLSX from "xlsx";
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
  tahfidzReportSettings,
  tahfidzReportCards,
  tahfidzExamTypes,
  classHomeroomTeachers,
  settings,
} from "../db/schema";
import {
  eq,
  desc,
  and,
  gte,
  lte,
  sql,
  inArray,
  like,
  or,
  asc,
} from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getJuzFromPage, getJuzFromSurah } from "../utils/quran-mapping";

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
  juz: z.number().nullable().optional(),
  surahNumber: z.number().nullable().optional(),
  surahName: z.string().nullable().optional(),
  ayatStart: z.number().nullable().optional(),
  ayatEnd: z.number().nullable().optional(),
  pageNumber: z.number().nullable().optional(),
  // Other
  fluency: z.enum(["lancar", "kurang_lancar", "mengulang"]).optional(),
  notes: z.string().optional(),
  depositDate: z.string().optional(),
});

const examSchema = z.object({
  studentId: z.number(),
  examinerId: z.number(),
  examType: z.string(),
  examCategory: z.enum(["UPK", "UKJ", "UA", "Suluk", "Other"]).optional(),
  // New filtering fields
  academicYear: z.string().optional(),
  semester: z.enum(["1", "2", "ganjil", "genap"]).optional(),

  examDate: z.string(),
  juz: z.number().nullable().optional(),
  startPage: z.number().nullable().optional(),
  endPage: z.number().nullable().optional(),
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
  const academicYear = c.req.query("academicYear");
  const semester = c.req.query("semester");
  const classId = c.req.query("classId");
  const halaqahId = c.req.query("halaqahId");

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
    if (academicYear)
      conditions.push(eq(tahfidzExams.academicYear, academicYear));
    if (semester) conditions.push(eq(tahfidzExams.semester, semester as any));

    // New Filters
    if (classId) conditions.push(eq(students.classId, Number(classId)));
    if (halaqahId)
      conditions.push(eq(halaqahMembers.halaqahId, Number(halaqahId)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Get Total Count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(tahfidzExams)
      .leftJoin(students, eq(tahfidzExams.studentId, students.id));

    if (halaqahId) {
      countQuery.leftJoin(
        halaqahMembers,
        and(
          eq(tahfidzExams.studentId, halaqahMembers.studentId),
          eq(halaqahMembers.status, "active")
        )
      );
    }

    if (whereClause) {
      countQuery.where(whereClause);
    }

    const [countResult] = await countQuery;
    const total = Number(countResult?.count || 0);

    // 2. Get Data
    // Need to change `const dataQuery` to `let dataQuery` at line 456 first? Or just restructure.
    // Better to restructure.
    let dataQuery = db
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
        juz: tahfidzExams.juz,
        startPage: tahfidzExams.startPage,
        endPage: tahfidzExams.endPage,
        academicYear: tahfidzExams.academicYear,
        semester: tahfidzExams.semester,
      })
      .from(tahfidzExams)
      .leftJoin(students, eq(tahfidzExams.studentId, students.id));

    if (halaqahId) {
      dataQuery.leftJoin(
        halaqahMembers,
        and(
          eq(tahfidzExams.studentId, halaqahMembers.studentId),
          eq(halaqahMembers.status, "active")
        )
      );
    }

    dataQuery
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
    // For Suluk and UA, check for duplicate (one per student per semester per academic year)
    if (body.examCategory === "Suluk" || body.examCategory === "UA") {
      const existing = await db.query.tahfidzExams.findFirst({
        where: and(
          eq(tahfidzExams.studentId, body.studentId),
          eq(tahfidzExams.examCategory, body.examCategory),
          eq(tahfidzExams.academicYear, body.academicYear || ""),
          eq(tahfidzExams.semester, body.semester || "ganjil")
        ),
      });

      if (existing) {
        const categoryLabel =
          body.examCategory === "Suluk" ? "Suluk" : "Ujian Akhir";
        return c.json(
          {
            success: false,
            message: `Data ${categoryLabel} untuk siswa ini di semester dan tahun pelajaran yang sama sudah ada. Silakan edit data yang sudah ada.`,
          },
          400
        );
      }
    }

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
  targetJuz: z.number().optional().nullable(),
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

// --- EXAM TYPES CRUD ---
const examTypeSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["UPK", "UKJ", "UA", "Suluk", "Other"]).default("Other"),
  description: z.string().optional(),
});

// GET /exam-types - List all
app.get("/exam-types", async (c) => {
  try {
    const types = await db.query.tahfidzExamTypes.findMany({
      orderBy: (t, { asc }) => [asc(t.name)],
    });
    return c.json({ success: true, data: types });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// POST /exam-types - Create
app.post("/exam-types", zValidator("json", examTypeSchema), async (c) => {
  const body = c.req.valid("json");
  try {
    await db.insert(tahfidzExamTypes).values(body);
    return c.json({ success: true, message: "Jenis ujian berhasil dibuat" });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// PUT /exam-types/:id - Update
app.put("/exam-types/:id", zValidator("json", examTypeSchema), async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = c.req.valid("json");
  try {
    await db
      .update(tahfidzExamTypes)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(tahfidzExamTypes.id, id));
    return c.json({
      success: true,
      message: "Jenis ujian berhasil diperbarui",
    });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// DELETE /exam-types/:id - Delete
app.delete("/exam-types/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  try {
    await db.delete(tahfidzExamTypes).where(eq(tahfidzExamTypes.id, id));
    return c.json({ success: true, message: "Jenis ujian berhasil dihapus" });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

export default app;

// --- SETTINGS & REPORT CARD ---

// Settings Schema
const settingsSchema = z.object({
  institutionName: z.string().min(1),
  institutionAddress: z.string().nullable().optional(),
  institutionLogo: z.string().nullable().optional(),
  contactInfo: z.string().nullable().optional(),
  headmasterName: z.string().nullable().optional(),
  tahfidzHeadName: z.string().nullable().optional(),
  tahfidzHeadNameAkhwat: z.string().nullable().optional(), // Ketua Tahfidz Akhwat (optional)
  cityDate: z.string().nullable().optional(),
});

// GET /settings
app.get("/settings", async (c) => {
  try {
    const settings = await db.select().from(tahfidzReportSettings).limit(1);
    return c.json({ success: true, data: settings[0] || {} });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// PUT /settings
app.put("/settings", zValidator("json", settingsSchema), async (c) => {
  const body = c.req.valid("json");
  try {
    const existing = await db
      .select({ id: tahfidzReportSettings.id })
      .from(tahfidzReportSettings)
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(tahfidzReportSettings)
        .set(body)
        .where(eq(tahfidzReportSettings.id, existing[0]!.id));
    } else {
      await db.insert(tahfidzReportSettings).values(body);
    }
    return c.json({ success: true, message: "Pengaturan berhasil disimpan" });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// GET /report-card/:studentId
app.get("/report-card/:studentId", async (c) => {
  const studentId = parseInt(c.req.param("studentId"));
  const academicYear = c.req.query("academicYear") || "2025-2026"; // Default or calculated
  const semester = c.req.query("semester"); // 1 or 2 (Ganjil/Genap)

  try {
    // 1. Get Student Info with Class & Halaqah
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: {
        class: true,
      },
    });

    if (!student) {
      return c.json({ success: false, message: "Santri tidak ditemukan" }, 404);
    }

    // Get Active Halaqah
    const halaqahMember = await db.query.halaqahMembers.findFirst({
      where: and(
        eq(halaqahMembers.studentId, studentId),
        eq(halaqahMembers.status, "active")
      ),
      with: {
        halaqah: true,
      },
    });

    // 1b. Get Homeroom Teacher
    let homeroomTeacherName = "-";
    if (student.classId) {
      const waliQuery = await db
        .select({ name: teachers.fullName })
        .from(classHomeroomTeachers)
        .innerJoin(teachers, eq(classHomeroomTeachers.teacherId, teachers.id))
        .where(
          and(
            eq(classHomeroomTeachers.classId, student.classId),
            eq(classHomeroomTeachers.role, "wali_kelas")
          )
        )
        .limit(1);
      if (waliQuery.length > 0) {
        homeroomTeacherName = waliQuery[0]?.name || "-";
      }
    }

    // 2. Get Exams (Semester Specific - For Report Details)
    const examConditions = [eq(tahfidzExams.studentId, studentId)];
    if (academicYear) {
      examConditions.push(eq(tahfidzExams.academicYear, academicYear));
    }
    if (semester) {
      examConditions.push(eq(tahfidzExams.semester, semester as any));
    }

    const exams = await db
      .select()
      .from(tahfidzExams)
      .where(and(...examConditions))
      .orderBy(asc(tahfidzExams.examDate));

    // 2b. Cumulative UKJ Count (Passed Juz - All Time)
    // We want total juz student has passed UKJ for, regardless of semester
    const passedUKJ = await db
      .select({ juz: tahfidzExams.juz })
      .from(tahfidzExams)
      .where(
        and(
          eq(tahfidzExams.studentId, studentId),
          eq(tahfidzExams.examCategory, "UKJ"),
          eq(tahfidzExams.verdict, "pass")
        )
      );
    const uniqueJuzUKJ = new Set(
      passedUKJ.map((e) => e.juz).filter((j) => j != null)
    );
    const totalJuzUKJ = uniqueJuzUKJ.size;

    // 3. Get Attendance Stats (Calculated from Deposits)
    const deposits = await db
      .select({ type: tahfidzDeposits.type })
      .from(tahfidzDeposits)
      .where(eq(tahfidzDeposits.studentId, studentId));

    const attendance = {
      sakit: deposits.filter((d) => d.type?.toLowerCase() === "sakit").length,
      izin: deposits.filter((d) => d.type?.toLowerCase() === "izin").length,
      alpha: deposits.filter((d) => d.type?.toLowerCase() === "alpha").length,
    };

    // 4. Get Cumulative Hafalan (Total Pages) - Filtered by Semester Date Range
    const years = academicYear.split(/[-/]/).map(Number);
    let startDate: Date;
    let endDate: Date;
    const isGenap =
      String(semester).toLowerCase().includes("2") ||
      String(semester).toLowerCase().includes("genap");

    if (isGenap) {
      const year = years[1] || years[0] + 1;
      startDate = new Date(`${year}-01-01`);
      endDate = new Date(`${year}-06-30`);
    } else {
      const year = years[0];
      startDate = new Date(`${year}-07-01`);
      endDate = new Date(`${year}-12-31`);
    }

    const ziyadah = await db
      .select()
      .from(tahfidzDeposits)
      .where(
        and(
          eq(tahfidzDeposits.studentId, studentId),
          eq(tahfidzDeposits.type, "ziyadah"),
          gte(tahfidzDeposits.depositDate, startDate),
          lte(tahfidzDeposits.depositDate, endDate)
        )
      );

    let totalPages = 0;
    ziyadah.forEach((d) => {
      if (d.totalPages) totalPages += Number(d.totalPages);
      else if (d.pageNumber) totalPages += 1;
    });

    // 5. Get Settings
    const tahfidzSettings = await db.query.tahfidzReportSettings.findFirst();

    // 5b. Get city name
    let cityName = "";
    const regencySetting = await db.query.settings.findFirst({
      where: eq(settings.key, "institution_regency"),
    });
    if (regencySetting?.value) {
      try {
        const regencyData = JSON.parse(regencySetting.value);
        if (regencyData?.name) {
          cityName = regencyData.name
            .replace(/^KABUPATEN\s+/i, "")
            .replace(/^KOTA\s+/i, "");
        }
      } catch (e) {
        console.error("Failed to parse institution_regency:", e);
      }
    }

    // 6. Get Target based on Halaqah Level or Class Grade
    const allTargets = await db.select().from(tahfidzTargets);
    let target = null; // Start null to track if found

    // Priority 1: Check Halaqah Target Level Link
    if (
      halaqahMember?.halaqah &&
      (halaqahMember.halaqah as any).targetLevelId
    ) {
      const tId = (halaqahMember.halaqah as any).targetLevelId;
      target = allTargets.find((t) => t.id === tId) || null;
    }

    // Priority 2: Fallback to Class/Grade Matching
    if (!target && student.class?.name) {
      const className = student.class.name.toUpperCase();
      const exactMatch = allTargets.find((t) =>
        className.includes(t.level.toUpperCase())
      );
      if (exactMatch) target = exactMatch;
      else if (
        className.includes("SMP") ||
        className.includes("7") ||
        className.includes("8") ||
        className.includes("9")
      ) {
        let match = allTargets.find((t) => t.level === "SMP");
        if (!match && className.includes("7"))
          match = allTargets.find((t) => t.level === "1");
        if (!match && className.includes("8"))
          match = allTargets.find((t) => t.level === "2");
        if (!match && className.includes("9"))
          match = allTargets.find((t) => t.level === "3");
        target = match || target;
      } else if (
        className.includes("SMA") ||
        className.includes("ALIYAH") ||
        className.includes("10") ||
        className.includes("11") ||
        className.includes("12")
      ) {
        let match = allTargets.find((t) => t.level === "SMA");
        if (!match && className.includes("10"))
          match = allTargets.find((t) => t.level === "1"); // Use generic levels if SMA not found
        target = match || target;
      }
    }

    // Default if still not found
    if (!target)
      target = allTargets[0] || { targetPages: 50, level: "Default" };

    // 7. Calculate Mading Data & Targets
    // We reuse logic from previous implementation for mading data (monthly breakdown)
    // But since Ziyadah above is already filtered by date range, we can use it directly?
    // Wait, the Ziyadah query inside 4 uses logic for TotalPages.
    // The previous implementation used 'ziyadah' variable without date filtering for TotalPages logic?
    // Ah, wait. In previous code (Line 1220), ziyadah query had NO date filter.
    // But here I added date filter `gte(startDate), lte(endDate)` to calculate semester pages correctly.
    // This is CORRECT for "Total Hafalan This Semester".

    // Process Mading Data
    const madingMap = new Map();
    ziyadah.forEach((d) => {
      const date = new Date(d.depositDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!madingMap.has(key)) {
        madingMap.set(key, {
          month: date.getMonth(),
          year: date.getFullYear(),
          pages: 0,
          juzSet: new Set(),
        });
      }
      const entry = madingMap.get(key);
      let p = 0;
      if (d.totalPages) p = Number(d.totalPages);
      else if (d.pageNumber) p = 1;
      entry.pages += p;

      if (d.juz) entry.juzSet.add(d.juz);
    });

    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    const formatJuzRanges = (juzSet: Set<number>) => {
      if (juzSet.size === 0) return "-";
      const sorted = Array.from(juzSet).sort((a, b) => a - b);
      return sorted.join(", "); // Simple join for now
    };

    const madingData = Array.from(madingMap.values())
      .map((m) => ({
        bulan: monthNames[m.month],
        halaman: Number(m.pages.toFixed(2)),
        juz: formatJuzRanges(m.juzSet),
      }))
      .reverse();

    // Target Calculation
    let baseTarget = target ? target.targetPages : 50;
    // Determine active months in semester (usually 6, or based on data presence?)
    // Report usually implies full semester target. 6 months * monthly target.
    // Or based on actual active months?
    // Previous code: `const monthCount = Math.max(1, madingData.length);`
    // This made target depend on how many months had data.
    // If student was lazy (0 data), target was 1 * baseTarget. Too low?
    // Assuming 6 months target is standard for semester report.
    const monthCount = 6;
    const finalTargetPages = baseTarget * monthCount;

    // 8. Calculate Final Score (Components: UPK, UKJ, UA, Suluk)

    // a. UPK Average
    const upkExams = exams.filter(
      (e) => e.examCategory === "UPK" && e.finalScore != null
    );
    const avgUPK =
      upkExams.length > 0
        ? upkExams.reduce((sum, e) => sum + Number(e.finalScore), 0) /
          upkExams.length
        : 0;

    // b. UKJ Average
    const ukjExams = exams.filter(
      (e) => e.examCategory === "UKJ" && e.finalScore != null
    );
    const avgUKJ =
      ukjExams.length > 0
        ? ukjExams.reduce((sum, e) => sum + Number(e.finalScore), 0) /
          ukjExams.length
        : 0;

    // c. Suluk Score (Avg of scoreAdab)
    // Note: Frontend uses exams with valid scoreAdab.
    // Usually Suluk exam category has scoreAdab, but check all.
    const sulukExams = exams.filter(
      (e) => e.scoreAdab != null && e.scoreAdab > 0
    );
    const avgSuluk =
      sulukExams.length > 0
        ? sulukExams.reduce((sum, e) => sum + Number(e.scoreAdab), 0) /
          sulukExams.length
        : 0;

    // d. UA Score
    const uaExam = exams.find(
      (e) =>
        e.examCategory === "UA" ||
        e.examType === "Ujian Akhir" ||
        e.examType === "UA"
    );
    const uaScore = uaExam ? Number(uaExam.finalScore) : 0;

    // e. Final Calculation
    // Logic: (UPK + UKJ + UA + Suluk) / 4
    // Filter out zero components?? Frontend says: "filter(v => v > 0)" then avg.
    // Wait, frontend logic: `const components = [upk, ukj, ua, suluk].filter((v) => v > 0);`
    // Then `return ((upk + ukj + ua + suluk) / 4).toFixed(2);`
    // Actually the Frontend implementation I saw earlier was:
    // `return ((upk + ukj + ua + suluk) / 4).toFixed(2);`
    // The filter line `const components = ...` was commented out or unused in the return statement in my memory?
    // Let's re-read the snippet I viewed in Step 1306.
    // Line 1060: `return ((upk + ukj + ua + suluk) / 4).toFixed(2);`
    // It divides by 4 regardless of whether they exist (as long as they are 0 if missing).
    // Let's stick to the divisor 4.

    const finalScoreVal = (avgUPK + avgUKJ + avgSuluk + uaScore) / 4;
    const finalScore = finalScoreVal > 0 ? finalScoreVal.toFixed(2) : "-";

    // 5c. Calculate Ziyadah Juz (Total Pages / 20)
    // Formula: Total Ziyadah Pages in Semester / 20
    const totalZiyadahPages = ziyadah.reduce((sum, d) => {
      let p = 0;
      if (d.totalPages) p = Number(d.totalPages);
      else if (d.pageNumber) p = 1;
      return sum + p;
    }, 0);
    // Convert to Juz (2 decimal places) but as number for comparison
    const ziyadahJuz = Number((totalZiyadahPages / 20).toFixed(2));

    let keterangan = "Di Bawah Target";
    const totalPagesVal = Number(totalPages.toFixed(2));

    // Note: totalPagesVal is SAME as totalZiyadahPages if only Ziyadah is counted above in Step 4.
    // In Step 4, we query type='ziyadah' so yes, totalPages = totalZiyadahPages.

    // Recalculate Keterangan using JUZ if targetJuz is available
    if (target && target.targetJuz && target.targetJuz > 0) {
      // Compare by Juz
      if (ziyadahJuz >= target.targetJuz) {
        keterangan =
          ziyadahJuz > target.targetJuz ? "Melebihi Target" : "Sesuai Target";
      } else {
        keterangan = "Di Bawah Target";
      }
    } else {
      // Compare by Pages
      if (totalPagesVal >= finalTargetPages) {
        keterangan =
          totalPagesVal > finalTargetPages
            ? "Melebihi Target"
            : "Sesuai Target";
      }
    }

    return c.json({
      success: true,
      data: {
        student: {
          ...student,
          halaqah: (halaqahMember?.halaqah as any)?.name || "-",
          className: student.class?.name || "-",
          homeroomTeacher: homeroomTeacherName,
        },
        exams,
        attendance,
        totalHafalan: totalPages.toFixed(2),
        totalJuzUKJ: ziyadahJuz, // Replaced UKJ count with Ziyadah Juz Calculation
        finalScore: finalScore || "-",
        keterangan, // ST/MT/DT text
        settings: { ...(tahfidzSettings || {}), cityName },
        mading: madingData,
        target: {
          ...(target || { level: "Default", targetPages: 50 }),
          targetPages: finalTargetPages,
        },
      },
    });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// GET /exams/template - Download Template Import
app.get("/exams/template", async (c) => {
  const category = c.req.query("category") || "Other"; // UPK, UKJ, UA, Suluk
  const filterType = c.req.query("filterType"); // class | halaqah
  const filterId = c.req.query("filterId");
  const year = c.req.query("year") || "";
  const semester = c.req.query("semester") || "";

  if (!filterType || !filterId) {
    return c.json(
      { success: false, message: "Filter (Class/Halaqah) required" },
      400
    );
  }

  try {
    // 1. Fetch Students
    let studentList: { id: number; nis: string; name: string }[] = [];

    if (filterType === "class") {
      const results = await db
        .select({
          id: students.id,
          nis: students.nis,
          name: students.fullName,
        })
        .from(students)
        .where(
          and(
            eq(students.classId, Number(filterId)),
            eq(students.status, "active")
          )
        )
        .orderBy(asc(students.fullName));
      studentList = results;
    } else if (filterType === "halaqah") {
      const results = await db
        .select({
          id: students.id,
          nis: students.nis,
          name: students.fullName,
        })
        .from(halaqahMembers)
        .innerJoin(students, eq(halaqahMembers.studentId, students.id))
        .where(
          and(
            eq(halaqahMembers.halaqahId, Number(filterId)),
            eq(halaqahMembers.status, "active")
          )
        )
        .orderBy(asc(students.fullName));
      studentList = results;
    }

    if (studentList.length === 0) {
      return c.json(
        { success: false, message: "Tidak ada siswa dalam filter ini" },
        404
      );
    }

    // 2. Prepare Columns based on Category
    // Common: No, NIS, Nama Santri
    const headers = ["No", "NIS", "Nama Santri"];
    const keys = ["no", "nis", "name"];

    // Category specific
    if (category === "UPK") {
      headers.push(
        "Juz (Angka)",
        "Halaman Mulai",
        "Halaman Akhir",
        "Kelancaran (0-100)",
        "Tajwid (0-100)",
        "Makhraj (0-100)",
        "Adab (0-100)",
        "Catatan"
      );
      keys.push(
        "juz",
        "startPage",
        "endPage",
        "scoreFluency",
        "scoreTajwid",
        "scoreMakhraj",
        "scoreAdab",
        "notes"
      );
    } else if (category === "UKJ") {
      headers.push(
        "Juz (Angka)",
        "Kelancaran (0-100)",
        "Tajwid (0-100)",
        "Makhraj (0-100)",
        "Adab (0-100)",
        "Catatan"
      );
      keys.push(
        "juz",
        "scoreFluency",
        "scoreTajwid",
        "scoreMakhraj",
        "scoreAdab",
        "notes"
      );
    } else {
      // UA, Suluk, Other
      headers.push(
        "Nilai Akhir (0-100)",
        "Keterangan (Lulus/Tidak/Bersyarat)",
        "Catatan"
      );
      keys.push("finalScore", "verdict", "notes");
    }

    // 3. Create Data Rows
    const data = studentList.map((s, idx) => {
      const row: any = {
        no: idx + 1,
        nis: s.nis,
        name: s.name,
      };
      // Fill empty slots for users to fill
      // Using generic logic? ExcelJS is easier for this, but XLSX requires array of arrays or objects.
      // Array of arrays is best for ordering.
      return row;
    });

    // Convert to AOA for XLSX
    const wsData = [
      [`Template Import Ujian Tahfidz - ${category}`], // Title
      [`Tahun: ${year}, Semester: ${semester}`], // Metadata
      [], // Spacer
      headers,
    ];

    data.forEach((row) => {
      const r = [row.no, row.nis, row.name];
      // Empty cells for the rest
      for (let i = 3; i < headers.length; i++) {
        r.push("");
      }
      wsData.push(r);
    });

    // 4. Generate Workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set Column Widths (Optional)
    const wscols = [
      { wch: 5 }, // No
      { wch: 15 }, // NIS
      { wch: 30 }, // Name
      { wch: 10 }, // Juz/Score
      { wch: 10 }, // Page/..
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 30 }, // Notes
    ];
    ws["!cols"] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Template");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    c.header(
      "Content-Disposition",
      `attachment; filename="Template_Exams_${category}_${year.replace(
        /[^a-zA-Z0-9]/g,
        ""
      )}_${semester}.xlsx"`
    );
    c.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    return c.body(buf);
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// POST /exams/import - Import Excel
app.post("/exams/import", async (c) => {
  try {
    const dryRun = c.req.query("dryRun") === "true";
    const body = await c.req.parseBody();
    const file = body["file"]; // File param
    const academicYear = (body["academicYear"] as string) || "";
    const semester = (body["semester"] || "1") as
      | "1"
      | "2"
      | "ganjil"
      | "genap";
    const examinerId = parseInt((body["examinerId"] as string) || "0");
    const examDateStr = (body["examDate"] as string) || "";
    const category = (body["category"] as string) || "Other";

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, message: "File is required" }, 400);
    }

    if (!dryRun && (!examinerId || !examDateStr)) {
      // For preview, we might be lenient or just validate strictness same as import
      // But let's enforce strictness for simplicity
      return c.json(
        { success: false, message: "Examiner and Date required" },
        400
      );
    }

    // 1. Read File
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return c.json(
        { success: false, message: "File Excel kosong atau tidak valid" },
        400
      );
    }
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      return c.json({ success: false, message: "Worksheet tidak valid" }, 400);
    }

    // Convert to JSON
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { range: 3 });

    let successCount = 0;
    let failCount = 0;
    const errors: { row: number; error: string; nis?: string }[] = [];
    const validData: any[] = []; // For preview

    const examDate = new Date(examDateStr);

    // 2. Process Rows
    // Using for loop with index to track row number (jsonData index + 4 + 1 for user friendly row number or just + 5)
    // Header is row 4 (idx 3). So data starts at row 5 (idx 4).
    const startRowOffset = 5;

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNum = i + startRowOffset;
      const nis = row["NIS"];

      if (!nis) {
        // Skip empty rows or log error?
        // errors.push({ row: rowNum, error: "NIS kosong" });
        continue;
      }

      try {
        const student = await db.query.students.findFirst({
          where: eq(students.nis, String(nis).trim()),
        });

        if (!student) {
          failCount++;
          errors.push({
            row: rowNum,
            error: `NIS ${nis} tidak ditemukan`,
            nis,
          });
          continue;
        }

        const payload: any = {
          studentId: student.id,
          examinerId,
          examDate,
          examCategory: category as any,
          examType: `${category} Import`,
          academicYear,
          semester: semester as any,
        };

        let calculatedFinalScore = 0;

        if (category === "UPK") {
          payload.juz = row["Juz (Angka)"];
          payload.startPage = row["Halaman Mulai"];
          payload.endPage = row["Halaman Akhir"];
          payload.scoreFluency = row["Kelancaran (0-100)"];
          payload.scoreTajwid = row["Tajwid (0-100)"];
          payload.scoreMakhraj = row["Makhraj (0-100)"];
          payload.scoreAdab = row["Adab (0-100)"];
          payload.notes = row["Catatan"];

          const scores = [
            payload.scoreFluency,
            payload.scoreTajwid,
            payload.scoreMakhraj,
            payload.scoreAdab,
          ].map((v) => Number(v) || 0);

          calculatedFinalScore = Math.round(
            scores.reduce((a, b) => a + b, 0) / 4
          );
        } else if (category === "UKJ") {
          payload.juz = row["Juz (Angka)"];
          payload.scoreFluency = row["Kelancaran (0-100)"];
          payload.scoreTajwid = row["Tajwid (0-100)"];
          payload.scoreMakhraj = row["Makhraj (0-100)"];
          payload.scoreAdab = row["Adab (0-100)"];
          payload.notes = row["Catatan"];

          const scores = [
            payload.scoreFluency,
            payload.scoreTajwid,
            payload.scoreMakhraj,
            payload.scoreAdab,
          ].map((v) => Number(v) || 0);
          calculatedFinalScore = Math.round(
            scores.reduce((a, b) => a + b, 0) / 4
          );
        } else {
          calculatedFinalScore = Number(row["Nilai Akhir (0-100)"]) || 0;

          let rawVerdict =
            (row["Keterangan (Lulus/Tidak/Bersyarat)"] as string) || "";
          rawVerdict = rawVerdict.toLowerCase().trim();

          let verdictValue = "fail"; // Default
          if (rawVerdict.includes("lulus") && !rawVerdict.includes("tidak")) {
            verdictValue = "pass";
          } else if (
            rawVerdict.includes("tidak") ||
            rawVerdict.includes("gagal")
          ) {
            verdictValue = "fail";
          } else if (rawVerdict.includes("bersyarat")) {
            verdictValue = "conditional";
          } else {
            // Fallback auto verdict logic if text is unknown/empty
            verdictValue = calculatedFinalScore >= 75 ? "pass" : "fail";
          }

          payload.verdict = verdictValue;
          payload.notes = row["Catatan"];
        }

        payload.finalScore = calculatedFinalScore;
        if (category === "UPK" || category === "UKJ") {
          payload.verdict = calculatedFinalScore >= 75 ? "pass" : "fail";
        }

        // For Suluk and UA, check for duplicate (one per student per semester per academic year)
        // This applies to both preview and actual import
        if (category === "Suluk" || category === "UA") {
          const existing = await db.query.tahfidzExams.findFirst({
            where: and(
              eq(tahfidzExams.studentId, student.id),
              eq(tahfidzExams.examCategory, category as any),
              eq(tahfidzExams.academicYear, String(academicYear).trim()),
              eq(tahfidzExams.semester, String(semester).trim() as any)
            ),
          });

          if (existing) {
            failCount++;
            const categoryLabel =
              category === "Suluk" ? "Suluk" : "Ujian Akhir";
            errors.push({
              row: rowNum,
              error: `Data ${categoryLabel} sudah ada untuk siswa ini di semester ini`,
              nis: String(nis),
            });
            continue;
          }
        }

        // Preview Optimization: Include basic student info in payload for display
        if (dryRun) {
          validData.push({
            ...payload,
            studentName: student.fullName,
            nis: student.nis,
            row: rowNum,
          });
        } else {
          await db.insert(tahfidzExams).values(payload);
        }
        successCount++;
      } catch (err: any) {
        failCount++;
        errors.push({ row: rowNum, error: err.message, nis });
      }
    }

    if (dryRun) {
      return c.json({
        success: true,
        data: {
          totalRows: jsonData.length,
          validRows: successCount,
          invalidRows: failCount,
          validData,
          errors,
        },
      });
    }

    return c.json({
      success: true,
      message: `Import selesai. Sukses: ${successCount}, Gagal: ${failCount}`,
      errors,
    });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});
