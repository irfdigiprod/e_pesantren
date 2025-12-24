import { db } from "../db";
import { notifications } from "../db/schema/notifications";
import { broadcastToUser } from "../websocket";
import { eq } from "drizzle-orm";

export async function createNotification(
  recipientId: number,
  type: string,
  title: string,
  message: string,
  data: any = null
) {
  try {
    // 1. Insert into DB
    const result = await db.insert(notifications).values({
      recipientId,
      type,
      title,
      message,
      data,
      isRead: false,
    });

    const notificationId = Number(result[0].insertId);

    // 2. Prepare payload for WebSocket
    const notificationPayload = {
      id: notificationId,
      recipientId,
      type,
      title,
      message,
      data,
      isRead: false,
      createdAt: new Date().toISOString(),
      itemType: "system", // Frontend expects this for generic system notifications
      notifType: type, // Frontend expects this for specific icon handling
    };

    // 3. Broadcast to user

    broadcastToUser(recipientId, {
      type: "new_notification",
      data: notificationPayload,
    });

    return notificationPayload;
  } catch (error) {
    console.error("[NOTIF] Failed to create notification:", error);
    return null; // Don't crash the request if notification fails
  }
}

export async function notifyAdmins(
  type: string,
  title: string,
  message: string,
  data: any = null
) {
  try {
    // Find all admins
    const admins = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.role, "admin"),
    });

    for (const admin of admins) {
      await createNotification(admin.id, type, title, message, data);
    }
  } catch (error) {
    console.error("[NOTIF] Failed to notify admins:", error);
  }
}
