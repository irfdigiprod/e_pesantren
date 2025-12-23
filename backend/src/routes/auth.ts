import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
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
    const result = await db.insert(users).values({
      email,
      password: hashedPassword,
      role: role || "student",
    });

    // Get the newly created user
    const newUser = await db.query.users.findFirst({
      where: eq(users.id, Number(result[0].insertId)),
    });

    if (!newUser) {
      return c.json({ success: false, message: "Failed to create user" }, 500);
    }

    // Generate token
    const token = generateToken(newUser);

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

    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        role: true,
      },
      where: eq(users.isActive, true),
    });

    // Filter out current user
    const otherUsers = allUsers.filter((u) => u.id !== currentUser.userId);

    return c.json({
      success: true,
      data: otherUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return c.json({ success: false, message: "Failed to get users" }, 500);
  }
});

export default auth;
