import mysql from "mysql2/promise";

const connectionString =
  process.env.DATABASE_URL || "mysql://root:password@localhost:3306/pesantren";

console.log("Connecting to database with Bun...");
console.log("DB URL:", connectionString.replace(/:[^:@]*@/, ":****@")); // Hide password in logs

async function run() {
  const connection = await mysql.createConnection(connectionString);

  try {
    console.log("Adding is_signed column to messages table...");
    await connection.query(`
      ALTER TABLE messages 
      ADD COLUMN is_signed BOOLEAN NOT NULL DEFAULT FALSE
    `);
    console.log("Success: is_signed column added.");
  } catch (e: any) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("Column is_signed already exists. Skipping.");
    } else {
      console.error("Error adding column:", e);
      process.exit(1);
    }
  } finally {
    await connection.end();
  }
}

run();
