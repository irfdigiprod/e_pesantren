import { db } from "../src/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function main() {
  const sqlPath = path.join(
    process.cwd(),
    "drizzle",
    "0006_pretty_toad_men.sql"
  );
  console.log("Reading SQL from:", sqlPath);
  const sqlContent = fs.readFileSync(sqlPath, "utf-8");

  const statements = sqlContent.split("--> statement-breakpoint");

  for (const statement of statements) {
    const trimmed = statement.trim();
    if (trimmed) {
      console.log(
        "Executing:",
        trimmed.substring(0, 50).replace(/\n/g, " ") + "..."
      );
      try {
        await db.execute(sql.raw(trimmed));
        console.log("Success");
      } catch (e: any) {
        if (e.code === "ER_TABLE_EXISTS_ERROR") {
          console.log("Table already exists, skipping...");
        } else {
          console.error("Error executing statement:", e);
        }
      }
    }
  }

  console.log("Manual migration completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
