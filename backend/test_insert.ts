import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { tahfidzDeposits } from "./src/db/schema/tahfidz";

async function run() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL ||
      "mysql://user:password@127.0.0.1:3306/pesantren",
  );
  const db = drizzle(connection);
  try {
    await db.insert(tahfidzDeposits).values({
      studentId: 3,
      teacherId: 1179,
      type: "ziyadah",
      isLate: false,
      startSurah: 2,
      startAyat: 11,
      startPage: 3,
      endSurah: 2,
      endAyat: 18,
      endPage: 3,
      totalLines: 113,
      totalPages: String(2.47),
      fluency: "lancar",
      notes: "tes",
      depositDate: new Date(),
    });
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
