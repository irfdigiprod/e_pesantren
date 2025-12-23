import { Hono } from "hono";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import { notifications } from "../db/schema/notifications";
import { conversationParticipants, conversations } from "../db/schema/chat";
import { authMiddleware } from "../middleware/auth";
import { broadcastToUser, broadcastToGroup } from "../websocket";

const notificationsRoute = new Hono();

// Admin: Delete ALL notifications (no auth required) - TEMPORARY for debugging
notificationsRoute.delete("/clear-all", async (c) => {
  try {
    console.log("=== Clearing ALL notifications from database ===");
    await db.delete(notifications);
    console.log("All notifications cleared successfully");
    return c.json({
      success: true,
      message: "All notifications cleared from database",
    });
  } catch (error) {
    console.error("Clear all notifications error:", error);
    return c.json(
      { success: false, message: "Failed to clear notifications" },
      500
    );
  }
});

notificationsRoute.use("*", authMiddleware);

// Get user notifications (only unread)
notificationsRoute.get("/", async (c) => {
  try {
    const currentUser = c.get("user");

    const userNotifications = await db.query.notifications.findMany({
      where: and(
        eq(notifications.recipientId, currentUser.userId),
        eq(notifications.isRead, false)
      ),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });

    return c.json({
      success: true,
      data: userNotifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return c.json(
      { success: false, message: "Failed to get notifications" },
      500
    );
  }
});

// Mark notification as read
notificationsRoute.post("/:id/read", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const currentUser = c.get("user");

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.recipientId, currentUser.userId)
        )
      );

    return c.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return c.json({ success: false, message: "Failed to mark as read" }, 500);
  }
});

// Delete all notifications for current user
notificationsRoute.delete("/all", async (c) => {
  try {
    const currentUser = c.get("user");

    await db
      .delete(notifications)
      .where(eq(notifications.recipientId, currentUser.userId));

    return c.json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    console.error("Delete all notifications error:", error);
    return c.json(
      { success: false, message: "Failed to delete notifications" },
      500
    );
  }
});

// Admin: Delete ALL notifications from database (no auth filter)
notificationsRoute.delete("/clear-all", async (c) => {
  try {
    console.log("=== Clearing ALL notifications from database ===");
    await db.delete(notifications);
    console.log("All notifications cleared successfully");
    return c.json({
      success: true,
      message: "All notifications cleared from database",
    });
  } catch (error) {
    console.error("Clear all notifications error:", error);
    return c.json(
      { success: false, message: "Failed to clear notifications" },
      500
    );
  }
});

// Respond to invitation (accept/reject)
notificationsRoute.post("/:id/respond", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const { action } = await c.req.json(); // 'accept' or 'reject'
    const currentUser = c.get("user");

    const notification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, id),
        eq(notifications.recipientId, currentUser.userId)
      ),
    });

    if (!notification) {
      return c.json({ success: false, message: "Notification not found" }, 404);
    }

    if (notification.type !== "group_invite") {
      return c.json(
        { success: false, message: "Invalid notification type" },
        400
      );
    }

    // Parse JSON data - handle both string and object formats
    let notificationData = notification.data;

    // Handle double-stringify case: parse until we get an object
    while (typeof notificationData === "string") {
      try {
        notificationData = JSON.parse(notificationData);
      } catch (e) {
        break;
      }
    }

    const conversationId = (notificationData as any)?.conversationId;

    if (!conversationId) {
      return c.json(
        { success: false, message: "Invalid invitation data" },
        400
      );
    }

    if (action === "accept") {
      // Update participant status to joined
      await db
        .update(conversationParticipants)
        .set({ status: "joined" })
        .where(
          and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, currentUser.userId)
          )
        );

      // Mark notification as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id));

      // Notify group members about new member
      const { users } = await import("../db/schema/users");
      const user = await db.query.users.findFirst({
        where: eq(users.id, currentUser.userId),
      });

      broadcastToGroup(conversationId, {
        type: "group_updated",
        data: {
          conversationId,
          type: "member_joined",
          user: {
            id: user?.id,
            name: user?.name,
            email: user?.email,
          },
        },
      });

      // Notify the user themselves (so their list updates)
      broadcastToUser(currentUser.userId, {
        type: "new_conversation",
        data: { conversationId },
      });

      return c.json({ success: true, message: "Invitation accepted" });
    } else if (action === "reject") {
      // Remove participant entry
      await db
        .delete(conversationParticipants)
        .where(
          and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, currentUser.userId)
          )
        );

      // Mark notification as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id));

      return c.json({ success: true, message: "Invitation rejected" });
    } else {
      return c.json({ success: false, message: "Invalid action" }, 400);
    }
  } catch (error) {
    console.error("Respond invitation error:", error);
    return c.json(
      { success: false, message: "Failed to respond to invitation" },
      500
    );
  }
});

export default notificationsRoute;
