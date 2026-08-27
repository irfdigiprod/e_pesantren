import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { academicPeriods, auditLogs, reportSnapshots } from "../db/schema/long-term-foundation";
import { grades, reports } from "../db/schema/academic";
import { tahfidzDeposits, tahfidzExams, tahfidzReportCards } from "../db/schema/tahfidz";

export type PeriodStatus = "draft" | "active" | "locked" | "archived";
export type SnapshotReportType = "academic" | "tahfidz" | "combined";

type SemesterInput = number | string | null | undefined;

export function normalizeSemester(semester: SemesterInput): number | null {
  if (semester === null || semester === undefined || semester === "") return null;
  const normalized = String(semester).toLowerCase();
  if (normalized === "ganjil") return 1;
  if (normalized === "genap") return 2;
  const parsed = Number(normalized);
  if (parsed === 1 || parsed === 2) return parsed;
  return null;
}

export async function getAcademicPeriod(academicYear: string, semester: SemesterInput) {
  const normalizedSemester = normalizeSemester(semester);
  if (!academicYear || !normalizedSemester) return null;

  return db.query.academicPeriods.findFirst({
    where: and(
      eq(academicPeriods.academicYear, academicYear),
      eq(academicPeriods.semester, normalizedSemester),
    ),
  });
}

export async function assertAcademicPeriodWritable(
  academicYear: string,
  semester: SemesterInput,
  actionLabel = "mengubah data periode ini",
) {
  const normalizedSemester = normalizeSemester(semester);
  if (!academicYear || !normalizedSemester) return;

  const period = await getAcademicPeriod(academicYear, normalizedSemester);
  if (!period) return;

  if (period.status === "locked" || period.status === "archived") {
    const error = new Error(
      `Periode ${academicYear} semester ${normalizedSemester} sudah ${period.status}; tidak bisa ${actionLabel} tanpa flow revisi resmi.`,
    ) as Error & { statusCode?: number; periodStatus?: PeriodStatus };
    error.statusCode = 409;
    error.periodStatus = period.status;
    throw error;
  }
}

export async function getAcademicPeriodByDate(dateInput: Date | string | null | undefined) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const periods = await db.query.academicPeriods.findMany();
  const dateKey = date.toISOString().slice(0, 10);

  return (
    periods.find((period) => {
      if (!period.startDate || !period.endDate) return false;
      const startKey = new Date(period.startDate).toISOString().slice(0, 10);
      const endKey = new Date(period.endDate).toISOString().slice(0, 10);
      return dateKey >= startKey && dateKey <= endKey;
    }) || null
  );
}

export async function assertDateInWritableAcademicPeriod(
  dateInput: Date | string | null | undefined,
  actionLabel = "mengubah data periode ini",
) {
  const period = await getAcademicPeriodByDate(dateInput);
  if (!period) return;

  if (period.status === "locked" || period.status === "archived") {
    const error = new Error(
      `Tanggal ${new Date(dateInput as any).toISOString().slice(0, 10)} masuk periode ${period.academicYear} semester ${period.semester} yang sudah ${period.status}; tidak bisa ${actionLabel} tanpa flow revisi resmi.`,
    ) as Error & { statusCode?: number; periodStatus?: PeriodStatus };
    error.statusCode = 409;
    error.periodStatus = period.status;
    throw error;
  }
}

export async function writeAuditLog(params: {
  actorUserId?: number | null;
  entityType: string;
  entityId?: string | number | null;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  reason?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await db.insert(auditLogs).values({
    actorUserId: params.actorUserId ?? null,
    entityType: params.entityType,
    entityId:
      params.entityId === undefined || params.entityId === null
        ? null
        : String(params.entityId),
    action: params.action,
    beforeJson: params.beforeJson ?? null,
    afterJson: params.afterJson ?? null,
    reason: params.reason ?? null,
    requestId: params.requestId ?? null,
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
  });
}

export async function createOrUpdateReportSnapshot(params: {
  reportType: SnapshotReportType;
  studentId: number;
  classId?: number | null;
  reportId?: number | null;
  academicYear: string;
  semester: SemesterInput;
  status?: "draft" | "published" | "revised" | "archived";
  payload: unknown;
  publishedBy?: number | null;
  pdfPath?: string | null;
}) {
  const normalizedSemester = normalizeSemester(params.semester);
  if (!normalizedSemester) {
    throw new Error("Semester snapshot tidak valid");
  }

  const conditions = [
    eq(reportSnapshots.studentId, params.studentId),
    eq(reportSnapshots.academicYear, params.academicYear),
    eq(reportSnapshots.semester, normalizedSemester),
    eq(reportSnapshots.reportType, params.reportType),
  ];

  if (params.reportType === "academic" && params.reportId) {
    conditions.push(eq(reportSnapshots.reportId, params.reportId));
  }

  const existing = await db.query.reportSnapshots.findFirst({
    where: and(...conditions),
  });

  const snapshotPayload = {
    classId: params.classId ?? null,
    reportId: params.reportId ?? null,
    academicYear: params.academicYear,
    semester: normalizedSemester,
    reportType: params.reportType,
    frozenAt: new Date().toISOString(),
    payload: params.payload,
  };

  if (existing) {
    await db
      .update(reportSnapshots)
      .set({
        classId: params.classId ?? null,
        reportId: params.reportId ?? null,
        status: params.status ?? "published",
        finalPayloadJson: snapshotPayload,
        pdfPath: params.pdfPath ?? existing.pdfPath ?? null,
        publishedBy: params.publishedBy ?? existing.publishedBy ?? null,
        publishedAt: new Date(),
        lockedAt: new Date(),
      })
      .where(eq(reportSnapshots.id, existing.id));

    return db.query.reportSnapshots.findFirst({
      where: eq(reportSnapshots.id, existing.id),
    });
  }

  const result = await db.insert(reportSnapshots).values({
    studentId: params.studentId,
    classId: params.classId ?? null,
    reportId: params.reportId ?? null,
    academicYear: params.academicYear,
    semester: normalizedSemester,
    reportType: params.reportType,
    status: params.status ?? "published",
    finalPayloadJson: snapshotPayload,
    pdfPath: params.pdfPath ?? null,
    publishedBy: params.publishedBy ?? null,
    publishedAt: new Date(),
    lockedAt: new Date(),
  });

  return db.query.reportSnapshots.findFirst({
    where: eq(reportSnapshots.id, Number(result[0].insertId)),
  });
}

export async function buildAcademicReportSnapshotPayload(reportId: number) {
  const report = await db.query.reports.findFirst({
    where: eq(reports.id, reportId),
  });
  if (!report) return null;

  const reportGrades = await db.query.grades.findMany({
    where: and(
      eq(grades.studentId, report.studentId),
      eq(grades.academicYear, report.academicYear),
      eq(grades.semester, report.semester),
    ),
  });

  return {
    report,
    grades: reportGrades,
  };
}

export async function buildTahfidzReportSnapshotPayload(params: {
  studentId: number;
  academicYear: string;
  semester: SemesterInput;
}) {
  const normalizedSemester = normalizeSemester(params.semester);
  if (!normalizedSemester) return null;

  const semesterText = String(normalizedSemester) as "1" | "2";
  const reportCard = await db.query.tahfidzReportCards.findFirst({
    where: and(
      eq(tahfidzReportCards.studentId, params.studentId),
      eq(tahfidzReportCards.academicYear, params.academicYear),
      eq(tahfidzReportCards.semester, semesterText),
    ),
  });

  const exams = await db.query.tahfidzExams.findMany({
    where: and(
      eq(tahfidzExams.studentId, params.studentId),
      eq(tahfidzExams.academicYear, params.academicYear),
      eq(tahfidzExams.semester, semesterText),
    ),
  });

  const deposits = await db.query.tahfidzDeposits.findMany({
    where: eq(tahfidzDeposits.studentId, params.studentId),
  });

  return {
    reportCard,
    exams,
    deposits,
  };
}
