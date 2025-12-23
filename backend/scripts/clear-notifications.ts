// Script to clear all notifications from database
import { db } from "./src/db/index.ts";
import { notifications } from "./src/db/schema/notifications.ts";

async function clearNotifications() {
  console.log("Clearing all notifications...");

  try {
    const result = await db.delete(notifications);
    console.log("All notifications cleared successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing notifications:", error);
    process.exit(1);
  }
}

clearNotifications();
