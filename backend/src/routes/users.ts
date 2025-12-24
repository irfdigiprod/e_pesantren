import { Hono } from "hono";
import { like, or, and, eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/users";
import { teachers } from "../db/schema/teachers";
import { parents } from "../db/schema/students";
import { authMiddleware } from "../middleware/auth";
import { broadcastUserProfileUpdate } from "../websocket";

const usersRoute = new Hono();

usersRoute.use("*", authMiddleware);

// Search users
usersRoute.get("/", async (c) => {
  try {
    const { search } = c.req.query();
    const currentUser = c.get("user");

    const whereClause = search
      ? and(
          eq(users.isActive, true),
          or(like(users.name, `%${search}%`), like(users.email, `%${search}%`))
        )
      : eq(users.isActive, true);

    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        photo: true,
      },
      where: whereClause,
      limit: 20,
    });

    // Filter out current user
    const otherUsers = allUsers.filter((u) => u.id !== currentUser.userId);

    // Enrich with teacher or parent data if available
    const enrichedUsers = await Promise.all(
      otherUsers.map(async (u) => {
        // Try to get teacher info first
        const teacher = await db.query.teachers.findFirst({
          where: eq(teachers.userId, u.id),
          columns: { fullName: true, photo: true },
        });

        if (teacher?.fullName) {
          return {
            ...u,
            name: teacher.fullName,
            photo: u.photo || teacher.photo,
          };
        }

        // If not a teacher, try to get parent info
        const parent = await db.query.parents.findFirst({
          where: eq(parents.userId, u.id),
          columns: { fatherName: true, motherName: true },
        });

        if (parent?.fatherName || parent?.motherName) {
          return {
            ...u,
            name: parent.fatherName || parent.motherName,
          };
        }

        // Fallback to user's name
        return u;
      })
    );

    return c.json({
      success: true,
      data: enrichedUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return c.json({ success: false, message: "Failed to get users" }, 500);
  }
});

// Get current user profile
usersRoute.get("/current", async (c) => {
  try {
    const currentUser = c.get("user");

    const user = await db.query.users.findFirst({
      where: eq(users.id, currentUser.userId),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        firstName: true,
        lastName: true,
        gender: true,
        birthPlace: true,
        birthDate: true,
        phone: true,
        address: true,
        photo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return c.json({ success: false, message: "Failed to get profile" }, 500);
  }
});

// Update current user profile
usersRoute.patch("/current", async (c) => {
  try {
    const currentUser = c.get("user");
    const body = await c.req.json();

    // Fields that can be updated
    const allowedFields = [
      "name",
      "firstName",
      "lastName",
      "gender",
      "birthPlace",
      "birthDate",
      "phone",
      "address",
      "photo",
    ];

    // Build update object with only allowed fields
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle legacy field mappings from frontend
    if (body.first_name !== undefined) updateData.firstName = body.first_name;
    if (body.last_name !== undefined) updateData.lastName = body.last_name;
    if (body.tempat_lahir !== undefined)
      updateData.birthPlace = body.tempat_lahir;
    if (body.tanggal_lahir !== undefined) {
      // Frontend sends dd/MM/yyyy, convert to date
      const parts = body.tanggal_lahir.split("/");
      if (parts.length === 3) {
        updateData.birthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    // Auto-update name if firstName or lastName is provided
    if (
      updateData.firstName !== undefined ||
      updateData.lastName !== undefined
    ) {
      // Fetch current values to combine properly
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, currentUser.userId),
        columns: { firstName: true, lastName: true },
      });

      const fName =
        updateData.firstName !== undefined
          ? updateData.firstName
          : existingUser?.firstName;
      const lName =
        updateData.lastName !== undefined
          ? updateData.lastName
          : existingUser?.lastName;

      updateData.name = `${fName || ""} ${lName || ""}`.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return c.json(
        { success: false, message: "No valid fields to update" },
        400
      );
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, currentUser.userId));

    // Return updated user
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, currentUser.userId),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        firstName: true,
        lastName: true,
        gender: true,
        birthPlace: true,
        birthDate: true,
        phone: true,
        address: true,
        photo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (updatedUser) {
      // Broadcast update to other users
      broadcastUserProfileUpdate(currentUser.userId, updatedUser);
    }

    return c.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return c.json({ success: false, message: "Failed to update profile" }, 500);
  }
});

// Change password
usersRoute.patch("/current/password", async (c) => {
  try {
    const currentUser = c.get("user");
    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json(
        { success: false, message: "Current and new password required" },
        400
      );
    }

    // Get current user with password
    const user = await db.query.users.findFirst({
      where: eq(users.id, currentUser.userId),
    });

    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }

    // Verify current password
    const bcrypt = await import("bcryptjs");
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return c.json(
        { success: false, message: "Current password is incorrect" },
        401
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, currentUser.userId));

    return c.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return c.json(
      { success: false, message: "Failed to change password" },
      500
    );
  }
});

export default usersRoute;
