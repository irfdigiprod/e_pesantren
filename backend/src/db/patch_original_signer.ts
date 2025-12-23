import { db } from "./index";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Adding original_signer_id column to messages table...");
    await db.execute(
      sql`ALTER TABLE messages ADD COLUMN original_signer_id INT REFERENCES users(id)`
    );
    console.log("Column added successfully via raw SQL.");
  } catch (e: any) {
    if (e.message && e.message.includes("Duplicate column name")) {
      console.log("Column already exists.");
    } else {
      console.error("Migration failed:", e);
    }
  }
}

run();
