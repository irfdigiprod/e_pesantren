import { Hono } from "hono";
import { sql, and, gte, lte, eq, desc } from "drizzle-orm";
import { db } from "../db";
import { teachers } from "../db/schema/teachers";
import { students } from "../db/schema/students";
import { rewardsPunishments } from "../db/schema/rewards-punishments";
import { tahfidzDeposits, tahfidzExams } from "../db/schema/tahfidz";
import { permissionRequests } from "../db/schema/permissions";
import { teacherAttendances, studentAttendances } from "../db/schema/attendance";
import { healthExaminations, clinicPatients, medicines } from "../db/schema/clinic";
import { classes, reportCardDates } from "../db/schema/academic";
import { rooms } from "../db/schema/rooms";
import { divisions, teacherDivisions } from "../db/schema/divisions";
import { halaqahMembers, halaqahGroups } from "../db/schema/halaqah";
import { authMiddleware } from "../middleware/auth";

const analyticsRoute = new Hono();

// Apply auth to all routes
analyticsRoute.use("*", authMiddleware);

/**
 * GET /api/analytics/filters
 * Retrieves available academic years and semesters for the dropdowns.
 */
analyticsRoute.get("/filters", async (c) => {
  try {
    // Get unique academic years from classes
    const yearsResult = await db
      .select({ academicYear: classes.academicYear })
      .from(classes)
      .groupBy(classes.academicYear)
      .orderBy(desc(classes.academicYear));

    const academicYears = yearsResult.map((y) => y.academicYear).filter(Boolean);

    // Hardcode semesters or get from db if needed. Usually it's just 1 and 2 (Ganjil/Genap)
    const semesters = [
      { value: 1, label: "Ganjil" },
      { value: 2, label: "Genap" },
    ];

    return c.json({
      success: true,
      data: {
        academicYears,
        semesters,
      },
    });
  } catch (error: any) {
    console.error("Error fetching analytics filters:", error);
    return c.json(
      {
        success: false,
        message: "Failed to fetch filters",
      },
      500
    );
  }
});

/**
 * GET /api/analytics/recap
 * Retrieves aggregated data for the analytics dashboard based on date range or academic year.
 */
analyticsRoute.get("/recap", async (c) => {
  try {
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");
    const academicYear = c.req.query("academicYear");
    const semester = c.req.query("semester");

    // We need to build date filters for tables that use 'createdAt' or 'date'
    let dateFilterSql = sql`1=1`;
    let createdAtFilterSql = sql`1=1`;
    let timestampFilterSql = sql`1=1`;

    if (startDate && endDate) {
      dateFilterSql = sql`DATE(${sql.raw("date")}) >= ${startDate} AND DATE(${sql.raw("date")}) <= ${endDate}`;
      createdAtFilterSql = sql`DATE(${sql.raw("created_at")}) >= ${startDate} AND DATE(${sql.raw("created_at")}) <= ${endDate}`;
      timestampFilterSql = sql`DATE(${sql.raw("deposit_date")}) >= ${startDate} AND DATE(${sql.raw("deposit_date")}) <= ${endDate}`;
    }

    // Helper to add academic year filter where applicable
    let academicYearFilterSql = sql`1=1`;
    if (academicYear) {
      academicYearFilterSql = sql`academic_year = ${academicYear}`;
    }

    // 1. SDM (Pegawai/Guru/Staf)
    const sdmResult = await db
      .select({
        employeeType: teachers.employeeType,
        gender: teachers.gender,
        divisionName: divisions.name,
        count: sql<number>`count(*)`,
      })
      .from(teachers)
      .leftJoin(teacherDivisions, eq(teachers.id, teacherDivisions.teacherId))
      .leftJoin(divisions, eq(teacherDivisions.divisionId, divisions.id))
      .where(sql`${teachers.status} = 'active'`)
      .groupBy(teachers.employeeType, teachers.gender, divisions.name);

    const sdm = {
      teachers: sdmResult.filter(r => r.employeeType === 'teacher').reduce((acc, curr) => acc + Number(curr.count), 0),
      staff: sdmResult.filter(r => r.employeeType === 'staff').reduce((acc, curr) => acc + Number(curr.count), 0),
      male: sdmResult.filter(r => r.gender === 'male').reduce((acc, curr) => acc + Number(curr.count), 0),
      female: sdmResult.filter(r => r.gender === 'female').reduce((acc, curr) => acc + Number(curr.count), 0),
      byDivision: sdmResult.reduce((acc, curr) => {
        const div = curr.divisionName || 'Tanpa Divisi';
        if (!acc[div]) acc[div] = 0;
        acc[div] += Number(curr.count);
        return acc;
      }, {} as Record<string, number>)
    };

    // 2. Siswa
    const studentsResult = await db
      .select({
        status: students.status,
        gender: students.gender,
        className: classes.name,
        count: sql<number>`count(*)`,
      })
      .from(students)
      .leftJoin(classes, eq(students.classId, classes.id))
      .where(sql`${students.status} IN ('active', 'graduated', 'transferred', 'dropped')`)
      .groupBy(students.status, students.gender, classes.name);

    const activeStudentsResult = studentsResult.filter(r => r.status === 'active');
    
    const siswa = {
      totalActive: activeStudentsResult.reduce((acc, curr) => acc + Number(curr.count), 0),
      male: activeStudentsResult.filter(r => r.gender === 'male').reduce((acc, curr) => acc + Number(curr.count), 0),
      female: activeStudentsResult.filter(r => r.gender === 'female').reduce((acc, curr) => acc + Number(curr.count), 0),
      statusBreakdown: studentsResult.reduce((acc, curr) => {
        const status = curr.status || 'unknown';
        if(!acc[status]) acc[status] = 0;
        acc[status] += Number(curr.count);
        return acc;
      }, {} as Record<string, number>),
      byClassAndGender: activeStudentsResult.reduce((acc, curr) => {
        const cls = curr.className || 'Tanpa Kelas';
        const gender = curr.gender || 'unknown';
        if (!acc[cls]) acc[cls] = { male: 0, female: 0 };
        if (gender === 'male' || gender === 'female') {
          acc[cls][gender] += Number(curr.count);
        }
        return acc;
      }, {} as Record<string, { male: number; female: number }>)
    };

    // 3. Kedisiplinan (Rewards and Punishments)
    const kedisiplinanResult = await db
      .select({
        type: rewardsPunishments.type,
        gender: students.gender,
        className: classes.name,
        roomName: rooms.name,
        count: sql<number>`count(*)`,
      })
      .from(rewardsPunishments)
      .leftJoin(students, eq(rewardsPunishments.studentId, students.id))
      .leftJoin(classes, eq(students.classId, classes.id))
      .leftJoin(rooms, eq(students.roomId, rooms.id))
      .where(sql`DATE(${rewardsPunishments.date}) >= ${startDate || '1970-01-01'} AND DATE(${rewardsPunishments.date}) <= ${endDate || '2099-12-31'}`)
      .groupBy(rewardsPunishments.type, students.gender, classes.name, rooms.name);

    const kedisiplinan = {
      rewards: kedisiplinanResult.filter(r => r.type === 'reward').reduce((acc, curr) => acc + Number(curr.count), 0),
      punishments: kedisiplinanResult.filter(r => r.type === 'punishment').reduce((acc, curr) => acc + Number(curr.count), 0),
      byClass: kedisiplinanResult.reduce((acc, curr) => {
        const cls = curr.className || 'Tanpa Kelas';
        if (!acc[cls]) acc[cls] = { reward: 0, punishment: 0 };
        if (curr.type) acc[cls][curr.type] += Number(curr.count);
        return acc;
      }, {} as Record<string, { reward: number; punishment: number }>),
      byGender: kedisiplinanResult.reduce((acc, curr) => {
        const gen = curr.gender || 'unknown';
        if (!acc[gen]) acc[gen] = { reward: 0, punishment: 0 };
        if (curr.type) acc[gen][curr.type] += Number(curr.count);
        return acc;
      }, {} as Record<string, { reward: number; punishment: number }>),
      byRoom: kedisiplinanResult.reduce((acc, curr) => {
        const rm = curr.roomName || 'Tanpa Kamar';
        if (!acc[rm]) acc[rm] = { reward: 0, punishment: 0 };
        if (curr.type) acc[rm][curr.type] += Number(curr.count);
        return acc;
      }, {} as Record<string, { reward: number; punishment: number }>)
    };

    // 4. Tahfidz
    const tahfidzDepositsResult = await db
      .select({
        type: tahfidzDeposits.type,
        count: sql<number>`count(*)`,
      })
      .from(tahfidzDeposits)
      .where(sql`DATE(${tahfidzDeposits.depositDate}) >= ${startDate || '1970-01-01'} AND DATE(${tahfidzDeposits.depositDate}) <= ${endDate || '2099-12-31'}`)
      .groupBy(tahfidzDeposits.type);

    const tahfidzHalaqahResult = await db
      .select({
        halaqahName: halaqahGroups.name,
        totalPages: sql<number>`sum(${tahfidzDeposits.totalPages})`,
      })
      .from(tahfidzDeposits)
      .leftJoin(halaqahMembers, eq(tahfidzDeposits.studentId, halaqahMembers.studentId))
      .leftJoin(halaqahGroups, eq(halaqahMembers.halaqahId, halaqahGroups.id))
      .where(sql`DATE(${tahfidzDeposits.depositDate}) >= ${startDate || '1970-01-01'} AND DATE(${tahfidzDeposits.depositDate}) <= ${endDate || '2099-12-31'}`)
      .groupBy(halaqahGroups.name);

    const tahfidz = {
      deposits: tahfidzDepositsResult.reduce((acc, curr) => {
        const type = curr.type || 'unknown';
        acc[type] = Number(curr.count);
        return acc;
      }, {} as Record<string, number>),
      byHalaqah: tahfidzHalaqahResult.reduce((acc, curr) => {
        const group = curr.halaqahName || 'Tanpa Halaqah';
        acc[group] = Number(curr.totalPages) || 0;
        return acc;
      }, {} as Record<string, number>)
    };

    // 5. Perizinan Pegawai
    const permissionsResult = await db
      .select({
        type: permissionRequests.type,
        gender: teachers.gender,
        divisionName: divisions.name,
        count: sql<number>`count(*)`,
      })
      .from(permissionRequests)
      .leftJoin(teachers, eq(permissionRequests.teacherId, teachers.id))
      .leftJoin(teacherDivisions, eq(teachers.id, teacherDivisions.teacherId))
      .leftJoin(divisions, eq(teacherDivisions.divisionId, divisions.id))
      .where(sql`DATE(${permissionRequests.startDate}) >= ${startDate || '1970-01-01'} AND DATE(${permissionRequests.startDate}) <= ${endDate || '2099-12-31'}`)
      .groupBy(permissionRequests.type, teachers.gender, divisions.name);

    const typeMap: Record<string, string> = {
      sick: 'sakit',
      permit: 'izin',
      leave: 'cuti'
    };

    const perizinan = {
      byDivisionAndType: permissionsResult.reduce((acc, curr) => {
        const div = curr.divisionName || 'Tanpa Divisi';
        const rawType = curr.type || 'unknown';
        const type = typeMap[rawType] || rawType;
        if (!acc[div]) acc[div] = { sakit: 0, cuti: 0, izin: 0, dinas: 0 };
        if (acc[div][type] !== undefined) acc[div][type] += Number(curr.count);
        else acc[div][type] = Number(curr.count); // Fallback if other types exist
        return acc;
      }, {} as Record<string, Record<string, number>>),
      byGenderAndType: permissionsResult.reduce((acc, curr) => {
        const gen = curr.gender || 'unknown';
        const rawType = curr.type || 'unknown';
        const type = typeMap[rawType] || rawType;
        if (!acc[gen]) acc[gen] = { sakit: 0, cuti: 0, izin: 0, dinas: 0 };
        if (acc[gen][type] !== undefined) acc[gen][type] += Number(curr.count);
        else acc[gen][type] = Number(curr.count);
        return acc;
      }, {} as Record<string, Record<string, number>>)
    };

    // 6. Absensi Pegawai
    const teacherAttResult = await db
      .select({
        status: teacherAttendances.status,
        count: sql<number>`count(*)`,
      })
      .from(teacherAttendances)
      .where(sql`DATE(${teacherAttendances.date}) >= ${startDate || '1970-01-01'} AND DATE(${teacherAttendances.date}) <= ${endDate || '2099-12-31'}`)
      .groupBy(teacherAttendances.status);

    const absensiPegawai = teacherAttResult.reduce((acc, curr) => {
      const status = curr.status || 'unknown';
      acc[status] = Number(curr.count);
      return acc;
    }, {} as Record<string, number>);

    // 7. Absensi Siswa
    const studentAttResult = await db
      .select({
        status: studentAttendances.status,
        count: sql<number>`count(*)`,
      })
      .from(studentAttendances)
      .where(sql`DATE(${studentAttendances.date}) >= ${startDate || '1970-01-01'} AND DATE(${studentAttendances.date}) <= ${endDate || '2099-12-31'}`)
      .groupBy(studentAttendances.status);

    const absensiSiswa = studentAttResult.reduce((acc, curr) => {
      const status = curr.status || 'unknown';
      acc[status] = Number(curr.count);
      return acc;
    }, {} as Record<string, number>);

    // 8. Kesehatan (Clinic)
    const healthResult = await db
      .select({
        patientType: clinicPatients.type,
        count: sql<number>`count(*)`,
      })
      .from(healthExaminations)
      .leftJoin(clinicPatients, eq(healthExaminations.clinicPatientId, clinicPatients.id))
      .where(sql`DATE(${healthExaminations.examinationDate}) >= ${startDate || '1970-01-01'} AND DATE(${healthExaminations.examinationDate}) <= ${endDate || '2099-12-31'}`)
      .groupBy(clinicPatients.type);

    const lowStockMedicines = await db
      .select({ count: sql<number>`count(*)` })
      .from(medicines)
      .where(sql`stock <= min_stock`);

    const kesehatan = {
      examinationsByType: healthResult.reduce((acc, curr) => {
        const type = curr.patientType || 'unknown';
        acc[type] = Number(curr.count);
        return acc;
      }, {} as Record<string, number>),
      totalExaminations: healthResult.reduce((acc, curr) => acc + Number(curr.count), 0),
      lowStockMedicines: Number(lowStockMedicines[0]?.count || 0)
    };

    // 9. Ujian (Tahfidz Exams for now, as academic grades might be complex without academic year filter)
    let examsSql = sql`1=1`;
    if (academicYear) examsSql = sql`academic_year = ${academicYear}`;
    if (semester) examsSql = sql`${examsSql} AND semester = ${semester}`;
    if (startDate && endDate) examsSql = sql`${examsSql} AND DATE(exam_date) >= ${startDate} AND DATE(exam_date) <= ${endDate}`;

    const tahfidzExamsResult = await db
      .select({
        verdict: tahfidzExams.verdict,
        count: sql<number>`count(*)`,
      })
      .from(tahfidzExams)
      .where(examsSql)
      .groupBy(tahfidzExams.verdict);

    const ujian = {
      tahfidzExams: tahfidzExamsResult.reduce((acc, curr) => {
        const verdict = curr.verdict || 'unknown';
        acc[verdict] = Number(curr.count);
        return acc;
      }, {} as Record<string, number>)
    };

    // 10. Data Kamar
    const roomsResult = await db
      .select({
        totalCapacity: sql<number>`sum(capacity)`,
        count: sql<number>`count(*)`,
      })
      .from(rooms)
      .where(eq(rooms.status, 'active'));

    const activeRooms = roomsResult[0] || { totalCapacity: 0, count: 0 };

    // 11. Data Kelas
    let classSql = sql`1=1`;
    if (academicYear) classSql = sql`academic_year = ${academicYear}`;

    const classesResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(classes)
      .where(classSql);

    const activeClasses = classesResult[0]?.count || 0;

    return c.json({
      success: true,
      data: {
        sdm,
        siswa,
        kedisiplinan,
        tahfidz,
        perizinan,
        absensiPegawai,
        absensiSiswa,
        kesehatan,
        ujian,
        kamar: {
          totalRooms: Number(activeRooms.count),
          totalCapacity: Number(activeRooms.totalCapacity)
        },
        kelas: {
          totalClasses: Number(activeClasses)
        }
      },
    });
  } catch (error: any) {
    console.error("Error fetching analytics recap:", error);
    return c.json(
      {
        success: false,
        message: "Failed to fetch analytics recap",
        error: error.message,
      },
      500
    );
  }
});

export default analyticsRoute;
