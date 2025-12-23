// Script to check and create chat tables if they don't exist
import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function checkAndCreateTables() {
  try {
    // Check if message_attachments table exists
    const result = await db.execute(
      sql`SHOW TABLES LIKE 'message_attachments'`
    );
    console.log("message_attachments table check:", result);

    if (result.rows.length === 0) {
      console.log("Creating message_attachments table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS message_attachments (
          id INT PRIMARY KEY AUTO_INCREMENT,
          message_id INT NOT NULL,
          file_type ENUM('image', 'document', 'audio', 'video') NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_size BIGINT NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          width INT,
          height INT,
          thumbnail_path VARCHAR(500),
          duration INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
        )
      `);
      console.log("message_attachments table created!");
    } else {
      console.log("message_attachments table already exists");
    }

    // Also check messages table
    const messagesResult = await db.execute(sql`SHOW TABLES LIKE 'messages'`);
    console.log("messages table check:", messagesResult);
  } catch (error) {
    console.error("Error:", error);
  }

  process.exit(0);
}

checkAndCreateTables();
