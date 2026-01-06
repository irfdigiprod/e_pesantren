import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, ne } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/users";
import { hashPassword, verifyPassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { authMiddleware } from "../middleware/auth";
import { registerSchema, loginSchema } from "../validators/auth";

const auth = new Hono();

// Register
auth.post("/register", zValidator("json", registerSchema), async (c) => {
  try {
    const { email, password, role } = c.req.valid("json");

    // Check if user exists
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
    const hashedPassword = await hashPassword(password);

    // Create user (MySQL doesn't support returning, so we use insertId)
    // Wrap in transaction to ensure consistency
    let newUser: any;
    let token: string = "";

    await db.transaction(async (tx) => {
      const [result] = await tx.insert(users).values({
        email,
        password: hashedPassword,
        role: role || "student",
      });

      const userId = Number(result.insertId);

      // Get the newly created user
      newUser = await tx.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!newUser) {
        throw new Error("Failed to create user");
      }

      // If role is teacher or staff, create teacher record
      if (role === "teacher" || role === "staff") {
        const { teachers } = await import("../db/schema/teachers");
        // Use email username as default name
        const defaultName = email.split("@")[0];

        await tx.insert(teachers).values({
          userId: userId,
          fullName: defaultName,
          email: email,
          employeeType: role, // 'teacher' or 'staff'
          status: "active",
          gender: "male", // Default
        });
      }
    });

    if (!newUser) {
      return c.json({ success: false, message: "Registration failed" }, 500);
    }

    // Generate token
    token = generateToken(newUser);

    return c.json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return c.json({ success: false, message: "Registration failed" }, 500);
  }
});

// Login
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid("json");

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return c.json(
        { success: false, message: "Invalid email or password" },
        401
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return c.json({ success: false, message: "Account is deactivated" }, 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return c.json(
        { success: false, message: "Invalid email or password" },
        401
      );
    }

    // Generate token
    const token = generateToken(user);

    return c.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ success: false, message: "Login failed" }, 500);
  }
});

// Logout (client-side token removal, but we can log it)
auth.post("/logout", authMiddleware, async (c) => {
  // In JWT-based auth, logout is typically handled client-side
  // Here we just return success
  return c.json({
    success: true,
    message: "Logout successful",
  });
});

// Get current user
auth.get("/me", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");

    const user = await db.query.users.findFirst({
      where: eq(users.id, currentUser.userId),
    });

    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    return c.json({ success: false, message: "Failed to get user" }, 500);
  }
});

// Get all users (for chat user selection)
auth.get("/users", authMiddleware, async (c) => {
  try {
    const currentUser = c.get("user");
    const { teachers } = await import("../db/schema/teachers");
    const { students, parents } = await import("../db/schema/students");

    // We can't easily do a 4-way left join in one clean query object syntax with conditional logic cleanly in Drizzle indiscriminately.
    // But we can fetch users and then enrich, OR use query builder with left joins.
    // Query builder is better.

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        name: users.name,
        photo: users.photo,
        teacherName: teachers.fullName,
        studentName: students.fullName,
        parentFatherName: parents.fatherName,
        parentMotherName: parents.motherName,
      })
      .from(users)
      .leftJoin(teachers, eq(users.id, teachers.userId))
      .leftJoin(students, eq(users.id, students.userId))
      .leftJoin(parents, eq(users.id, parents.userId))
      .where(and(eq(users.isActive, true), ne(users.id, currentUser.userId)));

    const mappedUsers = allUsers.map((u) => {
      let displayName = u.name || u.email; // Fallback

      if (u.role === "teacher" && u.teacherName) {
        displayName = u.teacherName;
      } else if (u.role === "student" && u.studentName) {
        displayName = u.studentName;
      } else if (u.role === "parent") {
        displayName =
          u.parentFatherName || u.parentMotherName || u.name || "Orang Tua";
      }

      return {
        id: u.id,
        email: u.email,
        role: u.role,
        name: displayName,
        photo: u.photo, // Include photo if available
      };
    });

    return c.json({
      success: true,
      data: mappedUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return c.json({ success: false, message: "Failed to get users" }, 500);
  }
});

export default auth;
