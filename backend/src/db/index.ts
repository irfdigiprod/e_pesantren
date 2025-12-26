import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL || "mysql://root:password@localhost:3306/pesantren";

// Create MySQL connection pool
const pool = mysql.createPool({
  uri: connectionString,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
});

export const db = drizzle(pool, { schema, mode: "default" });

export default db;
