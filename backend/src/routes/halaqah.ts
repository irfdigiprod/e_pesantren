import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import {
  halaqahGroups,
  halaqahMembers,
  halaqahMentors,
} from "../db/schema/halaqah";
import { students } from "../db/schema/students";
import { teachers } from "../db/schema/teachers";
import { authMiddleware, requireRole } from "../middleware/auth";
import {
  createHalaqahSchema,
  updateHalaqahSchema,
  addMemberSchema,
  updateMemberSchema,
  addMentorSchema,
  updateMentorSchema,
} from "../validators/halaqah";

const halaqahRoute = new Hono();

// Apply auth to all routes
halaqahRoute.use("*", authMiddleware);

// ============ HALAQAH GROUPS ============

// Get all halaqah groups
halaqahRoute.get("/", async (c) => {
  try {
    const status = c.req.query("status");

    let groups;
    if (status) {
      groups = await db.query.halaqahGroups.findMany({
        where: eq(halaqahGroups.status, status as any),
      });
    } else {
      groups = await db.query.halaqahGroups.findMany();
    }

    return c.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Get halaqah groups error:", error);
    return c.json(
      { success: false, message: "Failed to get halaqah groups" },
      500
    );
  }
});

// Get halaqah by ID with members and mentors
halaqahRoute.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const halaqah = await db.query.halaqahGroups.findFirst({
      where: eq(halaqahGroups.id, id),
    });

    if (!halaqah) {
      return c.json({ success: false, message: "Halaqah not found" }, 404);
    }

    // Get members
    const members = await db.query.halaqahMembers.findMany({
      where: eq(halaqahMembers.halaqahId, id),
    });

    // Get mentors
    const mentors = await db.query.halaqahMentors.findMany({
      where: eq(halaqahMentors.halaqahId, id),
    });

    return c.json({
      success: true,
      data: {
        ...halaqah,
        members,
        mentors,
      },
    });
  } catch (error) {
    console.error("Get halaqah error:", error);
    return c.json({ success: false, message: "Failed to get halaqah" }, 500);
  }
});

// Create halaqah group
halaqahRoute.post(
  "/",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", createHalaqahSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const result = await db.insert(halaqahGroups).values(data);

      const newHalaqah = await db.query.halaqahGroups.findFirst({
        where: eq(halaqahGroups.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Halaqah group created successfully",
        data: newHalaqah,
      });
    } catch (error) {
      console.error("Create halaqah error:", error);
      return c.json(
        { success: false, message: "Failed to create halaqah group" },
        500
      );
    }
  }
);

// Update halaqah group
halaqahRoute.put(
  "/:id",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", updateHalaqahSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.halaqahGroups.findFirst({
        where: eq(halaqahGroups.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Halaqah not found" }, 404);
      }

      await db.update(halaqahGroups).set(data).where(eq(halaqahGroups.id, id));

      const updated = await db.query.halaqahGroups.findFirst({
        where: eq(halaqahGroups.id, id),
      });

      return c.json({
        success: true,
        message: "Halaqah updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update halaqah error:", error);
      return c.json(
        { success: false, message: "Failed to update halaqah" },
        500
      );
    }
  }
);

// Delete halaqah group
halaqahRoute.delete("/:id", requireRole("admin"), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const existing = await db.query.halaqahGroups.findFirst({
      where: eq(halaqahGroups.id, id),
    });

    if (!existing) {
      return c.json({ success: false, message: "Halaqah not found" }, 404);
    }

    // Delete related members and mentors first
    await db.delete(halaqahMembers).where(eq(halaqahMembers.halaqahId, id));
    await db.delete(halaqahMentors).where(eq(halaqahMentors.halaqahId, id));
    await db.delete(halaqahGroups).where(eq(halaqahGroups.id, id));

    return c.json({
      success: true,
      message: "Halaqah deleted successfully",
    });
  } catch (error) {
    console.error("Delete halaqah error:", error);
    return c.json({ success: false, message: "Failed to delete halaqah" }, 500);
  }
});

// ============ HALAQAH MEMBERS ============

// Get members of halaqah
halaqahRoute.get("/:id/members", async (c) => {
  try {
    const halaqahId = parseInt(c.req.param("id"));

    const members = await db.query.halaqahMembers.findMany({
      where: eq(halaqahMembers.halaqahId, halaqahId),
    });

    // Get student details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const student = await db.query.students.findFirst({
          where: eq(students.id, member.studentId),
        });
        return {
          ...member,
          student,
        };
      })
    );

    return c.json({
      success: true,
      data: membersWithDetails,
    });
  } catch (error) {
    console.error("Get halaqah members error:", error);
    return c.json({ success: false, message: "Failed to get members" }, 500);
  }
});

// Add member to halaqah
halaqahRoute.post(
  "/:id/members",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", addMemberSchema),
  async (c) => {
    try {
      const halaqahId = parseInt(c.req.param("id"));
      const data = c.req.valid("json");
      const force = data.force === true;

      // Check if halaqah exists
      const halaqah = await db.query.halaqahGroups.findFirst({
        where: eq(halaqahGroups.id, halaqahId),
      });

      if (!halaqah) {
        return c.json({ success: false, message: "Halaqah not found" }, 404);
      }

      // Check if student exists
      const student = await db.query.students.findFirst({
        where: eq(students.id, data.studentId),
      });

      if (!student) {
        return c.json({ success: false, message: "Student not found" }, 404);
      }

      // Check if already member of THIS halaqah
      const existingInSame = await db.query.halaqahMembers.findFirst({
        where: and(
          eq(halaqahMembers.halaqahId, halaqahId),
          eq(halaqahMembers.studentId, data.studentId)
        ),
      });

      if (existingInSame) {
        return c.json(
          {
            success: false,
            message: "Santri sudah menjadi anggota halaqah ini",
          },
          400
        );
      }

      // Check if student is in ANY OTHER halaqah
      const existingInOther = await db.query.halaqahMembers.findFirst({
        where: eq(halaqahMembers.studentId, data.studentId),
      });

      if (existingInOther && !force) {
        // Get the other halaqah name
        const otherHalaqah = await db.query.halaqahGroups.findFirst({
          where: eq(halaqahGroups.id, existingInOther.halaqahId),
        });

        return c.json({
          success: false,
          message: `Santri sudah terdaftar di halaqah "${
            otherHalaqah?.name || "lain"
          }"`,
          requiresConfirm: true,
          existingHalaqah: {
            id: existingInOther.halaqahId,
            name: otherHalaqah?.name || "Halaqah Lain",
          },
        });
      }

      // If force=true, remove from other halaqah first
      if (existingInOther && force) {
        await db
          .delete(halaqahMembers)
          .where(eq(halaqahMembers.id, existingInOther.id));
      }

      const result = await db.insert(halaqahMembers).values({
        halaqahId,
        studentId: data.studentId,
        joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
        status: data.status || "active",
      });

      const newMember = await db.query.halaqahMembers.findFirst({
        where: eq(halaqahMembers.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: force
          ? "Santri berhasil dipindahkan ke halaqah ini"
          : "Anggota berhasil ditambahkan",
        data: newMember,
      });
    } catch (error) {
      console.error("Add halaqah member error:", error);
      return c.json(
        { success: false, message: "Gagal menambahkan anggota" },
        500
      );
    }
  }
);

// Update member status
halaqahRoute.put(
  "/:id/members/:studentId",
  requireRole("admin", "teacher", "staff"),
  zValidator("json", updateMemberSchema),
  async (c) => {
    try {
      const halaqahId = parseInt(c.req.param("id"));
      const studentId = parseInt(c.req.param("studentId"));
      const data = c.req.valid("json");

      const member = await db.query.halaqahMembers.findFirst({
        where: and(
          eq(halaqahMembers.halaqahId, halaqahId),
          eq(halaqahMembers.studentId, studentId)
        ),
      });

      if (!member) {
        return c.json({ success: false, message: "Member not found" }, 404);
      }

      await db
        .update(halaqahMembers)
        .set({
          ...data,
          joinedAt: data.joinedAt ? new Date(data.joinedAt) : undefined,
        })
        .where(eq(halaqahMembers.id, member.id));

      const updated = await db.query.halaqahMembers.findFirst({
        where: eq(halaqahMembers.id, member.id),
      });

      return c.json({
        success: true,
        message: "Member updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update halaqah member error:", error);
      return c.json(
        { success: false, message: "Failed to update member" },
        500
      );
    }
  }
);

// Remove member from halaqah
halaqahRoute.delete(
  "/:id/members/:studentId",
  requireRole("admin", "teacher"),
  async (c) => {
    try {
      const halaqahId = parseInt(c.req.param("id"));
      const studentId = parseInt(c.req.param("studentId"));

      const member = await db.query.halaqahMembers.findFirst({
        where: and(
          eq(halaqahMembers.halaqahId, halaqahId),
          eq(halaqahMembers.studentId, studentId)
        ),
      });

      if (!member) {
        return c.json({ success: false, message: "Member not found" }, 404);
      }

      await db.delete(halaqahMembers).where(eq(halaqahMembers.id, member.id));

      return c.json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      console.error("Remove halaqah member error:", error);
      return c.json(
        { success: false, message: "Failed to remove member" },
        500
      );
    }
  }
);

// ============ HALAQAH MENTORS ============

// Get mentors of halaqah
halaqahRoute.get("/:id/mentors", async (c) => {
  try {
    const halaqahId = parseInt(c.req.param("id"));

    const mentors = await db.query.halaqahMentors.findMany({
      where: eq(halaqahMentors.halaqahId, halaqahId),
    });

    // Get teacher details for each mentor
    const mentorsWithDetails = await Promise.all(
      mentors.map(async (mentor) => {
        const teacher = await db.query.teachers.findFirst({
          where: eq(teachers.id, mentor.teacherId),
        });
        return {
          ...mentor,
          teacher,
        };
      })
    );

    return c.json({
      success: true,
      data: mentorsWithDetails,
    });
  } catch (error) {
    console.error("Get halaqah mentors error:", error);
    return c.json({ success: false, message: "Failed to get mentors" }, 500);
  }
});

// Add mentor to halaqah
halaqahRoute.post(
  "/:id/mentors",
  requireRole("admin", "staff"),
  zValidator("json", addMentorSchema),
  async (c) => {
    try {
      const halaqahId = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      // Check if halaqah exists
      const halaqah = await db.query.halaqahGroups.findFirst({
        where: eq(halaqahGroups.id, halaqahId),
      });

      if (!halaqah) {
        return c.json({ success: false, message: "Halaqah not found" }, 404);
      }

      // Check if teacher exists
      const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.id, data.teacherId),
      });

      if (!teacher) {
        return c.json({ success: false, message: "Teacher not found" }, 404);
      }

      // Check if already mentor
      const existing = await db.query.halaqahMentors.findFirst({
        where: and(
          eq(halaqahMentors.halaqahId, halaqahId),
          eq(halaqahMentors.teacherId, data.teacherId)
        ),
      });

      if (existing) {
        return c.json(
          { success: false, message: "Teacher is already a mentor" },
          400
        );
      }

      const result = await db.insert(halaqahMentors).values({
        halaqahId,
        teacherId: data.teacherId,
        role: data.role || "assistant",
        assignedAt: data.assignedAt ? new Date(data.assignedAt) : new Date(),
        status: data.status || "active",
      });

      const newMentor = await db.query.halaqahMentors.findFirst({
        where: eq(halaqahMentors.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Mentor added successfully",
        data: newMentor,
      });
    } catch (error) {
      console.error("Add halaqah mentor error:", error);
      return c.json({ success: false, message: "Failed to add mentor" }, 500);
    }
  }
);

// Update mentor role
halaqahRoute.put(
  "/:id/mentors/:teacherId",
  requireRole("admin", "staff"),
  zValidator("json", updateMentorSchema),
  async (c) => {
    try {
      const halaqahId = parseInt(c.req.param("id"));
      const teacherId = parseInt(c.req.param("teacherId"));
      const data = c.req.valid("json");

      const mentor = await db.query.halaqahMentors.findFirst({
        where: and(
          eq(halaqahMentors.halaqahId, halaqahId),
          eq(halaqahMentors.teacherId, teacherId)
        ),
      });

      if (!mentor) {
        return c.json({ success: false, message: "Mentor not found" }, 404);
      }

      await db
        .update(halaqahMentors)
        .set({
          ...data,
          assignedAt: data.assignedAt ? new Date(data.assignedAt) : undefined,
        })
        .where(eq(halaqahMentors.id, mentor.id));

      const updated = await db.query.halaqahMentors.findFirst({
        where: eq(halaqahMentors.id, mentor.id),
      });

      return c.json({
        success: true,
        message: "Mentor updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update halaqah mentor error:", error);
      return c.json(
        { success: false, message: "Failed to update mentor" },
        500
      );
    }
  }
);

// Remove mentor from halaqah
halaqahRoute.delete(
  "/:id/mentors/:teacherId",
  requireRole("admin"),
  async (c) => {
    try {
      const halaqahId = parseInt(c.req.param("id"));
      const teacherId = parseInt(c.req.param("teacherId"));

      const mentor = await db.query.halaqahMentors.findFirst({
        where: and(
          eq(halaqahMentors.halaqahId, halaqahId),
          eq(halaqahMentors.teacherId, teacherId)
        ),
      });

      if (!mentor) {
        return c.json({ success: false, message: "Mentor not found" }, 404);
      }

      await db.delete(halaqahMentors).where(eq(halaqahMentors.id, mentor.id));

      return c.json({
        success: true,
        message: "Mentor removed successfully",
      });
    } catch (error) {
      console.error("Remove halaqah mentor error:", error);
      return c.json(
        { success: false, message: "Failed to remove mentor" },
        500
      );
    }
  }
);

export default halaqahRoute;
