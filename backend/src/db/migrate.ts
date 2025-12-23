import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "./index";

console.log("Running migrations...");

migrate(db, { migrationsFolder: "./drizzle" })
    .then(() => {
        console.log("Migrations completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Migration failed:", error);
        process.exit(1);
    });
