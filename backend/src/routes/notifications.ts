import { Hono } from "hono";
import { db } from "../db";
import { notifications } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const notificationsRoute = new Hono();

notificationsRoute.use("*", authMiddleware);

// Get all notifications for current user
notificationsRoute.get("/", async (c) => {
  try {
    const user = c.get("user");

    const results = await db.query.notifications.findMany({
      where: eq(notifications.recipientId, user.userId),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });

    return c.json({ success: true, data: results });
  } catch (e) {
    console.error("Get notifications error", e);
    return c.json(
      { success: false, message: "Failed to fetch notifications" },
      500
    );
  }
});

// Mark as read
notificationsRoute.post("/:id/read", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const user = c.get("user");

    // Verify ownership
    const notif = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, id),
        eq(notifications.recipientId, user.userId)
      ),
    });

    if (!notif)
      return c.json({ success: false, message: "Notification not found" }, 404);

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));

    return c.json({ success: true });
  } catch (e) {
    console.error("Mark read error", e);
    return c.json({ success: false, message: "Failed" }, 500);
  }
});

// Respond to invite (example)
notificationsRoute.post("/:id/respond", async (c) => {
  // Parsing body
  const { action } = await c.req.json();
  const id = parseInt(c.req.param("id"));
  // Logic for invite response...
  // For now just mark read
  return c.json({ success: true, message: "Not implemented yet" });
});

// Mark all as read
notificationsRoute.post("/read-all", async (c) => {
  try {
    const user = c.get("user");
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.recipientId, user.userId),
          eq(notifications.isRead, false)
        )
      );
    return c.json({ success: true });
  } catch (e) {
    console.error("Mark all read error", e);
    return c.json({ success: false, message: "Failed" }, 500);
  }
});

export default notificationsRoute;
