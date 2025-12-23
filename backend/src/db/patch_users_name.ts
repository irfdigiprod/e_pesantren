import { db } from "./index";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Adding name column to users table...");
    await db.execute(sql`ALTER TABLE users ADD COLUMN name VARCHAR(255)`);
    console.log("Column added successfully.");
  } catch (e: any) {
    if (e.message && e.message.includes("Duplicate column name")) {
      console.log("Column already exists.");
    } else {
      console.error("Migration failed:", e);
    }
  }
}

run();
