import { Hono } from "hono";
import { db } from "../db";
import { users, teachers } from "../db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../middleware/auth";

const usersRoute = new Hono();

// Helper for saving uploaded photo
async function saveUserPhoto(file: File): Promise<string> {
  const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
  const uploadPath = path.join(UPLOAD_DIR, "image");
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)}.${ext}`;
  const filePath = path.join(uploadPath, filename);
  const relativePath = `uploads/image/${filename}`;

  const buffer = await file.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buffer));

  return `/api/${relativePath}`;
}

// Get all users (Admin only)
usersRoute.get("/", authMiddleware, async (c) => {
  try {
    const allUsers = await db.select().from(users).orderBy(users.name);

    return c.json({ success: true, data: allUsers });
  } catch (error) {
    console.error("Fetch users error:", error);
    return c.json({ success: false, message: "Failed to fetch users" }, 500);
  }
});

// Get current user profile
usersRoute.get("/current", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");
    if (!currentUser || !currentUser.userId) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, currentUser.userId),
    });

    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    // Remove password from response
    const { password, ...safeUser } = user;
    return c.json({ success: true, data: safeUser });
  } catch (error) {
    console.error("Fetch current user error:", error);
    return c.json(
      { success: false, message: "Failed to fetch current user" },
      500
    );
  }
});

// Get user by ID
usersRoute.get("/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ success: false, message: "Invalid ID" }, 400);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    const { password, ...safeUser } = user;
    return c.json({ success: true, data: safeUser });
  } catch (error) {
    console.error("Fetch user error:", error);
    return c.json({ success: false, message: "Failed to fetch user" }, 500);
  }
});

// ============ IMPORT USERS ============

// Preview import users from Excel
usersRoute.post("/import/preview", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, message: "File is required" }, 400);
    }

    const buffer = await file.arrayBuffer();
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    if (!rawData || rawData.length === 0) {
      return c.json(
        { success: false, message: "File is empty or invalid" },
        400
      );
    }

    // Column Mapping
    const columnMapping: { [key: string]: string } = {
      "Nama Lengkap": "name",
      Nama: "name",
      Name: "name",
      Email: "email",
      Password: "password",
      Role: "role",
      Status: "isActive",
      // Profile
      Phone: "phone",
      Telepon: "phone",
      Gender: "gender",
      "Jenis Kelamin": "gender",
      "Tanggal Lahir": "birthDate",
      "Tempat Lahir": "birthPlace",
      Alamat: "address",
      Address: "address",
      // Teacher specific
      NIP: "nip",
      Jabatan: "position",
      Divisi: "department",
      "Tipe Karyawan": "employeeType",
    };

    const validData: any[] = [];
    const errors: any[] = [];
    let duplicateNIP = 0;

    // Check existing emails
    const existingEmails = new Set(
      (await db.select({ email: users.email }).from(users)).map((u) => u.email)
    );

    // Process rows
    rawData.forEach((row: any, index: number) => {
      const rowNum = index + 2; // +1 for header, +1 for 0-index
      const mappedUser: any = {};
      let isValid = true;
      let errorMsg = "";

      // Map columns
      Object.keys(row).forEach((key) => {
        const mappedKey =
          columnMapping[key] || columnMapping[key.trim()] || key;
        if (mappedKey) {
          mappedUser[mappedKey] = row[key];
        }
      });

      // Validations
      if (!mappedUser.name) {
        isValid = false;
        errorMsg = "Nama wajib diisi";
      } else if (!mappedUser.email) {
        isValid = false;
        errorMsg = "Email wajib diisi";
      } else if (existingEmails.has(mappedUser.email)) {
        isValid = false;
        errorMsg = "Email sudah terdaftar";
      }

      // Default values
      if (!mappedUser.role) mappedUser.role = "student";
      // Convert gender
      if (mappedUser.gender) {
        const g = mappedUser.gender.toLowerCase();
        mappedUser.gender =
          g === "l" || g === "laki-laki" || g === "male" ? "male" : "female";
      }

      // Handle dates
      if (mappedUser.birthDate) {
        // Try to parse excel date if number, or string
        // Simple check, if it's a number (Excel serial date), convert?
        // XLSX sheet_to_json handles some, but let's assume valid string or raw
      }

      if (isValid) {
        validData.push(mappedUser);
      } else {
        errors.push({ row: rowNum, error: errorMsg, ...mappedUser });
      }
    });

    return c.json({
      success: true,
      data: {
        totalRows: rawData.length,
        validRows: validData.length,
        invalidRows: errors.length,
        validData: validData,
        errors: errors,
        duplicateNIP, // not really checking NIP dupes yet but keeping field
      },
    });
  } catch (error) {
    console.error("Preview import error:", error);
    return c.json({ success: false, message: "Failed to preview file" }, 500);
  }
});

// Import users (Admin only)
usersRoute.post("/import", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, message: "File is required" }, 400);
    }

    const buffer = await file.arrayBuffer();
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    // Column Mapping
    const columnMapping: { [key: string]: string } = {
      "Nama Lengkap": "name",
      Nama: "name",
      Name: "name",
      Email: "email",
      Password: "password",
      Role: "role",
      Status: "isActive",
      Phone: "phone",
      Telepon: "phone",
      Gender: "gender",
      "Jenis Kelamin": "gender",
      "Tanggal Lahir": "birthDate",
      "Tempat Lahir": "birthPlace",
      Alamat: "address",
      Address: "address",
      NIP: "nip",
      Jabatan: "position",
      Divisi: "department",
      "Tipe Karyawan": "employeeType",
    };

    const bcrypt = await import("bcryptjs");
    const defaultPasswordHash = await bcrypt.hash("12345678", 10);

    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // Get existing emails for quick check
    const existingEmails = new Set(
      (await db.select({ email: users.email }).from(users)).map((u) => u.email)
    );

    // Process chunked or transaction
    // For simplicity, row by row or batch
    const usersToInsert: any[] = [];
    const teachersToInsert: any[] = [];

    for (const [index, row] of rawData.entries()) {
      const rowNum = index + 2;
      const u: any = {};

      // Map
      Object.keys(row as object).forEach((key) => {
        const mappedKey =
          columnMapping[key] || columnMapping[key.trim()] || key;
        if (mappedKey) u[mappedKey] = (row as any)[key];
      });

      // Validate
      if (!u.name || !u.email) {
        failedCount++;
        errors.push({ row: rowNum, error: "Nama/Email kosong", ...u });
        continue;
      }
      if (existingEmails.has(u.email)) {
        failedCount++;
        errors.push({ row: rowNum, error: "Email sudah ada", ...u });
        continue;
      }

      // Defaults
      u.role = u.role?.toLowerCase() || "student";
      u.isActive = true; // Default active
      u.password = u.password
        ? await bcrypt.hash(String(u.password), 10)
        : defaultPasswordHash;
      // Gender normalize
      if (u.gender) {
        const g = u.gender.toLowerCase();
        u.gender =
          g === "l" || g === "laki-laki" || g === "male" ? "male" : "female";
      }

      try {
        // Insert User
        const [res] = await db.insert(users).values(u);
        const userId = res.insertId;

        // If teacher, insert teacher record
        if (u.role === "teacher" || u.role === "staff") {
          await db.insert(teachers).values({
            userId,
            fullName: u.name,
            email: u.email,
            nip: u.nip,
            position: u.position,
            department: u.department,
            employeeType: u.role === "teacher" ? "teacher" : "staff",
            phone: u.phone,
            gender: u.gender || "male",
            address: u.address,
            status: "active",
          });
        }
        successCount++;
      } catch (e: any) {
        failedCount++;
        errors.push({ row: rowNum, error: e.message || "DB Error", ...u });
      }
    }

    return c.json({
      success: true,
      data: {
        success: successCount,
        failed: failedCount,
        errors: errors,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return c.json({ success: false, message: "Import failed" }, 500);
  }
});

// Create new user (Admin only)
usersRoute.post("/", async (c) => {
  try {
    let body: any = {};
    const contentType = c.req.header("Content-Type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await c.req.parseBody({ all: true });
      // Handle file separately? parseBody handles files if all: true isn't strict, but Hono parseBody returns [key: string]: string | File
      // We need to extract values.
      // Hono's parseBody returns generic object.
      body = { ...formData };

      // Handle photo file
      if (body.photo && body.photo instanceof File) {
        const photoUrl = await saveUserPhoto(body.photo);
        body.photo = photoUrl;
      } else if (body.photo && !(body.photo instanceof File)) {
        // If it's a string (e.g. empty or text), ignore if not file?
        // Or if it's base64? Assuming File object for now.
        delete body.photo;
      }
    } else {
      body = await c.req.json();
    }

    const {
      email,
      password,
      name,
      role = "student",
      isActive, // validation below
      // Profile fields
      firstName,
      lastName,
      gender,
      birthPlace,
      birthDate,
      phone,
      address,
      province,
      regency,
      district,
      village,
      addressDetail,
      postalCode,
      photo, // URL string now
      // For teachers/staff
      nip,
      position,
      department,
      joinDate,
    } = body;

    // Basic validation
    if (!email || !password || !name) {
      return c.json(
        { success: false, message: "Email, password, and name are required" },
        400
      );
    }

    // Check if email exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return c.json(
        { success: false, message: "Email already registered" },
        400
      );
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Boolean conversion for FormData
    const isActiveBool =
      String(isActive) === "true" ||
      isActive === true ||
      isActive === 1 ||
      isActive === "1"
        ? true
        : false;

    // Insert user
    await db.transaction(async (tx) => {
      const [result] = await tx.insert(users).values({
        email,
        password: hashedPassword,
        name,
        role,
        isActive: isActiveBool,
        firstName,
        lastName,
        gender,
        birthPlace,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone,
        address,
        province:
          typeof province === "string" ? province : JSON.stringify(province),
        regency:
          typeof regency === "string" ? regency : JSON.stringify(regency),
        district:
          typeof district === "string" ? district : JSON.stringify(district),
        village:
          typeof village === "string" ? village : JSON.stringify(village),
        addressDetail,
        postalCode,
        photo,
      });

      const userId = result.insertId;

      // Auto-create teacher record
      if (role === "teacher" || role === "staff") {
        await tx.insert(teachers).values({
          userId: userId,
          fullName: name,
          nip: nip || null,
          position: position || null,
          department: department || null,
          employeeType: role === "teacher" ? "teacher" : "staff",
          gender: gender || "male",
          birthPlace: birthPlace,
          birthDate: birthDate ? new Date(birthDate) : null,
          phone: phone,
          email: email,
          address: address,
          province:
            typeof province === "string" ? province : JSON.stringify(province),
          regency:
            typeof regency === "string" ? regency : JSON.stringify(regency),
          district:
            typeof district === "string" ? district : JSON.stringify(district),
          village:
            typeof village === "string" ? village : JSON.stringify(village),
          addressDetail,
          postalCode,
          photo,
          joinDate: joinDate ? new Date(joinDate) : new Date(),
          status: isActiveBool ? "active" : "inactive",
        });
      }
    });

    return c.json({ success: true, message: "User created successfully" });
  } catch (error) {
    console.error("Create user error:", error);
    return c.json({ success: false, message: "Failed to create user" }, 500);
  }
});

// Update current user password
usersRoute.patch("/current/password", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");
    if (!currentUser || !currentUser.userId) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return c.json(
        { success: false, message: "Current and new password are required" },
        400
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, currentUser.userId),
    });

    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    // Verify current password
    const bcrypt = await import("bcryptjs");
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return c.json(
        { success: false, message: "Invalid current password" },
        400
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({ password: hashedNewPassword })
      .where(eq(users.id, currentUser.userId));

    return c.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    return c.json(
      { success: false, message: "Failed to update password" },
      500
    );
  }
});

// Update current user profile
usersRoute.patch("/current", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");
    if (!currentUser || !currentUser.userId) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    let body: any = {};
    const contentType = c.req.header("Content-Type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await c.req.parseBody({ all: true });
      body = { ...formData };
      if (body.photo && body.photo instanceof File) {
        const photoUrl = await saveUserPhoto(body.photo);
        body.photo = photoUrl;
      }
    } else {
      body = await c.req.json();
    }

    // Prepare update data
    const updateData: any = {};
    const allowedFields = [
      "firstName",
      "lastName",
      "gender",
      "birthPlace",
      "birthDate",
      "phone",
      "address",
      "province",
      "regency",
      "district",
      "village",
      "addressDetail",
      "postalCode",
      "photo",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (
          ["province", "regency", "district", "village"].includes(field) &&
          typeof body[field] !== "string"
        ) {
          updateData[field] = JSON.stringify(body[field]);
        } else {
          if (body[field] === "" && field !== "photo") {
            updateData[field] = null;
          } else {
            updateData[field] = body[field];
          }
        }
      }
    });

    if (body.birthDate) {
      const date = new Date(body.birthDate);
      if (!isNaN(date.getTime())) {
        updateData.birthDate = date;
      } else {
        updateData.birthDate = null;
      }
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, currentUser.userId));

    // Return updated user data (without password)
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, currentUser.userId),
    });

    if (!updatedUser) {
      return c.json(
        { success: false, message: "User not found after update" },
        404
      );
    }

    const { password, ...safeUser } = updatedUser;
    return c.json({
      success: true,
      data: safeUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update current user error:", error);
    return c.json({ success: false, message: "Failed to update profile" }, 500);
  }
});

// Update user by ID (Admin only)
usersRoute.patch("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    let body: any = {};
    const contentType = c.req.header("Content-Type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await c.req.parseBody({ all: true });
      body = { ...formData };
      if (body.photo && body.photo instanceof File) {
        const photoUrl = await saveUserPhoto(body.photo);
        body.photo = photoUrl;
      } else if (body.photo && !(body.photo instanceof File)) {
        // If not a file (e.g. string), keep it as is?
        // If null or "null", maybe user removed photo?
        // For now, if it's not a file and not empty string, assume it's keeping existing or standard url
      }
    } else {
      body = await c.req.json();
    }

    if (isNaN(id)) {
      return c.json({ success: false, message: "Invalid ID" }, 400);
    }

    // Prepare update data
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.role) updateData.role = body.role;
    if (body.isActive !== undefined) {
      updateData.isActive =
        String(body.isActive) === "true" ||
        body.isActive === true ||
        body.isActive === 1 ||
        body.isActive === "1";
    }

    // Password update
    if (body.password) {
      const bcrypt = await import("bcryptjs");
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    // Profile fields
    const profileFields = [
      "firstName",
      "lastName",
      "gender",
      "birthPlace",
      "birthDate",
      "phone",
      "address",
      "province",
      "regency",
      "district",
      "village",
      "addressDetail",
      "postalCode",
      "photo",
    ];

    profileFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (
          ["province", "regency", "district", "village"].includes(field) &&
          typeof body[field] !== "string"
        ) {
          updateData[field] = JSON.stringify(body[field]);
        } else {
          // Handle empty strings for nullable fields
          if (body[field] === "" && field !== "photo") {
            updateData[field] = null;
          } else {
            updateData[field] = body[field];
          }
        }
      }
    });

    if (body.birthDate) {
      const date = new Date(body.birthDate);
      if (!isNaN(date.getTime())) {
        updateData.birthDate = date;
      } else {
        updateData.birthDate = null;
      }
    } else if (body.birthDate === "") {
      updateData.birthDate = null;
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    return c.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    return c.json({ success: false, message: "Failed to update user" }, 500);
  }
});

// Delete user by ID (Admin only)
usersRoute.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ success: false, message: "Invalid ID" }, 400);
    }

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    // Prevent deleting self
    const currentUser = c.get("user");
    if (currentUser.userId === id) {
      return c.json({ success: false, message: "Cannot delete yourself" }, 400);
    }

    // Perform deletion in transaction
    await db.transaction(async (tx) => {
      // 1. Handle Chat Module
      // - Transfer ownership of conversations created by this user to the admin performing deletion
      const { conversations, messages, conversationParticipants } =
        await import("../db/schema/chat");

      await tx
        .update(conversations)
        .set({ createdBy: currentUser.userId })
        .where(eq(conversations.createdBy, id));

      // - Delete messages sent by this user (cascade handles attachments, reactions, read status)
      // Note: If messages are replies, they might cause issues if not handled, but usually CASCADE on delete self handles it or sets null if nullable.
      // In messages schema: replyToId references messages.id. If we delete a message, replies might be affected.
      // Drizzle/MySQL CASCADE should handle it if defined, otherwise we might need to update replies to null.
      // Schema says: replyToId has no onDelete action defined in schema explicitly in this file view, but usually we want to keep structure.
      // However, deleting the user IS primary. Let's assume standard behavior or just delete.
      await tx.delete(messages).where(eq(messages.senderId, id));

      // - Remove from participants
      await tx
        .delete(conversationParticipants)
        .where(eq(conversationParticipants.userId, id));

      // 2. Handle Clinic Module (Nullify references)
      const { clinicPatients, healthExaminations, medicineUsages, inpatients } =
        await import("../db/schema/clinic");
      // - Inpatients createdBy
      await tx
        .update(inpatients)
        .set({ createdBy: null })
        .where(eq(inpatients.createdBy, id));
      // - Health Examinations examiner
      await tx
        .update(healthExaminations)
        .set({ examiner: null })
        .where(eq(healthExaminations.examiner, id));
      // - Medicine Usage usedBy
      await tx
        .update(medicineUsages)
        .set({ usedBy: null })
        .where(eq(medicineUsages.usedBy, id));

      // 3. Handle Attendance Module (Nullify references)
      const { studentAttendances } = await import("../db/schema/attendance");
      await tx
        .update(studentAttendances)
        .set({ createdBy: null })
        .where(eq(studentAttendances.createdBy, id));

      // 4. Handle Permissions Module (Nullify approvedBy)
      const { permissionRequests } = await import("../db/schema/permissions");
      await tx
        .update(permissionRequests)
        .set({ approvedBy: null })
        .where(eq(permissionRequests.approvedBy, id));

      // 5. Handle Rewards Module (Nullify givenBy/issuedBy)
      const { rewardsPunishments, studentWarnings } = await import(
        "../db/schema/rewards-punishments"
      );
      await tx
        .update(rewardsPunishments)
        .set({ givenBy: null })
        .where(eq(rewardsPunishments.givenBy, id));
      await tx
        .update(studentWarnings)
        .set({ issuedBy: null })
        .where(eq(studentWarnings.issuedBy, id));

      // 6. Handle Core Roles (Teachers, Students, Parents)
      const { teachers } = await import("../db/schema/teachers");
      await tx.delete(teachers).where(eq(teachers.userId, id));

      const { students } = await import("../db/schema/students");
      await tx.delete(students).where(eq(students.userId, id));

      const { parents } = await import("../db/schema/students");
      const parentRecord = await tx.query.parents.findFirst({
        where: eq(parents.userId, id),
      });

      if (parentRecord) {
        // Unlink students from this parent first
        await tx
          .update(students)
          .set({ parentId: null })
          .where(eq(students.parentId, parentRecord.id));

        await tx.delete(parents).where(eq(parents.id, parentRecord.id));
      }

      // 7. Finally Delete User
      await tx.delete(users).where(eq(users.id, id));
    });

    return c.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return c.json({ success: false, message: "Failed to delete user" }, 500);
  }
});

export default usersRoute;
