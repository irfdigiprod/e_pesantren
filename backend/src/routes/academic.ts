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
} from "../validators/academic";

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
    const classStudents = await db.query.students.findMany({
      where: eq(students.classId, id),
    });

    return c.json({
      success: true,
      data: {
        ...classData,
        students: classStudents,
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

      const result = await db.insert(subjects).values(data);

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

      await db
        .update(subjects)
        .set({ ...data })
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

      const result = await db.insert(grades).values({
        ...data,
        averageScore,
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

export default academicRoute;
