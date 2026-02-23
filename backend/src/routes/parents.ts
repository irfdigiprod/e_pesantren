import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { parents } from "../db/schema/students";
import { users } from "../db/schema/users";
import { authMiddleware, requirePermission } from "../middleware/auth";
import { hashPassword } from "../utils/password";
import { createParentSchema, updateParentSchema } from "../validators/students";

const parentsRoute = new Hono();

// Apply auth to all routes
parentsRoute.use("*", authMiddleware);

// Get all parents
parentsRoute.get("/", async (c) => {
  try {
    const allParents = await db.query.parents.findMany();

    return c.json({
      success: true,
      data: allParents,
    });
  } catch (error) {
    console.error("Get parents error:", error);
    return c.json({ success: false, message: "Failed to get parents" }, 500);
  }
});

// Get parent by ID
parentsRoute.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const parent = await db.query.parents.findFirst({
      where: eq(parents.id, id),
    });

    if (!parent) {
      return c.json({ success: false, message: "Parent not found" }, 404);
    }

    // Get children dari student_parents
    const { studentParents } = await import("../db/schema/student-parents");
    const { students } = await import("../db/schema/students");
    const childRelations = await db.query.studentParents.findMany({
      where: eq(studentParents.parentId, id),
    });

    // Get student details
    const childrenData = await Promise.all(
      childRelations.map(async (rel) => {
        const student = await db.query.students.findFirst({
          where: eq(students.id, rel.studentId),
        });
        return {
          ...student,
          isPrimary: rel.isPrimary,
        };
      })
    );

    return c.json({
      success: true,
      data: {
        ...parent,
        children: childrenData,
      },
    });
  } catch (error) {
    console.error("Get parent error:", error);
    return c.json({ success: false, message: "Failed to get parent" }, 500);
  }
});

// Create parent
parentsRoute.post(
  "/",
  requirePermission("/security/users"),
  zValidator("json", createParentSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

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
          role: "parent",
        });
        userId = Number(userResult[0].insertId);
      }

      const result = await db.insert(parents).values({
        userId,
        fatherName: data.fatherName,
        motherName: data.motherName,
        fatherOccupation: data.fatherOccupation,
        motherOccupation: data.motherOccupation,
        phone: data.phone,
        address: data.address,
        // Detailed Address
        province: data.province,
        regency: data.regency,
        district: data.district,
        village: data.village,
        addressDetail: data.addressDetail,
        postalCode: data.postalCode,
      });

      const newParent = await db.query.parents.findFirst({
        where: eq(parents.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Parent created successfully",
        data: newParent,
      });
    } catch (error) {
      console.error("Create parent error:", error);
      return c.json(
        { success: false, message: "Failed to create parent" },
        500
      );
    }
  }
);

// Update parent
parentsRoute.put(
  "/:id",
  requirePermission("/security/users"),
  zValidator("json", updateParentSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.parents.findFirst({
        where: eq(parents.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Parent not found" }, 404);
      }

      await db
        .update(parents)
        .set({
          ...data,
        })
        .where(eq(parents.id, id));

      const updated = await db.query.parents.findFirst({
        where: eq(parents.id, id),
      });

      return c.json({
        success: true,
        message: "Parent updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update parent error:", error);
      return c.json(
        { success: false, message: "Failed to update parent" },
        500
      );
    }
  }
);

// Delete parent
parentsRoute.delete("/:id", requirePermission("/security/users"), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const existing = await db.query.parents.findFirst({
      where: eq(parents.id, id),
    });

    if (!existing) {
      return c.json({ success: false, message: "Parent not found" }, 404);
    }

    await db.delete(parents).where(eq(parents.id, id));

    // Optionally delete associated user account
    if (existing.userId) {
      await db.delete(users).where(eq(users.id, existing.userId));
    }

    return c.json({
      success: true,
      message: "Parent deleted successfully",
    });
  } catch (error) {
    console.error("Delete parent error:", error);
    return c.json({ success: false, message: "Failed to delete parent" }, 500);
  }
});

// ============ PARENT CHILDREN ============

import { studentParents } from "../db/schema/student-parents";
import { students } from "../db/schema/students";
import { and } from "drizzle-orm";
import { addParentChildSchema } from "../validators/student-parents";

// Get all children (students) of parent
parentsRoute.get("/:id/children", async (c) => {
  try {
    const parentId = parseInt(c.req.param("id"));

    const relations = await db.query.studentParents.findMany({
      where: eq(studentParents.parentId, parentId),
    });

    // Get student details
    const childrenWithDetails = await Promise.all(
      relations.map(async (rel) => {
        const student = await db.query.students.findFirst({
          where: eq(students.id, rel.studentId),
        });
        return {
          ...rel,
          student,
        };
      })
    );

    return c.json({
      success: true,
      data: childrenWithDetails,
    });
  } catch (error) {
    console.error("Get parent children error:", error);
    return c.json({ success: false, message: "Failed to get children" }, 500);
  }
});

// Add child to parent
parentsRoute.post(
  "/:id/children",
  requirePermission("/security/users"),
  zValidator("json", addParentChildSchema),
  async (c) => {
    try {
      const parentId = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      // Check if parent exists
      const parent = await db.query.parents.findFirst({
        where: eq(parents.id, parentId),
      });

      if (!parent) {
        return c.json({ success: false, message: "Parent not found" }, 404);
      }

      // Check if student exists
      const student = await db.query.students.findFirst({
        where: eq(students.id, data.studentId),
      });

      if (!student) {
        return c.json({ success: false, message: "Student not found" }, 404);
      }

      // Check if relation already exists
      const existing = await db.query.studentParents.findFirst({
        where: and(
          eq(studentParents.studentId, data.studentId),
          eq(studentParents.parentId, parentId)
        ),
      });

      if (existing) {
        return c.json(
          {
            success: false,
            message: "Student is already linked to this parent",
          },
          400
        );
      }

      const result = await db.insert(studentParents).values({
        studentId: data.studentId,
        parentId,
        isPrimary: data.isPrimary || false,
      });

      const newRelation = await db.query.studentParents.findFirst({
        where: eq(studentParents.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Child linked successfully",
        data: newRelation,
      });
    } catch (error) {
      console.error("Add parent child error:", error);
      return c.json({ success: false, message: "Failed to link child" }, 500);
    }
  }
);

// Remove child from parent
parentsRoute.delete(
  "/:id/children/:studentId",
  requirePermission("/security/users"),
  async (c) => {
    try {
      const parentId = parseInt(c.req.param("id"));
      const studentId = parseInt(c.req.param("studentId"));

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
        message: "Child unlinked successfully",
      });
    } catch (error) {
      console.error("Remove parent child error:", error);
      return c.json({ success: false, message: "Failed to unlink child" }, 500);
    }
  }
);

export default parentsRoute;
