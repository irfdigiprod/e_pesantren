import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { students, parents } from "../db/schema/students";
import { studentParents } from "../db/schema/student-parents";
import { users } from "../db/schema/users";
import { authMiddleware, requireRole } from "../middleware/auth";
import { hashPassword } from "../utils/password";
import {
  createStudentSchema,
  updateStudentSchema,
} from "../validators/students";

const studentsRoute = new Hono();

// Apply auth to all routes
studentsRoute.use("*", authMiddleware);

// ============ STUDENTS ============

// Get all students (with search, filter, and pagination)
studentsRoute.get("/", async (c) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const fullName = query.fullName || "";
    const gender = query.gender || "";
    const status = query.status || "";

    // Build where conditions
    const conditions: any[] = [];

    if (fullName) {
      conditions.push(sql`${students.fullName} LIKE ${`%${fullName}%`}`);
    }
    if (gender) {
      conditions.push(eq(students.gender, gender as "male" | "female"));
    }
    if (status) {
      conditions.push(
        eq(
          students.status,
          status as "active" | "graduated" | "transferred" | "dropped"
        )
      );
    }

    // Get total count first
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(students)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);
    const offset = (page - 1) * limit;

    // Get paginated students
    let allStudents;
    if (conditions.length > 0) {
      allStudents = await db.query.students.findMany({
        where: and(...conditions),
        limit: limit,
        offset: offset,
        orderBy: (students, { asc }) => [asc(students.id)],
      });
    } else {
      allStudents = await db.query.students.findMany({
        limit: limit,
        offset: offset,
        orderBy: (students, { asc }) => [asc(students.id)],
      });
    }

    // Enrich students with halaqah, room, and class info
    const { halaqahMembers, halaqahGroups } = await import(
      "../db/schema/halaqah"
    );
    const { rooms } = await import("../db/schema/rooms");
    const { classes } = await import("../db/schema/academic");

    const enrichedStudents = await Promise.all(
      allStudents.map(async (student) => {
        // Get halaqah membership
        const halaqahMember = await db.query.halaqahMembers.findFirst({
          where: eq(halaqahMembers.studentId, student.id),
        });
        let halaqah = null;
        if (halaqahMember) {
          halaqah = await db.query.halaqahGroups.findFirst({
            where: eq(halaqahGroups.id, halaqahMember.halaqahId),
          });
        }

        // Get room info
        let room = null;
        if (student.roomId) {
          room = await db.query.rooms.findFirst({
            where: eq(rooms.id, student.roomId),
          });
        }

        // Get class info
        let classInfo = null;
        if (student.classId) {
          classInfo = await db.query.classes.findFirst({
            where: eq(classes.id, student.classId),
          });
        }

        return {
          ...student,
          halaqah: halaqah ? { id: halaqah.id, name: halaqah.name } : null,
          room: room ? { id: room.id, name: room.name } : null,
          class: classInfo ? { id: classInfo.id, name: classInfo.name } : null,
        };
      })
    );

    return c.json({
      success: true,
      data: enrichedStudents,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    return c.json({ success: false, message: "Failed to get students" }, 500);
  }
});

// Preview import students from Excel (validation only, no database insert)
studentsRoute.post(
  "/import/preview",
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

      // Map Excel columns to database fields
      const columnMapping: { [key: string]: string } = {
        NIS: "nis",
        "Nama Lengkap": "fullName",
        Nama: "fullName",
        "Jenis Kelamin": "gender",
        Gender: "gender",
        "Tanggal Lahir": "birthDate",
        "Tempat Lahir": "birthPlace",
        Alamat: "address",
        Telepon: "phone",
        Phone: "phone",
        Status: "status",
      };

      // Parent column mappings
      const parentColumnMapping: { [key: string]: string } = {
        "Nama Ayah": "fatherName",
        "Nama Ibu": "motherName",
        "Pekerjaan Ayah": "fatherOccupation",
        "Pekerjaan Ibu": "motherOccupation",
        "Telepon Orang Tua": "parentPhone",
        "Alamat Orang Tua": "parentAddress",
        "Email Orang Tua": "parentEmail",
        "Password Orang Tua": "parentPassword",
      };

      const genderMapping: { [key: string]: string } = {
        "Laki-laki": "male",
        L: "male",
        Male: "male",
        Perempuan: "female",
        P: "female",
        Female: "female",
      };

      const statusMapping: { [key: string]: string } = {
        Aktif: "active",
        Active: "active",
        Lulus: "graduated",
        Graduated: "graduated",
        Pindah: "transferred",
        Transferred: "transferred",
        Keluar: "dropped",
        Dropped: "dropped",
      };

      const preview = {
        totalRows: data.length,
        validRows: 0,
        invalidRows: 0,
        duplicateNIS: 0,
        newParents: 0,
        existingParents: 0,
        errors: [] as { row: number; nis: string; error: string }[],
        validData: [] as any[],
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
          // Map row data to student object
          const studentData: any = {};
          for (const [excelCol, dbField] of Object.entries(columnMapping)) {
            if (
              row[excelCol] !== undefined &&
              row[excelCol] !== null &&
              row[excelCol] !== ""
            ) {
              studentData[dbField] = row[excelCol];
            }
          }

          // Map row data to parent object
          const parentData: any = {};
          for (const [excelCol, dbField] of Object.entries(
            parentColumnMapping
          )) {
            if (
              row[excelCol] !== undefined &&
              row[excelCol] !== null &&
              row[excelCol] !== ""
            ) {
              parentData[dbField] = row[excelCol];
            }
          }

          // Validate required fields
          if (!studentData.nis) {
            preview.invalidRows++;
            preview.errors.push({
              row: rowNumber,
              nis: "-",
              error: "NIS wajib diisi",
            });
            continue;
          }
          if (!studentData.fullName) {
            preview.invalidRows++;
            preview.errors.push({
              row: rowNumber,
              nis: studentData.nis,
              error: "Nama wajib diisi",
            });
            continue;
          }

          // Convert gender
          if (studentData.gender) {
            studentData.gender =
              genderMapping[studentData.gender] ||
              studentData.gender.toLowerCase();
          } else {
            studentData.gender = "male";
          }

          // Convert status
          if (studentData.status) {
            studentData.status = statusMapping[studentData.status] || "active";
          } else {
            studentData.status = "active";
          }

          // Check if NIS already exists in database
          const existing = await db.query.students.findFirst({
            where: eq(students.nis, String(studentData.nis)),
          });

          if (existing) {
            preview.invalidRows++;
            preview.duplicateNIS++;
            preview.errors.push({
              row: rowNumber,
              nis: studentData.nis,
              error: "NIS sudah ada di database",
            });
            continue;
          }

          // Check parent data
          const hasParentData =
            parentData.fatherName ||
            parentData.motherName ||
            parentData.parentPhone;
          if (hasParentData && parentData.parentPhone) {
            const existingParent = await db.query.parents.findFirst({
              where: eq(parents.phone, String(parentData.parentPhone)),
            });
            if (existingParent) {
              preview.existingParents++;
            } else {
              preview.newParents++;
            }
          } else if (hasParentData) {
            preview.newParents++;
          }

          preview.validRows++;
          preview.validData.push({
            row: rowNumber,
            nis: studentData.nis,
            fullName: studentData.fullName,
            gender: studentData.gender,
            status: studentData.status,
            hasParent: hasParentData,
            parentPhone: parentData.parentPhone || null,
          });
        } catch (err: any) {
          preview.invalidRows++;
          preview.errors.push({
            row: rowNumber,
            nis: row.NIS || "-",
            error: err.message || "Unknown error",
          });
        }
      }

      return c.json({
        success: true,
        message: "Preview selesai",
        data: preview,
      });
    } catch (error: any) {
      console.error("Preview import error:", error);
      return c.json(
        {
          success: false,
          message: "Failed to preview import",
          error: error?.message,
        },
        500
      );
    }
  }
);

// Import students from Excel
studentsRoute.post("/import", requireRole("admin", "staff"), async (c) => {
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
        { success: false, message: "Excel file is empty or has no data rows" },
        400
      );
    }

    // Map Excel columns to database fields
    const columnMapping: { [key: string]: string } = {
      NIS: "nis",
      "Nama Lengkap": "fullName",
      Nama: "fullName",
      "Jenis Kelamin": "gender",
      Gender: "gender",
      "Tanggal Lahir": "birthDate",
      "Tempat Lahir": "birthPlace",
      Alamat: "address",
      Telepon: "phone",
      Phone: "phone",
      Status: "status",
    };

    // Parent column mappings
    const parentColumnMapping: { [key: string]: string } = {
      "Nama Ayah": "fatherName",
      "Nama Ibu": "motherName",
      "Pekerjaan Ayah": "fatherOccupation",
      "Pekerjaan Ibu": "motherOccupation",
      "Telepon Orang Tua": "parentPhone",
      "Alamat Orang Tua": "parentAddress",
      "Email Orang Tua": "parentEmail",
      "Password Orang Tua": "parentPassword",
    };

    const genderMapping: { [key: string]: string } = {
      "Laki-laki": "male",
      L: "male",
      Male: "male",
      Perempuan: "female",
      P: "female",
      Female: "female",
    };

    const statusMapping: { [key: string]: string } = {
      Aktif: "active",
      Active: "active",
      Lulus: "graduated",
      Graduated: "graduated",
      Pindah: "transferred",
      Transferred: "transferred",
      Keluar: "dropped",
      Dropped: "dropped",
    };

    const results = {
      success: 0,
      failed: 0,
      parentsCreated: 0,
      parentsLinked: 0,
      errors: [] as { row: number; nis: string; error: string }[],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and has header row

      try {
        // Map row data to student object
        const studentData: any = {};
        for (const [excelCol, dbField] of Object.entries(columnMapping)) {
          if (
            row[excelCol] !== undefined &&
            row[excelCol] !== null &&
            row[excelCol] !== ""
          ) {
            studentData[dbField] = row[excelCol];
          }
        }

        // Map row data to parent object
        const parentData: any = {};
        for (const [excelCol, dbField] of Object.entries(parentColumnMapping)) {
          if (
            row[excelCol] !== undefined &&
            row[excelCol] !== null &&
            row[excelCol] !== ""
          ) {
            parentData[dbField] = row[excelCol];
          }
        }

        // Validate required fields
        if (!studentData.nis) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            nis: "-",
            error: "NIS wajib diisi",
          });
          continue;
        }
        if (!studentData.fullName) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            nis: studentData.nis,
            error: "Nama wajib diisi",
          });
          continue;
        }

        // Convert gender
        if (studentData.gender) {
          studentData.gender =
            genderMapping[studentData.gender] ||
            studentData.gender.toLowerCase();
        } else {
          studentData.gender = "male"; // default
        }

        // Convert status
        if (studentData.status) {
          studentData.status = statusMapping[studentData.status] || "active";
        } else {
          studentData.status = "active"; // default
        }

        // Parse date if exists
        if (studentData.birthDate) {
          // Handle Excel date serial number
          if (typeof studentData.birthDate === "number") {
            const date = XLSX.SSF.parse_date_code(studentData.birthDate);
            studentData.birthDate = new Date(date.y, date.m - 1, date.d);
          } else if (typeof studentData.birthDate === "string") {
            studentData.birthDate = new Date(studentData.birthDate);
          }
        }

        // Check if NIS already exists
        const existing = await db.query.students.findFirst({
          where: eq(students.nis, String(studentData.nis)),
        });

        if (existing) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            nis: studentData.nis,
            error: "NIS sudah ada",
          });
          continue;
        }

        // Process parent data if available
        let parentId: number | undefined;
        const hasParentData =
          parentData.fatherName ||
          parentData.motherName ||
          parentData.parentPhone;

        if (hasParentData) {
          // Check if parent with same phone already exists
          let existingParent = null;
          if (parentData.parentPhone) {
            existingParent = await db.query.parents.findFirst({
              where: eq(parents.phone, String(parentData.parentPhone)),
            });
          }

          if (existingParent) {
            // Link to existing parent
            parentId = existingParent.id;
            results.parentsLinked++;
          } else {
            // Create new parent with user account
            let parentUserId: number | undefined;

            // Create user account if email and password provided
            if (parentData.parentEmail && parentData.parentPassword) {
              // Check if email already exists
              const existingUser = await db.query.users.findFirst({
                where: eq(users.email, parentData.parentEmail),
              });

              if (!existingUser) {
                const hashedPassword = await hashPassword(
                  parentData.parentPassword
                );
                const userResult = await db.insert(users).values({
                  email: parentData.parentEmail,
                  password: hashedPassword,
                  name: parentData.fatherName || parentData.motherName,
                  role: "parent",
                });
                parentUserId = Number(userResult[0].insertId);
              } else {
                // Use existing user if email matches
                parentUserId = existingUser.id;
              }
            }

            // Create parent record
            const parentResult = await db.insert(parents).values({
              userId: parentUserId,
              fatherName: parentData.fatherName,
              motherName: parentData.motherName,
              fatherOccupation: parentData.fatherOccupation,
              motherOccupation: parentData.motherOccupation,
              phone: parentData.parentPhone
                ? String(parentData.parentPhone)
                : undefined,
              address: parentData.parentAddress || studentData.address,
            });
            parentId = Number(parentResult[0].insertId);
            results.parentsCreated++;
          }
        }

        // Insert student
        const studentResult = await db.insert(students).values({
          nis: String(studentData.nis),
          fullName: studentData.fullName,
          gender: studentData.gender,
          birthDate: studentData.birthDate || undefined,
          birthPlace: studentData.birthPlace || undefined,
          address: studentData.address || undefined,
          phone: studentData.phone ? String(studentData.phone) : undefined,
          status: studentData.status,
        });

        const newStudentId = Number(studentResult[0].insertId);

        // Link student to parent if parent was created/found
        if (parentId) {
          await db.insert(studentParents).values({
            studentId: newStudentId,
            parentId: parentId,
            isPrimary: true,
          });
        }

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          nis: row.NIS || "-",
          error: err.message || "Unknown error",
        });
      }
    }

    return c.json({
      success: true,
      message: `Import selesai: ${results.success} santri berhasil, ${results.failed} gagal. Orang tua: ${results.parentsCreated} baru, ${results.parentsLinked} terhubung ke data yang ada.`,
      data: results,
    });
  } catch (error: any) {
    console.error("Import students error:", error);
    return c.json(
      {
        success: false,
        message: "Failed to import students",
        error: error?.message,
      },
      500
    );
  }
});

// Get student by ID
studentsRoute.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const student = await db.query.students.findFirst({
      where: eq(students.id, id),
    });

    if (!student) {
      return c.json({ success: false, message: "Student not found" }, 404);
    }

    // Get parents dari student_parents
    const { studentParents } = await import("../db/schema/student-parents");
    const parentRelations = await db.query.studentParents.findMany({
      where: eq(studentParents.studentId, id),
    });

    // Get parent details
    const parentsData = await Promise.all(
      parentRelations.map(async (rel) => {
        const parent = await db.query.parents.findFirst({
          where: eq(parents.id, rel.parentId),
        });
        return {
          ...parent,
          isPrimary: rel.isPrimary,
        };
      })
    );

    return c.json({
      success: true,
      data: {
        ...student,
        parents: parentsData,
      },
    });
  } catch (error) {
    console.error("Get student error:", error);
    return c.json({ success: false, message: "Failed to get student" }, 500);
  }
});

// Create student
studentsRoute.post(
  "/",
  requireRole("admin", "staff"),
  zValidator("json", createStudentSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      // Check if NIS already exists
      const existingStudent = await db.query.students.findFirst({
        where: eq(students.nis, data.nis),
      });

      if (existingStudent) {
        return c.json({ success: false, message: "NIS already exists" }, 400);
      }

      let userId: number | undefined;

      // Create user account if email and password provided
      if (data.email && data.password) {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, data.email),
        });

        if (existingUser) {
          return c.json(
            { success: false, message: "Email already exists" },
            400
          );
        }

        const hashedPassword = await hashPassword(data.password);
        const userResult = await db.insert(users).values({
          email: data.email,
          password: hashedPassword,
          role: "student",
        });
        userId = Number(userResult[0].insertId);
      }

      const result = await db.insert(students).values({
        userId,
        nis: data.nis,
        fullName: data.fullName,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        birthPlace: data.birthPlace,
        gender: data.gender,
        address: data.address,
        phone: data.phone,
        parentId: data.parentId,
        classId: data.classId,
        enrollmentDate: data.enrollmentDate
          ? new Date(data.enrollmentDate)
          : undefined,
        status: data.status || "active",
        photo: data.photo,
      });

      const newStudent = await db.query.students.findFirst({
        where: eq(students.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Student created successfully",
        data: newStudent,
      });
    } catch (error) {
      console.error("Create student error:", error);
      return c.json(
        { success: false, message: "Failed to create student" },
        500
      );
    }
  }
);

// Update student
studentsRoute.put(
  "/:id",
  requireRole("admin", "staff"),
  zValidator("json", updateStudentSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.students.findFirst({
        where: eq(students.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Student not found" }, 404);
      }

      // Check if new NIS conflicts
      if (data.nis && data.nis !== existing.nis) {
        const nisExists = await db.query.students.findFirst({
          where: eq(students.nis, data.nis),
        });
        if (nisExists) {
          return c.json({ success: false, message: "NIS already exists" }, 400);
        }
      }

      await db
        .update(students)
        .set({
          ...data,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          enrollmentDate: data.enrollmentDate
            ? new Date(data.enrollmentDate)
            : undefined,
        })
        .where(eq(students.id, id));

      const updated = await db.query.students.findFirst({
        where: eq(students.id, id),
      });

      return c.json({
        success: true,
        message: "Student updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update student error:", error);
      return c.json(
        { success: false, message: "Failed to update student" },
        500
      );
    }
  }
);

// Delete student
studentsRoute.delete("/:id", requireRole("admin"), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const existing = await db.query.students.findFirst({
      where: eq(students.id, id),
    });

    if (!existing) {
      return c.json({ success: false, message: "Student not found" }, 404);
    }

    // Delete all related records first to avoid foreign key constraint errors
    // Import and delete from all related tables
    const { halaqahMembers } = await import("../db/schema/halaqah");
    const { studentAttendances } = await import("../db/schema/attendance");
    const { grades, reports } = await import("../db/schema/academic");
    const { quranMemorizations } = await import(
      "../db/schema/quran-memorization"
    );
    const { rewardsPunishments } = await import(
      "../db/schema/rewards-punishments"
    );

    // Delete related records (using try-catch for each to avoid crashes if tables are empty)
    try {
      await db.delete(studentParents).where(eq(studentParents.studentId, id));
    } catch {}
    try {
      await db.delete(halaqahMembers).where(eq(halaqahMembers.studentId, id));
    } catch {}
    try {
      await db
        .delete(studentAttendances)
        .where(eq(studentAttendances.studentId, id));
    } catch {}
    try {
      await db.delete(grades).where(eq(grades.studentId, id));
    } catch {}
    try {
      await db.delete(reports).where(eq(reports.studentId, id));
    } catch {}
    try {
      await db
        .delete(quranMemorizations)
        .where(eq(quranMemorizations.studentId, id));
    } catch {}
    try {
      await db
        .delete(rewardsPunishments)
        .where(eq(rewardsPunishments.studentId, id));
    } catch {}

    // Then delete the student
    await db.delete(students).where(eq(students.id, id));

    // Optionally delete associated user account
    if (existing.userId) {
      await db.delete(users).where(eq(users.id, existing.userId));
    }

    return c.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete student error:", error);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    return c.json(
      {
        success: false,
        message: "Failed to delete student",
        error: error?.message || String(error),
      },
      500
    );
  }
});

// ============ STUDENT PARENTS ============

import {
  addStudentParentSchema,
  updateStudentParentSchema,
} from "../validators/student-parents";

// Get parents of student
studentsRoute.get("/:id/parents", async (c) => {
  try {
    const studentId = parseInt(c.req.param("id"));

    const relations = await db.query.studentParents.findMany({
      where: eq(studentParents.studentId, studentId),
    });

    // Get parent details
    const parentsWithDetails = await Promise.all(
      relations.map(async (rel) => {
        const parent = await db.query.parents.findFirst({
          where: eq(parents.id, rel.parentId),
        });
        return {
          ...rel,
          parent,
        };
      })
    );

    return c.json({
      success: true,
      data: parentsWithDetails,
    });
  } catch (error) {
    console.error("Get student parents error:", error);
    return c.json({ success: false, message: "Failed to get parents" }, 500);
  }
});

// Add parent to student
studentsRoute.post(
  "/:id/parents",
  requireRole("admin", "staff"),
  zValidator("json", addStudentParentSchema),
  async (c) => {
    try {
      const studentId = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      // Check if student exists
      const student = await db.query.students.findFirst({
        where: eq(students.id, studentId),
      });

      if (!student) {
        return c.json({ success: false, message: "Student not found" }, 404);
      }

      // Check if parent exists
      const parent = await db.query.parents.findFirst({
        where: eq(parents.id, data.parentId),
      });

      if (!parent) {
        return c.json({ success: false, message: "Parent not found" }, 404);
      }

      // Check if relation already exists
      const existing = await db.query.studentParents.findFirst({
        where: and(
          eq(studentParents.studentId, studentId),
          eq(studentParents.parentId, data.parentId)
        ),
      });

      if (existing) {
        return c.json(
          {
            success: false,
            message: "Parent is already linked to this student",
          },
          400
        );
      }

      const result = await db.insert(studentParents).values({
        studentId,
        parentId: data.parentId,
        isPrimary: data.isPrimary || false,
      });

      const newRelation = await db.query.studentParents.findFirst({
        where: eq(studentParents.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Parent linked successfully",
        data: newRelation,
      });
    } catch (error) {
      console.error("Add student parent error:", error);
      return c.json({ success: false, message: "Failed to link parent" }, 500);
    }
  }
);

// Update parent relation
studentsRoute.put(
  "/:id/parents/:parentId",
  requireRole("admin", "staff"),
  zValidator("json", updateStudentParentSchema),
  async (c) => {
    try {
      const studentId = parseInt(c.req.param("id"));
      const parentId = parseInt(c.req.param("parentId"));
      const data = c.req.valid("json");

      const relation = await db.query.studentParents.findFirst({
        where: and(
          eq(studentParents.studentId, studentId),
          eq(studentParents.parentId, parentId)
        ),
      });

      if (!relation) {
        return c.json({ success: false, message: "Relation not found" }, 404);
      }

      await db
        .update(studentParents)
        .set(data)
        .where(eq(studentParents.id, relation.id));

      const updated = await db.query.studentParents.findFirst({
        where: eq(studentParents.id, relation.id),
      });

      return c.json({
        success: true,
        message: "Relation updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update student parent error:", error);
      return c.json(
        { success: false, message: "Failed to update relation" },
        500
      );
    }
  }
);

// Remove parent from student
studentsRoute.delete(
  "/:id/parents/:parentId",
  requireRole("admin"),
  async (c) => {
    try {
      const studentId = parseInt(c.req.param("id"));
      const parentId = parseInt(c.req.param("parentId"));

      const relation = await db.query.studentParents.findFirst({
        where: and(
          eq(studentParents.studentId, studentId),
          eq(studentParents.parentId, parentId)
        ),
      });

      if (!relation) {
        return c.json({ success: false, message: "Relation not found" }, 404);
      }

      await db.delete(studentParents).where(eq(studentParents.id, relation.id));

      return c.json({
        success: true,
        message: "Parent unlinked successfully",
      });
    } catch (error) {
      console.error("Remove student parent error:", error);
      return c.json(
        { success: false, message: "Failed to unlink parent" },
        500
      );
    }
  }
);

export default studentsRoute;
