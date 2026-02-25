const mysql = require("mysql2/promise");
async function run() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL ||
      "mysql://user:password@127.0.0.1:3306/pesantren",
  );
  const [rows] = await connection.query("SHOW CREATE TABLE tahfidz_deposits");
  console.log(rows[0]["Create Table"]);
  process.exit();
}
run().catch(console.error);
