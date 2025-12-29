import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, getTableColumns } from "drizzle-orm";
import { db } from "../db";
import { teachers } from "../db/schema/teachers";
import { divisions, teacherDivisions } from "../db/schema/divisions";
import { users } from "../db/schema/users";
import { salaryGrades, positionAllowances } from "../db/schema/salary";
import { authMiddleware, requireRole } from "../middleware/auth";
import { hashPassword } from "../utils/password";
import {
  createTeacherSchema,
  updateTeacherSchema,
} from "../validators/teachers";

const teachersRoute = new Hono();

// Apply auth to all routes
teachersRoute.use("*", authMiddleware);

// Get all teachers
teachersRoute.get("/", async (c) => {
  try {
    const userId = c.req.query("userId");

    let conditions: any[] = [];
    if (userId) {
      conditions.push(eq(teachers.userId, parseInt(userId)));
    }

    const query = db
      .select({
        ...getTableColumns(teachers),
        // Salary Grade columns
        sg_id: salaryGrades.id,
        sg_name: salaryGrades.name,
        sg_dailyAttendanceRate: salaryGrades.dailyAttendanceRate,
        sg_baseSalary: salaryGrades.baseSalary,
        sg_healthAllowance: salaryGrades.healthAllowance,
        sg_teachingHourRate: salaryGrades.teachingHourRate,
        sg_housingAllowance: salaryGrades.housingAllowance,
        sg_transportAllowance: salaryGrades.transportAllowance,
        // Position Allowance columns
        pa_id: positionAllowances.id,
        pa_position: positionAllowances.position,
        pa_amount: positionAllowances.amount,
      })
      .from(teachers)
      .leftJoin(salaryGrades, eq(teachers.salaryGradeId, salaryGrades.id))
      .leftJoin(
        positionAllowances,
        eq(teachers.positionAllowanceId, positionAllowances.id)
      )
      .orderBy(desc(teachers.createdAt));

    if (conditions.length > 0) {
      query.where(conditions[0]);
    }

    const allTeachers = await query;

    // Fetch related divisions manually to be safe
    const allRelations = await db
      .select({
        teacherId: teacherDivisions.teacherId,
        division: divisions,
      })
      .from(teacherDivisions)
      .innerJoin(divisions, eq(teacherDivisions.divisionId, divisions.id));

    const data = allTeachers.map((row) => {
      // Reconstruct nested objects
      const salaryGrade = row.sg_id
        ? {
            id: row.sg_id,
            name: row.sg_name,
            dailyAttendanceRate: row.sg_dailyAttendanceRate,
            baseSalary: row.sg_baseSalary,
            healthAllowance: row.sg_healthAllowance,
            teachingHourRate: row.sg_teachingHourRate,
            housingAllowance: row.sg_housingAllowance,
            transportAllowance: row.sg_transportAllowance,
          }
        : null;

      const positionAllowance = row.pa_id
        ? {
            id: row.pa_id,
            position: row.pa_position,
            amount: row.pa_amount,
          }
        : null;

      // Extract teacher data (remove aliased columns)
      const {
        sg_id,
        sg_name,
        sg_dailyAttendanceRate,
        sg_baseSalary,
        sg_healthAllowance,
        sg_teachingHourRate,
        sg_housingAllowance,
        sg_transportAllowance,
        pa_id,
        pa_position,
        pa_amount,
        ...teacherData
      } = row;

      const myDivs = allRelations
        .filter((r) => r.teacherId === teacherData.id)
        .map((r) => r.division);
      return {
        ...teacherData,
        divisions: myDivs,
        salaryGrade,
        positionAllowance,
      };
    });

    return c.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error("Get teachers error details:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql,
      sqlMessage: error.sqlMessage,
    });
    return c.json(
      {
        success: false,
        message:
          "Failed to get teachers: " +
          (error.sqlMessage || error.message || String(error)) +
          (error.sql ? ` \nSQL: ${error.sql}` : ""),
      },
      500
    );
  }
});

// Get teacher by ID
teachersRoute.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.id, id),
    });

    if (!teacher) {
      return c.json({ success: false, message: "Teacher not found" }, 404);
    }

    return c.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error("Get teacher error:", error);
    return c.json({ success: false, message: "Failed to get teacher" }, 500);
  }
});

// Create teacher
teachersRoute.post(
  "/",
  requireRole("admin", "staff"),
  zValidator("json", createTeacherSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      // Check if NIP already exists (if provided)
      if (data.nip) {
        const existingTeacher = await db.query.teachers.findFirst({
          where: eq(teachers.nip, data.nip),
        });

        if (existingTeacher) {
          return c.json({ success: false, message: "NIP already exists" }, 400);
        }
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
        const role = data.employeeType === "staff" ? "staff" : "teacher";
        const userResult = await db.insert(users).values({
          email: data.email,
          password: hashedPassword,
          role,
        });
        userId = Number(userResult[0].insertId);
      }

      const result = await db.insert(teachers).values({
        userId,
        nip: data.nip,
        fullName: data.fullName,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        birthPlace: data.birthPlace,
        gender: data.gender,
        address: data.address,
        // Separate address fields
        province: data.province,
        regency: data.regency,
        district: data.district,
        village: data.village,
        addressDetail: data.addressDetail,
        postalCode: data.postalCode,
        phone: data.phone,
        email: data.email,
        position: data.position,
        department: data.department,
        employeeType: data.employeeType || "teacher",
        joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
        status: data.status || "active",
        photo: data.photo,
      });

      const newTeacher = await db.query.teachers.findFirst({
        where: eq(teachers.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Teacher created successfully",
        data: newTeacher,
      });
    } catch (error) {
      console.error("Create teacher error:", error);
      return c.json(
        { success: false, message: "Failed to create teacher" },
        500
      );
    }
  }
);

// Update teacher
teachersRoute.put(
  "/:id",
  requireRole("admin", "staff"),
  zValidator("json", updateTeacherSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.teachers.findFirst({
        where: eq(teachers.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Teacher not found" }, 404);
      }

      // Check if new NIP conflicts
      if (data.nip && data.nip !== existing.nip) {
        const nipExists = await db.query.teachers.findFirst({
          where: eq(teachers.nip, data.nip),
        });
        if (nipExists) {
          return c.json({ success: false, message: "NIP already exists" }, 400);
        }
      }

      await db
        .update(teachers)
        .set({
          ...data,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
        })
        .where(eq(teachers.id, id));

      const updated = await db.query.teachers.findFirst({
        where: eq(teachers.id, id),
      });

      return c.json({
        success: true,
        message: "Teacher updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update teacher error:", error);
      return c.json(
        { success: false, message: "Failed to update teacher" },
        500
      );
    }
  }
);

// Delete teacher
teachersRoute.delete("/:id", requireRole("admin"), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const existing = await db.query.teachers.findFirst({
      where: eq(teachers.id, id),
    });

    if (!existing) {
      return c.json({ success: false, message: "Teacher not found" }, 404);
    }

    await db.delete(teachers).where(eq(teachers.id, id));

    // Optionally delete associated user account
    if (existing.userId) {
      await db.delete(users).where(eq(users.id, existing.userId));
    }

    return c.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Delete teacher error:", error);
    return c.json({ success: false, message: "Failed to delete teacher" }, 500);
  }
});

// ============ IMPORT TEACHERS ============

// Preview import teachers from Excel
teachersRoute.post(
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

      // Column Mapping
      const columnMapping: { [key: string]: string } = {
        NIP: "nip",
        "Nama Lengkap": "fullName",
        Nama: "fullName",
        Jabatan: "position",
        Divisi: "division",
        "Jenis Kelamin": "gender",
        Gender: "gender",
        "Tanggal Lahir": "birthDate",
        "Tempat Lahir": "birthPlace",
        Alamat: "address",
        Telepon: "phone",
        Phone: "phone",
        Email: "email",
        Password: "password",
        Status: "status",
        "Tipe Karyawan": "employeeType",
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
        "Tidak Aktif": "inactive",
        Inactive: "inactive",
        Pensiun: "retired",
        Retired: "retired",
      };

      const employeeTypeMapping: { [key: string]: string } = {
        Guru: "teacher",
        Teacher: "teacher",
        Staff: "staff",
      };

      const preview = {
        totalRows: data.length,
        validRows: 0,
        invalidRows: 0,
        duplicateNIP: 0,
        duplicateEmail: 0,
        errors: [] as { row: number; nip: string; error: string }[],
        validData: [] as any[],
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
          const teacherData: any = {};
          for (const [excelCol, dbField] of Object.entries(columnMapping)) {
            if (
              row[excelCol] !== undefined &&
              row[excelCol] !== null &&
              row[excelCol] !== ""
            ) {
              teacherData[dbField] = row[excelCol];
            }
          }

          // Validation
          if (!teacherData.fullName) {
            throw new Error("Nama wajib diisi");
          }

          // Convert mappings
          if (teacherData.gender) {
            teacherData.gender =
              genderMapping[teacherData.gender] ||
              teacherData.gender.toLowerCase();
          } else {
            teacherData.gender = "male";
          }

          if (teacherData.status) {
            teacherData.status = statusMapping[teacherData.status] || "active";
          } else {
            teacherData.status = "active";
          }

          if (teacherData.employeeType) {
            teacherData.employeeType =
              employeeTypeMapping[teacherData.employeeType] || "teacher";
          } else {
            teacherData.employeeType = "teacher";
          }

          // Check NIP duplicate
          if (teacherData.nip) {
            const existing = await db.query.teachers.findFirst({
              where: eq(teachers.nip, String(teacherData.nip)),
            });
            if (existing) {
              preview.duplicateNIP++;
              throw new Error("NIP sudah ada di database");
            }
          }

          // Check Email duplicate
          if (teacherData.email) {
            const existingUser = await db.query.users.findFirst({
              where: eq(users.email, teacherData.email),
            });
            if (existingUser) {
              preview.duplicateEmail++;
              // Not a hard error for preview, but good to know
              // throw new Error("Email sudah digunakan oleh user lain");
            }
          }

          preview.validRows++;
          preview.validData.push({
            row: rowNumber,
            ...teacherData,
          });
        } catch (err: any) {
          preview.invalidRows++;
          preview.errors.push({
            row: rowNumber,
            nip: row.NIP || "-",
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

// Import teachers from Excel
teachersRoute.post("/import", requireRole("admin", "staff"), async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file) return c.json({ success: false, message: "No file" }, 400);

    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

    // Mappings (Same as preview)
    const columnMapping: { [key: string]: string } = {
      NIP: "nip",
      "Nama Lengkap": "fullName",
      Nama: "fullName",
      Jabatan: "position",
      Divisi: "division",
      "Jenis Kelamin": "gender",
      Gender: "gender",
      "Tanggal Lahir": "birthDate",
      "Tempat Lahir": "birthPlace",
      Alamat: "address",
      Telepon: "phone",
      Phone: "phone",
      Email: "email",
      Password: "password",
      Status: "status",
      "Tipe Karyawan": "employeeType",
    };
    const genderMapping: any = {
      "Laki-laki": "male",
      L: "male",
      Male: "male",
      Perempuan: "female",
      P: "female",
      Female: "female",
    };
    const statusMapping: any = {
      Aktif: "active",
      Active: "active",
      "Tidak Aktif": "inactive",
      Inactive: "inactive",
      Pensiun: "retired",
      Retired: "retired",
    };
    const employeeTypeMapping: any = {
      Guru: "teacher",
      Teacher: "teacher",
      Staff: "staff",
    };

    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        const rawData: any = {};
        for (const [k, v] of Object.entries(columnMapping)) {
          if (row[k]) rawData[v] = row[k];
        }

        if (!rawData.fullName) throw new Error("Nama wajib diisi");
        if (rawData.nip) {
          const exist = await db.query.teachers.findFirst({
            where: eq(teachers.nip, String(rawData.nip)),
          });
          if (exist) throw new Error("NIP sudah ada");
        }

        // Normilize
        rawData.gender =
          genderMapping[rawData.gender] ||
          rawData.gender?.toLowerCase() ||
          "male";
        rawData.status = statusMapping[rawData.status] || "active";
        rawData.employeeType =
          employeeTypeMapping[rawData.employeeType] || "teacher";

        // Date Parsing
        if (rawData.birthDate) {
          if (typeof rawData.birthDate === "number") {
            const date = XLSX.SSF.parse_date_code(rawData.birthDate);
            rawData.birthDate = new Date(date.y, date.m - 1, date.d);
          } else {
            rawData.birthDate = new Date(rawData.birthDate);
          }
        }

        // Create User if needed
        let userId: number | undefined;
        if (rawData.email && rawData.password) {
          const existUser = await db.query.users.findFirst({
            where: eq(users.email, rawData.email),
          });
          if (!existUser) {
            const hashed = await hashPassword(rawData.password);
            const newUser = await db.insert(users).values({
              email: rawData.email,
              password: hashed,
              name: rawData.fullName,
              role: "teacher",
            });
            userId = Number(newUser[0].insertId);
          }
          // If user exists, we skip creating logic for simplicity/safety
        }

        // Insert Teacher
        const res = await db.insert(teachers).values({
          userId,
          nip: rawData.nip ? String(rawData.nip) : undefined,
          fullName: rawData.fullName,
          gender: rawData.gender,
          birthDate: rawData.birthDate,
          birthPlace: rawData.birthPlace,
          address: rawData.address,
          phone: rawData.phone ? String(rawData.phone) : undefined,
          email: rawData.email,
          position: rawData.position,
          employeeType: rawData.employeeType,
          status: rawData.status,
        });

        const newTeacherId = Number(res[0].insertId);

        // Link Division if provided
        if (rawData.division) {
          // Try to find division by name
          const divName = rawData.division.trim();
          let div = await db.query.divisions.findFirst({
            where: eq(divisions.name, divName),
          });

          // Optionally create if not exists? For now assume valid divisions only or skip
          if (div) {
            await db.insert(teacherDivisions).values({
              teacherId: newTeacherId,
              divisionId: div.id,
              role: "member",
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
    console.error("Import error:", error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default teachersRoute;
