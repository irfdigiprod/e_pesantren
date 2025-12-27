import mysql from "mysql2/promise";

const connectionString =
  process.env.DATABASE_URL || "mysql://root:@localhost:3306/pesantren";

console.log("Connecting to:", connectionString);

async function migrate() {
  const connection = await mysql.createConnection(connectionString);

  try {
    console.log("Connected to database.");

    // 1. Add start position columns
    const newColumns = [
      { name: "start_surah", type: "INT" },
      { name: "start_ayat", type: "INT" },
      { name: "start_page", type: "INT" },
      { name: "end_surah", type: "INT" },
      { name: "end_ayat", type: "INT" },
      { name: "end_page", type: "INT" },
      { name: "total_lines", type: "INT" },
      { name: "total_pages", type: "DECIMAL(5,2)" },
    ];

    for (const col of newColumns) {
      try {
        await connection.query(`
          ALTER TABLE tahfidz_deposits ADD COLUMN ${col.name} ${col.type}
        `);
        console.log(`Added ${col.name} column.`);
      } catch (e: any) {
        if (e.code === "ER_DUP_FIELDNAME") {
          console.log(`${col.name} column already exists.`);
        } else {
          throw e;
        }
      }
    }

    // 2. Remove default target levels (user will create their own)
    try {
      await connection.query(`DELETE FROM tahfidz_targets`);
      console.log("Cleared default target levels.");
    } catch (e: any) {
      console.log("Could not clear targets:", e.message);
    }

    console.log("\n✓ Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await connection.end();
  }
}

migrate();
