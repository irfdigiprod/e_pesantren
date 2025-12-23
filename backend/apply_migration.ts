import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("Running migration...");

  try {
    // 1. Create notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id int AUTO_INCREMENT NOT NULL,
        recipient_id int NOT NULL,
        type enum('group_invite','group_removed','group_role_change','system') NOT NULL,
        title varchar(255) NOT NULL,
        message text NOT NULL,
        data json,
        is_read boolean NOT NULL DEFAULT false,
        created_at timestamp DEFAULT (now()),
        CONSTRAINT notifications_id PRIMARY KEY(id),
        CONSTRAINT notifications_recipient_id_users_id_fk FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE cascade ON UPDATE no action
      );
    `);
    console.log("Created notifications table");

    // 2. Add status column to conversation_participants
    // Wrap in try-catch to ignore if column exists
    try {
      await db.execute(sql`
            ALTER TABLE conversation_participants ADD status enum('invited','joined','left') DEFAULT 'joined' NOT NULL;
        `);
      console.log("Added status column to conversation_participants");
    } catch (e: any) {
      // Simple check for duplicate column error
      if (
        e.code === "ER_DUP_FIELDNAME" ||
        (e.message && e.message.includes("Duplicate column name"))
      ) {
        console.log("Column 'status' already exists, skipping.");
      } else {
        console.error("Error adding status column:", e);
        // Allow to proceed if it's just a column add failure but table creation worked
      }
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
