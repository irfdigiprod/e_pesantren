import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import {
  classes,
  subjects,
  schedules,
  grades,
  reports,
} from "../db/schema/academic";
import { authMiddleware, requireRole } from "../middleware/auth";
import {
  createClassSchema,
  updateClassSchema,
  createSubjectSchema,
  updateSubjectSchema,
  createScheduleSchema,
  updateScheduleSchema,
  createGradeSchema,
  updateGradeSchema,
  generateReportSchema,
  updateReportSchema,
  bulkGradeSchema,
} from "../validators/academic";

// Helper to check for duplicate subjects with overlapping grades
// Returns object with isDuplicate boolean and message details if any
async function checkDuplicateSubject(
  name: string,
  gradesStr: string | null | undefined,
  excludeId?: number
) {
  // Find all subjects with same name (limit to reasonable amount if needed, but names are usually unique-ish)
  const candidates = await db.query.subjects.findMany({
    where: eq(subjects.name, name),
  });

  for (const sub of candidates) {
    if (excludeId && sub.id === excludeId) continue;

    // Parse grades
    let g1: number[] = [];
    try {
      g1 = sub.grades ? JSON.parse(sub.grades) : [];
    } catch {
      g1 = [];
    }

    let g2: number[] = [];
    try {
      g2 = gradesStr ? JSON.parse(gradesStr) : [];
    } catch {
      g2 = [];
    }

    if (!Array.isArray(g1)) g1 = [];
    if (!Array.isArray(g2)) g2 = [];

    // Overlap logic:
    // If g1 is empty OR g2 is empty => Means "All Grades", so it overlaps with everything.
    // If both have values => Check intersection.
    const isOverlap =
      g1.length === 0 || g2.length === 0 || g1.some((x: any) => g2.includes(x));

    if (isOverlap) {
      const g1Str = g1.length === 0 ? "Semua Kelas" : `Kelas ${g1.join(", ")}`;
      return {
        isDuplicate: true,
        message: `Mata pelajaran '${name}' sudah ada untuk ${g1Str}`,
      };
    }
  }
  return { isDuplicate: false };
}

const academicRoute = new Hono();

// Apply auth to all routes
academicRoute.use("*", authMiddleware);

// ============ CLASSES ============

// Get all classes
academicRoute.get("/classes", async (c) => {
  try {
    const academicYear = c.req.query("academicYear");

    const allClasses = academicYear
      ? await db.query.classes.findMany({
          where: eq(classes.academicYear, academicYear),
        })
      : await db.query.classes.findMany();

    // Import students, teachers, and classHomeroomTeachers for enriching data
    const { students } = await import("../db/schema/students");
    const { teachers } = await import("../db/schema/teachers");
    const { classHomeroomTeachers } = await import("../db/schema/academic");

    // Enrich each class with students and homeroom teachers
    const enrichedClasses = await Promise.all(
      allClasses.map(async (cls) => {
        // Get students in this class
        const classStudents = await db.query.students.findMany({
          where: eq(students.classId, cls.id),
        });

        // Get homeroom teachers from pivot table
        const homeroomTeachersData =
          await db.query.classHomeroomTeachers.findMany({
            where: eq(classHomeroomTeachers.classId, cls.id),
          });

        // Get teacher details for homeroom teachers
        const homeroomTeachers = await Promise.all(
          homeroomTeachersData.map(async (ht) => {
            const teacher = await db.query.teachers.findFirst({
              where: eq(teachers.id, ht.teacherId),
            });
            return { ...ht, teacher };
          })
        );

        // Also keep backward compatibility with single homeroom teacher
        let homeRoomTeacher = null;
        if (cls.homeroomTeacherId) {
          homeRoomTeacher = await db.query.teachers.findFirst({
            where: eq(teachers.id, cls.homeroomTeacherId),
          });
        }

        return {
          ...cls,
          students: classStudents,
          homeRoomTeacher,
          homeroomTeachers,
        };
      })
    );

    return c.json({
      success: true,
      data: enrichedClasses,
    });
  } catch (error) {
    console.error("Get classes error:", error);
    return c.json({ success: false, message: "Failed to get classes" }, 500);
  }
});

// Get class by ID
academicRoute.get("/classes/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, id),
    });

    if (!classData) {
      return c.json({ success: false, message: "Class not found" }, 404);
    }

    // Import students table and get students in this class
    const { students } = await import("../db/schema/students");
    const { teachers } = await import("../db/schema/teachers");

    const classStudents = await db.query.students.findMany({
      where: eq(students.classId, id),
    });

    // Get homeroom teacher details (legacy column)
    let homeroomTeacher = null;
    if (classData.homeroomTeacherId) {
      homeroomTeacher = await db.query.teachers.findFirst({
        where: eq(teachers.id, classData.homeroomTeacherId),
      });
    }

    // Fallback: Check pivot table if legacy is null
    if (!homeroomTeacher) {
      const { classHomeroomTeachers } = await import("../db/schema/academic");
      const pivot = await db.query.classHomeroomTeachers.findFirst({
        where: eq(classHomeroomTeachers.classId, id),
      });

      if (pivot) {
        homeroomTeacher = await db.query.teachers.findFirst({
          where: eq(teachers.id, pivot.teacherId),
        });
      }
    }

    return c.json({
      success: true,
      data: {
        ...classData,
        students: classStudents,
        homeroomTeacher,
      },
    });
  } catch (error) {
    console.error("Get class error:", error);
    return c.json({ success: false, message: "Failed to get class" }, 500);
  }
});

// Create class
academicRoute.post(
  "/classes",
  requireRole("admin", "staff"),
  zValidator("json", createClassSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const result = await db.insert(classes).values(data);

      const newClass = await db.query.classes.findFirst({
        where: eq(classes.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Class created successfully",
        data: newClass,
      });
    } catch (error) {
      console.error("Create class error:", error);
      return c.json({ success: false, message: "Failed to create class" }, 500);
    }
  }
);

// Update class
academicRoute.put(
  "/classes/:id",
  requireRole("admin", "staff"),
  zValidator("json", updateClassSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.classes.findFirst({
        where: eq(classes.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Class not found" }, 404);
      }

      await db
        .update(classes)
        .set({ ...data })
        .where(eq(classes.id, id));

      const updated = await db.query.classes.findFirst({
        where: eq(classes.id, id),
      });

      return c.json({
        success: true,
        message: "Class updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update class error:", error);
      return c.json({ success: false, message: "Failed to update class" }, 500);
    }
  }
);

// Delete class
academicRoute.delete("/classes/:id", requireRole("admin"), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    await db.delete(classes).where(eq(classes.id, id));

    return c.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("Delete class error:", error);
    return c.json({ success: false, message: "Failed to delete class" }, 500);
  }
});

// Assign student to class
academicRoute.post(
  "/classes/:id/students",
  requireRole("admin", "staff"),
  async (c) => {
    try {
      const classId = parseInt(c.req.param("id"));
      const body = await c.req.json().catch(() => ({}));
      const studentId = body.studentId;
      const force = body.force === true;

      if (!studentId) {
        return c.json(
          { success: false, message: "Student ID is required" },
          400
        );
      }

      const { students } = await import("../db/schema/students");

      // Check if class exists
      const classItem = await db.query.classes.findFirst({
        where: eq(classes.id, classId),
      });

      if (!classItem) {
        return c.json({ success: false, message: "Class not found" }, 404);
      }

      // Check if student exists
      const student = await db.query.students.findFirst({
        where: eq(students.id, studentId),
      });

      if (!student) {
        return c.json({ success: false, message: "Student not found" }, 404);
      }

      // Check if student is already in THIS class
      if (student.classId === classId) {
        return c.json(
          { success: false, message: "Santri sudah ada di kelas ini" },
          400
        );
      }

      // Check if student is in ANY OTHER class
      if (student.classId && student.classId !== classId && !force) {
        // Get existing class name
        const existingClass = await db.query.classes.findFirst({
          where: eq(classes.id, student.classId),
        });

        return c.json({
          success: false,
          message: `Santri sudah terdaftar di kelas "${
            existingClass?.name || "lain"
          }"`,
          requiresConfirm: true,
          existingClass: {
            id: existingClass?.id,
            name: existingClass?.name || "Kelas Lain",
          },
        });
      }

      // Update student's class
      await db
        .update(students)
        .set({ classId })
        .where(eq(students.id, studentId));

      return c.json({
        success: true,
        message: force
          ? "Santri berhasil dipindahkan ke kelas ini"
          : "Santri berhasil ditambahkan ke kelas",
      });
    } catch (error) {
      console.error("Assign student to class error:", error);
      return c.json(
        { success: false, message: "Gagal menambahkan santri ke kelas" },
        500
      );
    }
  }
);

// ============ CLASS HOMEROOM TEACHERS ============

// Get homeroom teachers for a class
academicRoute.get("/classes/:id/homeroom-teachers", async (c) => {
  try {
    const classId = parseInt(c.req.param("id"));
    const { classHomeroomTeachers } = await import("../db/schema/academic");
    const { teachers } = await import("../db/schema/teachers");

    const homeroomTeachers = await db.query.classHomeroomTeachers.findMany({
      where: eq(classHomeroomTeachers.classId, classId),
    });

    // Get teacher details
    const teachersWithDetails = await Promise.all(
      homeroomTeachers.map(async (ht) => {
        const teacher = await db.query.teachers.findFirst({
          where: eq(teachers.id, ht.teacherId),
        });
        return {
          ...ht,
          teacher,
        };
      })
    );

    return c.json({
      success: true,
      data: teachersWithDetails,
    });
  } catch (error) {
    console.error("Get homeroom teachers error:", error);
    return c.json(
      { success: false, message: "Failed to get homeroom teachers" },
      500
    );
  }
});

// Add homeroom teacher to class
academicRoute.post(
  "/classes/:id/homeroom-teachers",
  requireRole("admin", "staff"),
  async (c) => {
    try {
      const classId = parseInt(c.req.param("id"));
      const body = await c.req.json();
      const teacherId = body.teacherId;

      if (!teacherId) {
        return c.json(
          { success: false, message: "Teacher ID is required" },
          400
        );
      }

      const { classHomeroomTeachers } = await import("../db/schema/academic");
      const { teachers } = await import("../db/schema/teachers");

      // Check if class exists
      const classExists = await db.query.classes.findFirst({
        where: eq(classes.id, classId),
      });
      if (!classExists) {
        return c.json({ success: false, message: "Class not found" }, 404);
      }

      // Check if teacher exists
      const teacherExists = await db.query.teachers.findFirst({
        where: eq(teachers.id, teacherId),
      });
      if (!teacherExists) {
        return c.json({ success: false, message: "Teacher not found" }, 404);
      }

      // Check if already assigned
      const existing = await db.query.classHomeroomTeachers.findFirst({
        where: and(
          eq(classHomeroomTeachers.classId, classId),
          eq(classHomeroomTeachers.teacherId, teacherId)
        ),
      });
      if (existing) {
        return c.json(
          { success: false, message: "Teacher is already a homeroom teacher" },
          400
        );
      }

      const result = await db.insert(classHomeroomTeachers).values({
        classId,
        teacherId,
        role: body.role || "wali_kelas",
      });

      return c.json({
        success: true,
        message: "Homeroom teacher added successfully",
      });
    } catch (error) {
      console.error("Add homeroom teacher error:", error);
      return c.json(
        { success: false, message: "Failed to add homeroom teacher" },
        500
      );
    }
  }
);

// Remove homeroom teacher from class
academicRoute.delete(
  "/classes/:id/homeroom-teachers/:teacherId",
  requireRole("admin"),
  async (c) => {
    try {
      const classId = parseInt(c.req.param("id"));
      const teacherId = parseInt(c.req.param("teacherId"));

      const { classHomeroomTeachers } = await import("../db/schema/academic");

      const existing = await db.query.classHomeroomTeachers.findFirst({
        where: and(
          eq(classHomeroomTeachers.classId, classId),
          eq(classHomeroomTeachers.teacherId, teacherId)
        ),
      });

      if (!existing) {
        return c.json(
          { success: false, message: "Homeroom teacher not found" },
          404
        );
      }

      await db
        .delete(classHomeroomTeachers)
        .where(eq(classHomeroomTeachers.id, existing.id));

      return c.json({
        success: true,
        message: "Homeroom teacher removed successfully",
      });
    } catch (error) {
      console.error("Remove homeroom teacher error:", error);
      return c.json(
        { success: false, message: "Failed to remove homeroom teacher" },
        500
      );
    }
  }
);

// ============ SUBJECTS ============

// Get all subjects
academicRoute.get("/subjects", async (c) => {
  try {
    const allSubjects = await db.query.subjects.findMany();

    return c.json({
      success: true,
      data: allSubjects,
    });
  } catch (error) {
    console.error("Get subjects error:", error);
    return c.json({ success: false, message: "Failed to get subjects" }, 500);
  }
});

// Get subject by ID
academicRoute.get("/subjects/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, id),
    });

    if (!subject) {
      return c.json({ success: false, message: "Subject not found" }, 404);
    }

    return c.json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error("Get subject error:", error);
    return c.json({ success: false, message: "Failed to get subject" }, 500);
  }
});

// Create subject
academicRoute.post(
  "/subjects",
  requireRole("admin", "staff"),
  zValidator("json", createSubjectSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      // VALIDATE: Check duplicate subject name + grade overlap
      const dupCheck = await checkDuplicateSubject(data.name, data.grades);
      if (dupCheck.isDuplicate) {
        return c.json({ success: false, message: dupCheck.message }, 400);
      }

      const result = await db.insert(subjects).values({
        ...data,
        kkm: String(data.kkm),
      });

      const newSubject = await db.query.subjects.findFirst({
        where: eq(subjects.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Subject created successfully",
        data: newSubject,
      });
    } catch (error) {
      console.error("Create subject error:", error);
      return c.json(
        { success: false, message: "Failed to create subject" },
        500
      );
    }
  }
);

// Update subject
academicRoute.put(
  "/subjects/:id",
  requireRole("admin", "staff"),
  zValidator("json", updateSubjectSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      // VALIDATE: Check duplicate subject name + grade overlap (exclude current id)
      if (data.name) {
        // We need to fetch existing subject first to know its grades if not provided in update?
        // Actually update usually provides full payload or partial.
        // If partial name provided but grades not, we should check against existing grades?
        // Simplification: Ask client to provide both or fetch existing here.
        const existing = await db.query.subjects.findFirst({
          where: eq(subjects.id, id),
        });
        if (!existing)
          return c.json({ success: false, message: "Subject not found" }, 404);

        const gradesToCheck =
          data.grades !== undefined ? data.grades : existing.grades;
        const dupCheck = await checkDuplicateSubject(
          data.name,
          gradesToCheck,
          id
        );
        if (dupCheck.isDuplicate) {
          return c.json({ success: false, message: dupCheck.message }, 400);
        }
      }

      await db
        .update(subjects)
        .set({
          ...data,
          kkm: data.kkm ? String(data.kkm) : undefined,
        })
        .where(eq(subjects.id, id));

      const updated = await db.query.subjects.findFirst({
        where: eq(subjects.id, id),
      });

      return c.json({
        success: true,
        message: "Subject updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update subject error:", error);
      return c.json(
        { success: false, message: "Failed to update subject" },
        500
      );
    }
  }
);

// Delete subject
academicRoute.delete("/subjects/:id", requireRole("admin"), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    await db.delete(subjects).where(eq(subjects.id, id));

    return c.json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Delete subject error:", error);
    return c.json({ success: false, message: "Failed to delete subject" }, 500);
  }
});

// ============ SCHEDULES ============

// Get all schedules
academicRoute.get("/schedules", async (c) => {
  try {
    const allSchedules = await db.query.schedules.findMany();

    return c.json({
      success: true,
      data: allSchedules,
    });
  } catch (error) {
    console.error("Get schedules error:", error);
    return c.json({ success: false, message: "Failed to get schedules" }, 500);
  }
});

// Get schedules by class
academicRoute.get("/schedules/class/:classId", async (c) => {
  try {
    const classId = parseInt(c.req.param("classId"));
    const classSchedules = await db.query.schedules.findMany({
      where: eq(schedules.classId, classId),
    });

    // Group by day
    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const grouped = classSchedules.reduce((acc, schedule) => {
      const dayName = dayNames[schedule.dayOfWeek];
      if (!acc[dayName]) acc[dayName] = [];
      acc[dayName].push(schedule);
      return acc;
    }, {} as Record<string, typeof classSchedules>);

    return c.json({
      success: true,
      data: {
        schedules: classSchedules,
        grouped,
      },
    });
  } catch (error) {
    console.error("Get class schedules error:", error);
    return c.json({ success: false, message: "Failed to get schedules" }, 500);
  }
});

// Get schedules by teacher
academicRoute.get("/schedules/teacher/:teacherId", async (c) => {
  try {
    const teacherId = parseInt(c.req.param("teacherId"));
    const teacherSchedules = await db.query.schedules.findMany({
      where: eq(schedules.teacherId, teacherId),
    });

    // Group by day
    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const grouped = teacherSchedules.reduce((acc, schedule) => {
      const dayName = dayNames[schedule.dayOfWeek];
      if (!acc[dayName]) acc[dayName] = [];
      acc[dayName].push(schedule);
      return acc;
    }, {} as Record<string, typeof teacherSchedules>);

    return c.json({
      success: true,
      data: {
        schedules: teacherSchedules,
        grouped,
      },
    });
  } catch (error) {
    console.error("Get teacher schedules error:", error);
    return c.json({ success: false, message: "Failed to get schedules" }, 500);
  }
});

// Create schedule
academicRoute.post(
  "/schedules",
  requireRole("admin", "staff"),
  zValidator("json", createScheduleSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const result = await db.insert(schedules).values(data);

      const newSchedule = await db.query.schedules.findFirst({
        where: eq(schedules.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Schedule created successfully",
        data: newSchedule,
      });
    } catch (error) {
      console.error("Create schedule error:", error);
      return c.json(
        { success: false, message: "Failed to create schedule" },
        500
      );
    }
  }
);

// Update schedule
academicRoute.put(
  "/schedules/:id",
  requireRole("admin", "staff"),
  zValidator("json", updateScheduleSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      await db
        .update(schedules)
        .set({ ...data })
        .where(eq(schedules.id, id));

      const updated = await db.query.schedules.findFirst({
        where: eq(schedules.id, id),
      });

      return c.json({
        success: true,
        message: "Schedule updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update schedule error:", error);
      return c.json(
        { success: false, message: "Failed to update schedule" },
        500
      );
    }
  }
);

// Delete schedule
academicRoute.delete(
  "/schedules/:id",
  requireRole("admin", "staff"),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));

      await db.delete(schedules).where(eq(schedules.id, id));

      return c.json({
        success: true,
        message: "Schedule deleted successfully",
      });
    } catch (error) {
      console.error("Delete schedule error:", error);
      return c.json(
        { success: false, message: "Failed to delete schedule" },
        500
      );
    }
  }
);

// ============ GRADES ============

// Get grades by student
academicRoute.get("/grades/student/:studentId", async (c) => {
  try {
    const studentId = parseInt(c.req.param("studentId"));
    const academicYear = c.req.query("academicYear");
    const semester = c.req.query("semester");

    let conditions = [eq(grades.studentId, studentId)];
    if (academicYear) conditions.push(eq(grades.academicYear, academicYear));
    if (semester) conditions.push(eq(grades.semester, parseInt(semester)));

    const studentGrades = await db.query.grades.findMany({
      where: conditions.length > 1 ? and(...conditions) : conditions[0],
    });

    return c.json({
      success: true,
      data: studentGrades,
    });
  } catch (error) {
    console.error("Get student grades error:", error);
    return c.json({ success: false, message: "Failed to get grades" }, 500);
  }
});

// Create/Update grade
academicRoute.post(
  "/grades",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", createGradeSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      // Check if grade already exists
      const existing = await db.query.grades.findFirst({
        where: and(
          eq(grades.studentId, data.studentId),
          eq(grades.subjectId, data.subjectId),
          eq(grades.academicYear, data.academicYear),
          eq(grades.semester, data.semester)
        ),
      });

      // Calculate average score
      const scoreFields = [
        data.dailyScore,
        data.homeworkScore,
        data.midtermScore,
        data.finalScore,
        data.practiceScore,
      ].filter((s) => s !== undefined && s !== null) as number[];

      const averageScore =
        scoreFields.length > 0
          ? scoreFields.reduce((a, b) => a + b, 0) / scoreFields.length
          : undefined;

      // Determine letter grade
      let letterGrade: string | undefined;
      let predicate: string | undefined;
      if (averageScore !== undefined) {
        if (averageScore >= 90) {
          letterGrade = "A";
          predicate = "Sangat Baik";
        } else if (averageScore >= 80) {
          letterGrade = "B";
          predicate = "Baik";
        } else if (averageScore >= 70) {
          letterGrade = "C";
          predicate = "Cukup";
        } else if (averageScore >= 60) {
          letterGrade = "D";
          predicate = "Kurang";
        } else {
          letterGrade = "E";
          predicate = "Sangat Kurang";
        }
      }

      if (existing) {
        // Update existing grade
        await db
          .update(grades)
          .set({
            ...data,
            averageScore,
            letterGrade,
            predicate,
          })
          .where(eq(grades.id, existing.id));

        const updated = await db.query.grades.findFirst({
          where: eq(grades.id, existing.id),
        });

        return c.json({
          success: true,
          message: "Grade updated successfully",
          data: updated,
        });
      }

      const {
        dailyScore,
        homeworkScore,
        midtermScore,
        finalScore,
        practiceScore,
        ...restData
      } = data;

      // Convert scores to strings for Decimal
      const scores = {
        dailyScore: dailyScore ? String(dailyScore) : null,
        homeworkScore: homeworkScore ? String(homeworkScore) : null,
        midtermScore: midtermScore ? String(midtermScore) : null,
        finalScore: finalScore ? String(finalScore) : null,
        practiceScore: practiceScore ? String(practiceScore) : null,
      };

      const result = await db.insert(grades).values({
        ...restData,
        ...scores,
        averageScore: averageScore ? String(averageScore) : null,
        letterGrade,
        predicate,
      });

      const newGrade = await db.query.grades.findFirst({
        where: eq(grades.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Grade added successfully",
        data: newGrade,
      });
    } catch (error) {
      console.error("Create grade error:", error);
      return c.json({ success: false, message: "Failed to add grade" }, 500);
    }
  }
);

// Update grade
academicRoute.put(
  "/grades/:id",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", updateGradeSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.grades.findFirst({
        where: eq(grades.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Grade not found" }, 404);
      }

      // Recalculate average
      const updatedData = { ...existing, ...data };
      const scoreFields = [
        updatedData.dailyScore,
        updatedData.homeworkScore,
        updatedData.midtermScore,
        updatedData.finalScore,
        updatedData.practiceScore,
      ].filter((s) => s !== undefined && s !== null) as number[];

      const averageScore =
        scoreFields.length > 0
          ? scoreFields.reduce((a, b) => a + b, 0) / scoreFields.length
          : undefined;

      let letterGrade: string | undefined;
      let predicate: string | undefined;
      let letterGradeAr: string | undefined;

      if (averageScore !== undefined) {
        const subId = existing.subjectId; // Use existing subject ID
        const result = await calculateGrade(averageScore, subId);
        letterGrade = result.letterGrade;
        predicate = result.predicate;
        letterGradeAr = result.letterGradeAr;
      }

      await db
        .update(grades)
        .set({
          ...data,
          averageScore,
          letterGrade,
          predicate,
        })
        .where(eq(grades.id, id));

      const updated = await db.query.grades.findFirst({
        where: eq(grades.id, id),
      });

      return c.json({
        success: true,
        message: "Grade updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update grade error:", error);
      return c.json({ success: false, message: "Failed to update grade" }, 500);
    }
  }
);

// Get grades with filters (for report card)
// Returns all subjects for student's grade level, merged with existing grades
academicRoute.get("/grades", async (c) => {
  try {
    const studentId = c.req.query("studentId");
    const academicYear = c.req.query("academicYear");
    const semester = c.req.query("semester");

    if (!studentId) {
      return c.json({ success: false, message: "studentId is required" }, 400);
    }

    const { students } = await import("../db/schema/students");

    // Get student and their class
    const student = await db.query.students.findFirst({
      where: eq(students.id, Number(studentId)),
    });

    if (!student) {
      return c.json({ success: false, message: "Student not found" }, 404);
    }

    // Get class to find grade level
    let gradeLevel: number | null = null;
    if (student.classId) {
      const studentClass = await db.query.classes.findFirst({
        where: eq(classes.id, student.classId),
      });
      gradeLevel = studentClass?.grade || null;
    }

    // Get all subjects for this grade level
    const allSubjects = await db.query.subjects.findMany({
      orderBy: (subjects, { asc }) => [
        asc(subjects.sortOrder),
        asc(subjects.name),
      ],
    });

    // Filter subjects by grade level
    const subjectsForGrade = allSubjects.filter((sub) => {
      if (!gradeLevel) return true; // If no grade, show all
      if (!sub.grades) return true; // If subject has no grade restriction, include it
      try {
        const subjectGrades = JSON.parse(sub.grades);
        return (
          Array.isArray(subjectGrades) && subjectGrades.includes(gradeLevel)
        );
      } catch {
        return true;
      }
    });

    // Build where conditions for existing grades
    const conditions = [eq(grades.studentId, Number(studentId))];
    if (academicYear) conditions.push(eq(grades.academicYear, academicYear));
    if (semester) conditions.push(eq(grades.semester, Number(semester)));

    const existingGrades = await db.query.grades.findMany({
      where: and(...conditions),
    });

    // Create a map of existing grades by subjectId
    const gradeMap = new Map(existingGrades.map((g) => [g.subjectId, g]));

    // Merge: all subjects with their grades (or null if no grade)
    const mergedData = subjectsForGrade.map((subject) => {
      const grade = gradeMap.get(subject.id);
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectNameAr: subject.nameAr || "",
        kkm: subject.kkm,
        sortOrder: subject.sortOrder,
        // Grade data (null if not exists)
        id: grade?.id || null,
        averageScore: grade?.averageScore || null,
        letterGrade: grade?.letterGrade || null,
        letterGradeAr: grade?.letterGradeAr || null,
        predicate: grade?.predicate || null,
        dailyScore: grade?.dailyScore || null,
        homeworkScore: grade?.homeworkScore || null,
        midtermScore: grade?.midtermScore || null,
        finalScore: grade?.finalScore || null,
        practiceScore: grade?.practiceScore || null,
        notes: grade?.notes || null,
        subject,
      };
    });

    return c.json({ success: true, data: mergedData });
  } catch (error) {
    console.error("Get grades error:", error);
    return c.json({ success: false, message: "Failed to get grades" }, 500);
  }
});

// Get grades list for bulk input
academicRoute.get(
  "/grades/list",
  requireRole("admin", "teacher", "staff"),
  async (c) => {
    try {
      const classId = c.req.query("classId");
      const subjectId = c.req.query("subjectId");
      const academicYear = c.req.query("academicYear");
      const semester = c.req.query("semester");

      if (!classId || !subjectId || !academicYear || !semester) {
        return c.json(
          { success: false, message: "Missing required params" },
          400
        );
      }

      const { students } = await import("../db/schema/students");

      // 1. Get all students in class
      const classStudents = await db.query.students.findMany({
        where: eq(students.classId, Number(classId)),
        orderBy: (students, { asc }) => [asc(students.fullName)],
      });

      // 2. Get existing grades
      const existingGrades = await db.query.grades.findMany({
        where: and(
          eq(grades.classId, Number(classId)),
          eq(grades.subjectId, Number(subjectId)),
          eq(grades.academicYear, academicYear),
          eq(grades.semester, Number(semester))
        ),
      });

      // 3. Merge data
      const data = classStudents.map((student) => {
        const grade = existingGrades.find((g) => g.studentId === student.id);
        return {
          student: {
            id: student.id,
            nis: student.nis,
            name: student.fullName,
          },
          grade: grade || null,
        };
      });

      return c.json({ success: true, data });
    } catch (error) {
      console.error("Get grades list error:", error);
      return c.json(
        { success: false, message: "Failed to get grades list" },
        500
      );
    }
  }
);

// Bulk save grades
academicRoute.post(
  "/grades/bulk",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", bulkGradeSchema),
  async (c) => {
    try {
      const items = c.req.valid("json");
      const results = { updated: 0, inserted: 0 };

      await db.transaction(async (tx) => {
        for (const item of items) {
          // Determine grade stats
          const scoreFields = [
            item.dailyScore,
            item.homeworkScore,
            item.midtermScore,
            item.finalScore,
            item.practiceScore,
          ].filter((s) => s !== undefined && s !== null) as number[];

          const averageScore =
            scoreFields.length > 0
              ? scoreFields.reduce((a, b) => a + b, 0) / scoreFields.length
              : undefined;

          let letterGrade: string | undefined;
          let predicate: string | undefined;
          let letterGradeAr: string | undefined;

          if (averageScore !== undefined) {
            // Bulk Import Context doesn't always have explicit subjectId per item if it's mixed?
            // Usually bulk is per class/subject.
            // Check usage of bulkGradeSchema. The input `items` usually has subjectId.
            // Wait, bulkGradeSchema usually sends subjectId.
            // Let's assume item.subjectId exists.

            const result = await calculateGrade(averageScore, item.subjectId);
            letterGrade = result.letterGrade;
            predicate = result.predicate;
            letterGradeAr = result.letterGradeAr;
          }

          // Upsert Logic
          const existing = await tx.query.grades.findFirst({
            where: and(
              eq(grades.studentId, item.studentId),
              eq(grades.subjectId, item.subjectId),
              eq(grades.academicYear, item.academicYear),
              eq(grades.semester, item.semester)
            ),
          });

          // Destructure item to remove numeric scores
          const {
            dailyScore,
            homeworkScore,
            midtermScore,
            finalScore,
            practiceScore,
            ...restItem
          } = item;

          // Prepare score values
          const scores = {
            dailyScore: dailyScore ? String(dailyScore) : null,
            homeworkScore: homeworkScore ? String(homeworkScore) : null,
            midtermScore: midtermScore ? String(midtermScore) : null,
            finalScore: finalScore ? String(finalScore) : null,
            practiceScore: practiceScore ? String(practiceScore) : null,
          };

          if (existing) {
            await tx
              .update(grades)
              .set({
                ...restItem,
                studentId: restItem.studentId,
                subjectId: restItem.subjectId,
                academicYear: restItem.academicYear,
                semester: restItem.semester,
                notes: restItem.notes,
                ...scores,
                averageScore: averageScore ? String(averageScore) : null,
                letterGrade,
                letterGradeAr,
                predicate,
              })
              .where(eq(grades.id, existing.id));
            results.updated++;
          } else {
            // Only insert if at least one score is provided
            if (scoreFields.length > 0) {
              const { students } = await import("../db/schema/students");
              const student = await tx.query.students.findFirst({
                where: eq(students.id, item.studentId),
              });
              await tx.insert(grades).values({
                studentId: restItem.studentId,
                subjectId: restItem.subjectId,
                academicYear: restItem.academicYear,
                semester: restItem.semester,
                notes: restItem.notes,
                ...scores,
                classId: student?.classId,
                averageScore: averageScore ? String(averageScore) : null,
                letterGrade,
                letterGradeAr,
                predicate,
              });
              results.inserted++;
            }
          }
        }
      });

      return c.json({
        success: true,
        message: "Berhasil menyimpan nilai",
        results,
      });
    } catch (error) {
      console.error("Bulk save grades error:", error);
      return c.json({ success: false, message: "Gagal menyimpan nilai" }, 500);
    }
  }
);

// ============ REPORTS ============

// Get reports by student
academicRoute.get("/reports/student/:studentId", async (c) => {
  try {
    const studentId = parseInt(c.req.param("studentId"));
    const studentReports = await db.query.reports.findMany({
      where: eq(reports.studentId, studentId),
    });

    return c.json({
      success: true,
      data: studentReports,
    });
  } catch (error) {
    console.error("Get student reports error:", error);
    return c.json({ success: false, message: "Failed to get reports" }, 500);
  }
});

// Get report by ID
academicRoute.get("/reports/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const report = await db.query.reports.findFirst({
      where: eq(reports.id, id),
    });

    if (!report) {
      return c.json({ success: false, message: "Report not found" }, 404);
    }

    return c.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Get report error:", error);
    return c.json({ success: false, message: "Failed to get report" }, 500);
  }
});

// Generate report
academicRoute.post(
  "/reports/generate",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", generateReportSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      // Get student grades for this semester
      const studentGrades = await db.query.grades.findMany({
        where: and(
          eq(grades.studentId, data.studentId),
          eq(grades.academicYear, data.academicYear),
          eq(grades.semester, data.semester)
        ),
      });

      // Calculate totals
      const totalScore = studentGrades.reduce(
        (sum, g) => sum + (g.averageScore || 0),
        0
      );
      const averageScore =
        studentGrades.length > 0 ? totalScore / studentGrades.length : 0;

      // Check if report already exists
      const existing = await db.query.reports.findFirst({
        where: and(
          eq(reports.studentId, data.studentId),
          eq(reports.academicYear, data.academicYear),
          eq(reports.semester, data.semester)
        ),
      });

      if (existing) {
        // Update existing report
        await db
          .update(reports)
          .set({
            totalScore,
            averageScore,
            behaviorNotes: data.behaviorNotes,
            teacherNotes: data.teacherNotes,
            principalNotes: data.principalNotes,
            generatedAt: new Date(),
          })
          .where(eq(reports.id, existing.id));

        const updated = await db.query.reports.findFirst({
          where: eq(reports.id, existing.id),
        });

        return c.json({
          success: true,
          message: "Report updated successfully",
          data: updated,
        });
      }

      const result = await db.insert(reports).values({
        studentId: data.studentId,
        academicYear: data.academicYear,
        semester: data.semester,
        totalScore,
        averageScore,
        behaviorNotes: data.behaviorNotes,
        teacherNotes: data.teacherNotes,
        principalNotes: data.principalNotes,
        status: "draft",
      });

      const newReport = await db.query.reports.findFirst({
        where: eq(reports.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Report generated successfully",
        data: newReport,
      });
    } catch (error) {
      console.error("Generate report error:", error);
      return c.json(
        { success: false, message: "Failed to generate report" },
        500
      );
    }
  }
);

// Update report
academicRoute.put(
  "/reports/:id",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", updateReportSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.reports.findFirst({
        where: eq(reports.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Report not found" }, 404);
      }

      const updateData: any = { ...data };
      if (data.status === "published") {
        updateData.publishedAt = new Date();
      }

      await db.update(reports).set(updateData).where(eq(reports.id, id));

      const updated = await db.query.reports.findFirst({
        where: eq(reports.id, id),
      });

      return c.json({
        success: true,
        message: "Report updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update report error:", error);
      return c.json(
        { success: false, message: "Failed to update report" },
        500
      );
    }
  }
);

// Helper to get setting
async function getSetting(key: string): Promise<string | null> {
  const { settings } = await import("../db/schema/settings");
  const result = await db.query.settings.findFirst({
    where: eq(settings.key, key),
  });
  return result?.value || null;
}

// Helper to get Arabic Grade
const getArabicGrade = (letter: string) => {
  const map: Record<string, string> = {
    A: "أ",
    B: "ب",
    C: "ج",
    D: "د",
    E: "هـ",
    "A+": "أ+",
    "B+": "ب+",
    "C+": "ج+", // Just in case
    "D+": "د+",
  };
  return map[letter] || "هـ";
};

// Helper: Calculate Grade based on Rules
async function calculateGrade(
  score: number,
  subjectId: number
): Promise<{ letterGrade: string; predicate: string; letterGradeAr: string }> {
  const rulesJson = await getSetting("grading_rules");

  // Default Fallback
  let letterGrade = "E";
  let predicate = "Sangat Kurang";
  let letterGradeAr = "هـ";

  if (!rulesJson) {
    if (score >= 90) {
      letterGrade = "A";
      predicate = "Sangat Baik";
      letterGradeAr = "أ";
    } else if (score >= 80) {
      letterGrade = "B";
      predicate = "Baik";
      letterGradeAr = "ب";
    } else if (score >= 70) {
      letterGrade = "C";
      predicate = "Cukup";
      letterGradeAr = "ج";
    } else if (score >= 60) {
      letterGrade = "D";
      predicate = "Kurang";
      letterGradeAr = "د";
    }
    return { letterGrade, predicate, letterGradeAr };
  }

  const parsed = JSON.parse(rulesJson);
  let activeRules: any[] = [];

  // Determine which rules to use
  if (Array.isArray(parsed)) {
    // Legacy Format (Specific Rules only, assume implicitly)
    // Actually legacy might just be an array of rules??
    // Let's assume parsed is [ { kkm: 75, rules: [...] }, ... ] OR just rules??
    // Based on academic-settings.ts, legacy was likely just SpecificRules array or maybe just unsupported.
    // The previous frontend implementation implies it supports `school_grading_settings` vs `grading_rules`
    // Let's check the structure returned by `grading-rules` endpoint in `academic-settings.ts`
    // It returns { mode, globalRules, specificRules }
    // If invalid/missing, it returns default global rules.
    activeRules = []; // Logic below handles this
  }

  // Handle New Structure
  const setting = Array.isArray(parsed)
    ? { mode: "SPECIFIC", globalRules: [], specificRules: parsed }
    : parsed;

  let rulesToApply: any[] = [];

  if (setting.mode === "GLOBAL") {
    rulesToApply = setting.globalRules;
  } else {
    // SPECIFIC Mode: Need Subject KKM
    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, subjectId),
    });

    // KKM from subject or default 75
    // Make sure we parse KKM correctly (it's decimal string)
    const kkm = subject?.kkm ? parseFloat(String(subject.kkm)) : 75;

    const specific = setting.specificRules?.find((r: any) => r.kkm === kkm);

    if (specific) {
      rulesToApply = specific.rules;
    } else {
      // Fallback if no specific rule for this KKM found?
      // Maybe fall back to a default set or closest KKM?
      // Frontend typically handles this by showing "No Rules".
      // Here we might fallback to Global or Hardcoded.
      rulesToApply = setting.globalRules;
    }
  }

  // Find matching rule
  const match = rulesToApply.find((r: any) => score >= r.min && score <= r.max);
  if (match) {
    letterGrade = match.predicate; // e.g. "A" or "A+"
    predicate = match.descriptionId; // e.g. "Sangat Baik"
    letterGradeAr = match.predicateAr || getArabicGrade(match.predicate);
  }

  return { letterGrade, predicate, letterGradeAr };
}

// ============ IMPORT SUBJECTS ============

// ============ IMPORT GRADES ============

// Preview import grades from Excel
academicRoute.post(
  "/grades/import/preview",
  requireRole("admin", "teacher", "staff"),
  async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return c.json({ success: false, message: "No file uploaded" }, 400);
      }

      // Check file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (
        !allowedTypes.includes(file.type) &&
        !file.name.endsWith(".xlsx") &&
        !file.name.endsWith(".xls")
      ) {
        return c.json(
          {
            success: false,
            message:
              "Invalid file type. Please upload an Excel file (.xlsx or .xls)",
          },
          400
        );
      }

      // Parse Excel file
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (!data || data.length === 0) {
        return c.json(
          {
            success: false,
            message: "Excel file is empty or has no data rows",
          },
          400
        );
      }

      // Column Map
      const columnMapping: { [key: string]: string } = {
        NIS: "nis",
        "Nama Lengkap": "name", // Optional verification
        "Nama Santri": "name",
        "Nilai Harian": "dailyScore",
        Daily: "dailyScore",
        Harian: "dailyScore",
        "Nilai Tugas": "homeworkScore",
        Task: "homeworkScore",
        Tugas: "homeworkScore",
        "Nilai UTS": "midtermScore",
        UTS: "midtermScore",
        Midterm: "midtermScore",
        "Nilai UAS": "finalScore",
        UAS: "finalScore",
        Final: "finalScore",
        "Nilai Praktek": "practiceScore",
        Practice: "practiceScore",
        Praktek: "practiceScore",
        Lainnya: "otherScore", // Optional
      };

      const preview = {
        totalRows: data.length,
        validRows: 0,
        invalidRows: 0,
        errors: [] as { row: number; nis: string; error: string }[],
        validData: [] as any[],
      };

      // Import Students Schema for verification
      const { students } = await import("../db/schema/students");

      // Bulk fetch students for performance? For pre-optim we can check individually or fetch all in class?
      // Ideally we should filter by class provided in Context if possible, but Excel usually contains multiple rows.
      // Let's rely on NIS lookup.
      const allStudents = await db.query.students.findMany(); // Could be large? Maybe optimize later.
      const studentMap = new Map(allStudents.map((s) => [s.nis, s]));

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
          const rawData: any = {};
          // Normalize Keys
          for (const [key, field] of Object.entries(columnMapping)) {
            // Case insensitive match
            const foundKey = Object.keys(row).find(
              (k) => k.toLowerCase() === key.toLowerCase()
            );
            if (foundKey) {
              rawData[field] = row[foundKey];
            }
          }

          // Must have NIS
          if (!rawData.nis) {
            throw new Error("NIS wajib diisi");
          }

          // Verify Student
          const student = studentMap.get(String(rawData.nis));
          if (!student) {
            throw new Error(`Santri dengan NIS ${rawData.nis} tidak ditemukan`);
          }

          // Validate Scores (0-100)
          const scores = [
            "dailyScore",
            "homeworkScore",
            "midtermScore",
            "finalScore",
            "practiceScore",
          ];
          for (const s of scores) {
            if (
              rawData[s] !== undefined &&
              rawData[s] !== null &&
              rawData[s] !== ""
            ) {
              const val = Number(rawData[s]);
              if (isNaN(val) || val < 0 || val > 100) {
                throw new Error(`Nilai ${s} tidak valid (0-100)`);
              }
              rawData[s] = val;
            } else {
              delete rawData[s]; // Remove empty
            }
          }

          preview.validRows++;
          preview.validData.push({
            row: rowNumber,
            studentId: student.id,
            studentName: student.fullName,
            ...rawData,
          });
        } catch (err: any) {
          preview.invalidRows++;
          preview.errors.push({
            row: rowNumber,
            nis: row.NIS || row.nis || "-",
            error: err.message,
          });
        }
      }

      return c.json({ success: true, data: preview });
    } catch (error: any) {
      console.error("Preview grade import error:", error);
      return c.json({ success: false, message: error.message }, 500);
    }
  }
);

// Import grades from Excel
academicRoute.post(
  "/grades/import",
  requireRole("admin", "teacher", "staff"),
  async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file") as File;

      // Extract Context
      // Although we can't reliably get these from simple FormData without appending them,
      // let's assume the frontend Appends them to formData as well!
      // Or we infer from the request parameters?
      // Since ImportModal uses a generic wrapper, we need to ensure our frontend wrapper appends these fields.
      const classId = formData.get("classId");
      const subjectId = formData.get("subjectId");
      const academicYear = formData.get("academicYear");
      const semester = formData.get("semester");

      if (!file) return c.json({ success: false, message: "No file" }, 400);
      if (!classId || !subjectId || !academicYear || !semester) {
        return c.json(
          {
            success: false,
            message: "Missing context (class/subject/year/semester)",
          },
          400
        );
      }

      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(
        workbook.Sheets[sheetName]
      ) as any[];

      const results = { success: 0, failed: 0, errors: [] as any[] };

      // Helper for grade calc
      const { students } = await import("../db/schema/students");
      // Fetch students in this class for validation scope, preventing cross-class entry by mistake?
      // Or just global lookup. Let's do class lookup to be safe.
      const classStudents = await db.query.students.findMany({
        where: eq(students.classId, Number(classId)),
      });
      const studentMap = new Map(classStudents.map((s) => [s.nis, s]));
      // Also map by ID just in case needed
      const studentIdMap = new Map(classStudents.map((s) => [s.id, s]));

      const columnMapping: { [key: string]: string } = {
        NIS: "nis",
        "Nilai Harian": "dailyScore",
        Daily: "dailyScore",
        Harian: "dailyScore",
        "Nilai Tugas": "homeworkScore",
        Task: "homeworkScore",
        Tugas: "homeworkScore",
        "Nilai UTS": "midtermScore",
        UTS: "midtermScore",
        Midterm: "midtermScore",
        "Nilai UAS": "finalScore",
        UAS: "finalScore",
        Final: "finalScore",
        "Nilai Praktek": "practiceScore",
        Practice: "practiceScore",
        Praktek: "practiceScore",
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
          const rawData: any = {};
          for (const [key, field] of Object.entries(columnMapping)) {
            const foundKey = Object.keys(row).find(
              (k) => k.toLowerCase() === key.toLowerCase()
            );
            if (foundKey) rawData[field] = row[foundKey];
          }

          if (!rawData.nis) throw new Error("NIS missing");
          const student = studentMap.get(String(rawData.nis));
          if (!student)
            throw new Error(
              `Student with NIS ${rawData.nis} not found in this class`
            );

          // Calculate Meta
          const scores = [];
          if (rawData.dailyScore) scores.push(Number(rawData.dailyScore));
          if (rawData.homeworkScore) scores.push(Number(rawData.homeworkScore));
          if (rawData.midtermScore) scores.push(Number(rawData.midtermScore));
          if (rawData.finalScore) scores.push(Number(rawData.finalScore));
          if (rawData.practiceScore) scores.push(Number(rawData.practiceScore));

          const averageScore =
            scores.length > 0
              ? scores.reduce((a, b) => a + b, 0) / scores.length
              : undefined;

          let letterGrade: string | undefined;
          let predicate: string | undefined;
          let letterGradeAr: string | undefined;

          if (averageScore !== undefined) {
            const result = await calculateGrade(
              averageScore,
              Number(subjectId)
            );
            letterGrade = result.letterGrade;
            predicate = result.predicate;
            letterGradeAr = result.letterGradeAr;
          }

          // Check Existing
          const existing = await db.query.grades.findFirst({
            where: and(
              eq(grades.studentId, student.id),
              eq(grades.subjectId, Number(subjectId)),
              eq(grades.academicYear, String(academicYear)),
              eq(grades.semester, Number(semester))
            ),
          });

          const updatePayload = {
            dailyScore: rawData.dailyScore ? String(rawData.dailyScore) : null,
            homeworkScore: rawData.homeworkScore
              ? String(rawData.homeworkScore)
              : null,
            midtermScore: rawData.midtermScore
              ? String(rawData.midtermScore)
              : null,
            finalScore: rawData.finalScore ? String(rawData.finalScore) : null,
            practiceScore: rawData.practiceScore
              ? String(rawData.practiceScore)
              : null,
            averageScore: averageScore ? String(averageScore) : null,
            letterGrade,
            letterGradeAr,
            predicate,
          };

          if (existing) {
            await db
              .update(grades)
              .set(updatePayload)
              .where(eq(grades.id, existing.id));
          } else {
            // Only insert if valid scores exist
            if (scores.length > 0) {
              await db.insert(grades).values({
                studentId: student.id,
                classId: Number(classId),
                subjectId: Number(subjectId),
                academicYear: String(academicYear),
                semester: Number(semester),
                ...updatePayload,
              });
            }
          }
          results.success++;
        } catch (e: any) {
          results.failed++;
          results.errors.push({ row: rowNumber, error: e.message });
        }
      }

      return c.json({ success: true, data: results });
    } catch (error: any) {
      console.error("Import grades error:", error);
      return c.json({ success: false, message: error.message }, 500);
    }
  }
);

// Preview import subjects from Excel
academicRoute.post(
  "/subjects/import/preview",
  requireRole("admin", "staff"),
  async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return c.json({ success: false, message: "No file uploaded" }, 400);
      }

      // Check file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (
        !allowedTypes.includes(file.type) &&
        !file.name.endsWith(".xlsx") &&
        !file.name.endsWith(".xls")
      ) {
        return c.json(
          {
            success: false,
            message:
              "Invalid file type. Please upload an Excel file (.xlsx or .xls)",
          },
          400
        );
      }

      // Parse Excel file
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (!data || data.length === 0) {
        return c.json(
          {
            success: false,
            message: "Excel file is empty or has no data rows",
          },
          400
        );
      }

      // Column Mapping
      const columnMapping: { [key: string]: string } = {
        Kode: "code",
        Code: "code",
        "Mata Pelajaran": "name",
        Mapel: "name",
        Nama: "name",
        "Nama Arab": "nameAr",
        "Name Ar": "nameAr",
        Kategori: "category",
        Category: "category",
        KKM: "kkm",
        Kelas: "grades", // String e.g. "1,2,3" or "All"
        Grades: "grades",
        SKS: "creditHours",
        "Credit Hours": "creditHours",
        Urutan: "sortOrder",
        Sort: "sortOrder",
      };

      const preview = {
        totalRows: data.length,
        validRows: 0,
        invalidRows: 0,
        duplicateCode: 0, // Stats for duplicate entries
        duplicateName: 0, // Stats for overlapping name
        errors: [] as { row: number; code: string; error: string }[],
        validData: [] as any[],
      };

      // Internal cache to check duplicates within the Excel file itself
      // Map: Name -> Array of { row, grades: number[] }
      const internalCache = new Map<
        string,
        { row: number; grades: number[] }[]
      >();

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
          const subjectData: any = {};
          for (const [excelCol, dbField] of Object.entries(columnMapping)) {
            if (
              row[excelCol] !== undefined &&
              row[excelCol] !== null &&
              row[excelCol] !== ""
            ) {
              subjectData[dbField] = row[excelCol];
            }
          }

          // Validation
          if (!subjectData.name) {
            throw new Error("Nama mata pelajaran wajib diisi");
          }

          // Parse Grades: "1,2,3" -> JSON string "[1,2,3]"
          let parsedGrades: number[] = [];
          if (subjectData.grades) {
            const gStr = String(subjectData.grades);
            const gArr = gStr
              .split(",")
              .map((s) => Number(s.trim()))
              .filter((n) => !isNaN(n));
            parsedGrades = gArr;
            if (gArr.length > 0) {
              subjectData.grades = JSON.stringify(gArr);
            } else {
              if (!isNaN(Number(subjectData.grades))) {
                const val = Number(subjectData.grades);
                parsedGrades = [val];
                subjectData.grades = JSON.stringify([val]);
              } else {
                subjectData.grades = "[]";
              }
            }
          } else {
            subjectData.grades = "[]"; // Default to empty array if no grades specified
          }

          // Check Duplicates by Code
          if (subjectData.code) {
            const existing = await db.query.subjects.findFirst({
              where: eq(subjects.code, String(subjectData.code)),
            });
            if (existing) {
              preview.duplicateCode++;
              throw new Error(`Kode mapel '${subjectData.code}' sudah ada`);
            }
          }

          // CHECK DUPLICATE BY NAME & GRADE OVERLAP (DB)
          const dupDB = await checkDuplicateSubject(
            subjectData.name,
            subjectData.grades
          );
          if (dupDB.isDuplicate) {
            preview.duplicateName++;
            throw new Error(dupDB.message!);
          }

          // CHECK DUPLICATE WITHIN FILE
          if (internalCache.has(subjectData.name)) {
            const cachedEntries = internalCache.get(subjectData.name)!;
            for (const entry of cachedEntries) {
              // Overlap logic
              const g1 = entry.grades;
              const g2 = parsedGrades;
              const isOverlap =
                g1.length === 0 ||
                g2.length === 0 ||
                g1.some((x) => g2.includes(x));
              if (isOverlap) {
                preview.duplicateName++;
                throw new Error(
                  `Duplikat dengan baris ${entry.row} (Nama & Kelas bertabrakan)`
                );
              }
            }
            cachedEntries.push({ row: rowNumber, grades: parsedGrades });
          } else {
            internalCache.set(subjectData.name, [
              { row: rowNumber, grades: parsedGrades },
            ]);
          }

          preview.validRows++;
          preview.validData.push({
            row: rowNumber,
            ...subjectData,
          });
        } catch (err: any) {
          preview.invalidRows++;
          preview.errors.push({
            row: rowNumber,
            code: row.Kode || row.Code || "-",
            error: err.message || "Unknown error",
          });
        }
      }

      return c.json({
        success: true,
        data: preview,
      });
    } catch (error: any) {
      console.error("Preview import error:", error);
      return c.json({ success: false, message: error?.message }, 500);
    }
  }
);

// Import subjects from Excel
academicRoute.post(
  "/subjects/import",
  requireRole("admin", "staff"),
  async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file") as File;

      if (!file) return c.json({ success: false, message: "No file" }, 400);

      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(
        workbook.Sheets[sheetName]
      ) as any[];

      const columnMapping: { [key: string]: string } = {
        Kode: "code",
        Code: "code",
        "Mata Pelajaran": "name",
        Mapel: "name",
        Nama: "name",
        "Nama Arab": "nameAr",
        "Name Ar": "nameAr",
        Kategori: "category",
        Category: "category",
        KKM: "kkm",
        Kelas: "grades",
        Grades: "grades",
        SKS: "creditHours",
        "Credit Hours": "creditHours",
        Urutan: "sortOrder",
        Sort: "sortOrder",
      };

      const results = { success: 0, failed: 0, errors: [] as any[] };
      const internalCache = new Map<
        string,
        { row: number; grades: number[] }[]
      >();

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
          const rawData: any = {};
          for (const [k, v] of Object.entries(columnMapping)) {
            if (row[k] !== undefined) rawData[v] = row[k];
          }

          if (!rawData.name) throw new Error("Nama wajib diisi");

          // Process Grades
          let parsedGrades: number[] = [];
          if (rawData.grades) {
            const gStr = String(rawData.grades);
            const gArr = gStr
              .split(",")
              .map((s) => Number(s.trim()))
              .filter((n) => !isNaN(n));
            parsedGrades = gArr;
            if (gArr.length > 0) {
              rawData.grades = JSON.stringify(gArr);
            } else if (!isNaN(Number(rawData.grades))) {
              parsedGrades = [Number(rawData.grades)];
              rawData.grades = JSON.stringify([Number(rawData.grades)]);
            } else {
              rawData.grades = "[]";
            }
          } else {
            rawData.grades = "[]";
          }

          // Check Duplicate Code
          if (rawData.code) {
            const existing = await db.query.subjects.findFirst({
              where: eq(subjects.code, String(rawData.code)),
            });
            if (existing)
              throw new Error(`Kode mapel '${rawData.code}' sudah ada`);
          } else {
            // Generate Code if missing
            const prefix = rawData.name
              .substring(0, 3)
              .toUpperCase()
              .replace(/[^A-Z]/g, "X");
            const random = Math.floor(1000 + Math.random() * 9000);
            rawData.code = `${prefix}-${random}`;
          }

          // CHECK DUPLICATE BY NAME & GRADE OVERLAP (DB)
          const dupDB = await checkDuplicateSubject(
            rawData.name,
            rawData.grades
          );
          if (dupDB.isDuplicate) {
            throw new Error(dupDB.message!);
          }

          // CHECK DUPLICATE WITHIN FILE
          if (internalCache.has(rawData.name)) {
            const cachedEntries = internalCache.get(rawData.name)!;
            for (const entry of cachedEntries) {
              // Overlap logic
              const g1 = entry.grades;
              const g2 = parsedGrades;
              const isOverlap =
                g1.length === 0 ||
                g2.length === 0 ||
                g1.some((x) => g2.includes(x));
              if (isOverlap) {
                throw new Error(
                  `Duplikat dengan baris ${entry.row} (Nama & Kelas bertabrakan)`
                );
              }
            }
            cachedEntries.push({ row: rowNumber, grades: parsedGrades });
          } else {
            internalCache.set(rawData.name, [
              { row: rowNumber, grades: parsedGrades },
            ]);
          }

          await db.insert(subjects).values({
            code: String(rawData.code),
            name: rawData.name,
            nameAr: rawData.nameAr || null,
            category: rawData.category || null,
            grades: rawData.grades || null,
            kkm: rawData.kkm ? String(rawData.kkm) : "70.00",
            sortOrder: rawData.sortOrder ? Number(rawData.sortOrder) : 0,
            creditHours: rawData.creditHours ? Number(rawData.creditHours) : 2,
          });

          results.success++;
        } catch (e: any) {
          results.failed++;
          results.errors.push({ row: rowNumber, error: e.message });
        }
      }

      return c.json({ success: true, data: results });
    } catch (error: any) {
      console.error("Import error:", error);
      return c.json({ success: false, message: error.message }, 500);
    }
  }
);

export default academicRoute;
