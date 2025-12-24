import mysql from "mysql2/promise";

const connectionString = "mysql://root:@localhost:3306"; // Laragon default

async function createDb() {
  try {
    const connection = await mysql.createConnection({
      uri: connectionString,
    });
    await connection.query("CREATE DATABASE IF NOT EXISTS pesantren");
    console.log("Database 'pesantren' created successfully!");
    await connection.end();
  } catch (e) {
    console.error("Error creating database:", e);
    // If access denied, maybe try with 'password' just in case?
    // But usually Laragon is empty.
  }
}

createDb();
