import { Hono } from "hono";
import webpush from "web-push";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { pushSubscriptions } from "../db/schema/push-subscriptions";
import { authMiddleware } from "../middleware/auth";

const pushRoute = new Hono();

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn("[PUSH] VAPID keys not configured. Web Push will not work.");
}

// Public endpoint to get VAPID public key for frontend
pushRoute.get("/vapid-public-key", (c) => {
  if (!vapidPublicKey) {
    return c.json({ success: false, message: "VAPID not configured" }, 500);
  }
  return c.json({ success: true, data: { publicKey: vapidPublicKey } });
});

// Protected routes require authentication
pushRoute.use("/*", authMiddleware);

// Subscribe to push notifications
pushRoute.post("/subscribe", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return c.json(
        { success: false, message: "Invalid subscription data" },
        400
      );
    }

    // Check if this endpoint already exists for this user
    const existing = await db.query.pushSubscriptions.findFirst({
      where: and(
        eq(pushSubscriptions.userId, user.userId),
        eq(pushSubscriptions.endpoint, endpoint)
      ),
    });

    if (existing) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: c.req.header("user-agent") || null,
        })
        .where(eq(pushSubscriptions.id, existing.id));
    } else {
      // Create new subscription
      await db.insert(pushSubscriptions).values({
        userId: user.userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: c.req.header("user-agent") || null,
      });
    }

    return c.json({ success: true, message: "Subscription saved" });
  } catch (error) {
    console.error("[PUSH] Subscribe error:", error);
    return c.json(
      { success: false, message: "Failed to save subscription" },
      500
    );
  }
});

// Unsubscribe from push notifications
pushRoute.delete("/unsubscribe", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return c.json({ success: false, message: "Endpoint required" }, 400);
    }

    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, user.userId),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );

    return c.json({ success: true, message: "Subscription removed" });
  } catch (error) {
    console.error("[PUSH] Unsubscribe error:", error);
    return c.json(
      { success: false, message: "Failed to remove subscription" },
      500
    );
  }
});

// Helper function to send push notification to a user
export async function sendPushNotification(
  userId: number,
  title: string,
  body: string,
  data: any = {}
) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[PUSH] VAPID not configured, skipping push notification");
    return;
  }

  try {
    // Get all subscriptions for this user
    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
    });

    if (subscriptions.length === 0) {
      return; // No subscriptions, nothing to send
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/iconku.svg",
      badge: "/iconku.svg",
      data: {
        ...data,
        url: data.url || "/", // Default URL to open when notification clicked
      },
    });

    // Send to all subscriptions for this user
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
        } catch (error: any) {
          // If subscription is expired/invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(
              `[PUSH] Removing expired subscription for user ${userId}`
            );
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, sub.id));
          } else {
            throw error;
          }
        }
      })
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.warn(
        `[PUSH] ${failed.length}/${subscriptions.length} push notifications failed`
      );
    }
  } catch (error) {
    console.error("[PUSH] Send notification error:", error);
  }
}

export default pushRoute;
