import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { sql, inArray } from "drizzle-orm";
import { db } from "../db";
import { settings } from "../db/schema";
import { authMiddleware, requireRole } from "../middleware/auth";
import { updateSettingsSchema } from "../validators/settings";

const settingsRoute = new Hono();

settingsRoute.use("*", authMiddleware);

// Get all settings (or filter by queries if needed in future)
settingsRoute.get("/", async (c) => {
  try {
    const keys = c.req.query("keys"); // Optional comma-separated keys

    let result;
    if (keys) {
      const keyList = keys.split(",");
      result = await db.query.settings.findMany({
        where: inArray(settings.key, keyList),
      });
    } else {
      result = await db.query.settings.findMany();
    }

    // Convert array to object for easier frontend consumption
    const settingsMap = result.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, any>);

    return c.json({
      success: true,
      data: settingsMap,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return c.json({ success: false, message: "Failed to fetch settings" }, 500);
  }
});

// Update settings
settingsRoute.put(
  "/",
  requireRole("admin"),
  zValidator("json", updateSettingsSchema),
  async (c) => {
    try {
      const { settings: newSettings } = c.req.valid("json");

      for (const item of newSettings) {
        await db
          .insert(settings)
          .values({
            key: item.key,
            value: item.value,
          })
          .onDuplicateKeyUpdate({ set: { value: item.value } });
      }

      return c.json({
        success: true,
        message: "Settings updated successfully",
      });
    } catch (error) {
      console.error("Update settings error:", error);
      return c.json(
        { success: false, message: "Failed to update settings" },
        500
      );
    }
  }
);

export default settingsRoute;
