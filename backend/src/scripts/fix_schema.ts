import mysql from "mysql2/promise";
// import dotenv from "dotenv";
import path from "path";

// Load env from backend folder
// dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString =
  process.env.DATABASE_URL || "mysql://root:@localhost:3306/pesantren";

console.log("Connecting to:", connectionString);

async function fixSchema() {
  const connection = await mysql.createConnection(connectionString);

  try {
    console.log("Connected to database.");

    // 1. Ensure `salary_grades` table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS salary_grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        daily_attendance_rate DECIMAL(10, 2) DEFAULT 0,
        base_salary DECIMAL(10, 2) DEFAULT 0,
        health_allowance DECIMAL(10, 2) DEFAULT 0,
        teaching_hour_rate DECIMAL(10, 2) DEFAULT 0,
        housing_allowance DECIMAL(10, 2) DEFAULT 0,
        transport_allowance DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    console.log("Ensured salary_grades table.");

    // 2. Ensure `position_allowances` table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS position_allowances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        position VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    console.log("Ensured position_allowances table.");

    // 3. Ensure `divisions` table exists (if referenced)
    // Checking teachers schema again.. yes division_id is there via raw sql
    await connection.query(`
      CREATE TABLE IF NOT EXISTS divisions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    console.log("Ensured divisions table.");

    // 4. Add missing columns to `teachers`
    // We used 'salary_grade_id', 'position_allowance_id', 'division_id'
    const [columns] = await connection.query(`SHOW COLUMNS FROM teachers`);
    const columnNames = (columns as any[]).map((c) => c.Field);

    if (!columnNames.includes("salary_grade_id")) {
      await connection.query(
        `ALTER TABLE teachers ADD COLUMN salary_grade_id INT`
      );
      console.log("Added salary_grade_id to teachers.");
    }
    if (!columnNames.includes("position_allowance_id")) {
      await connection.query(
        `ALTER TABLE teachers ADD COLUMN position_allowance_id INT`
      );
      console.log("Added position_allowance_id to teachers.");
    }
    if (!columnNames.includes("division_id")) {
      await connection.query(`ALTER TABLE teachers ADD COLUMN division_id INT`);
      console.log("Added division_id to teachers.");
    }
    if (!columnNames.includes("teaching_hours")) {
      await connection.query(
        `ALTER TABLE teachers ADD COLUMN teaching_hours INT DEFAULT 0`
      );
      console.log("Added teaching_hours to teachers.");
    }
    if (!columnNames.includes("bank_name")) {
      await connection.query(
        `ALTER TABLE teachers ADD COLUMN bank_name VARCHAR(100)`
      );
      console.log("Added bank_name to teachers.");
    }
    if (!columnNames.includes("bank_code")) {
      await connection.query(
        `ALTER TABLE teachers ADD COLUMN bank_code VARCHAR(20)`
      );
      console.log("Added bank_code to teachers.");
    }
    if (!columnNames.includes("bank_account_number")) {
      await connection.query(
        `ALTER TABLE teachers ADD COLUMN bank_account_number VARCHAR(50)`
      );
      console.log("Added bank_account_number to teachers.");
    }
    if (!columnNames.includes("bank_account_name")) {
      await connection.query(
        `ALTER TABLE teachers ADD COLUMN bank_account_name VARCHAR(255)`
      );
      console.log("Added bank_account_name to teachers.");
    }

    // 5. Ensure `halaqah_group` and `halaqah_members`
    // The error on halaqah status stats implies these might be missing or out of sync
    await connection.query(`
      CREATE TABLE IF NOT EXISTS halaqah_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        schedule VARCHAR(255),
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
     `);
    console.log("Ensured halaqah_groups table.");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS halaqah_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        student_id INT NOT NULL,
        status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
        joined_at DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES halaqah_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
     `);
    console.log("Ensured halaqah_members table.");

    // 6. Ensure related settings for settings page
    await connection.query(`
       CREATE TABLE IF NOT EXISTS settings (
         id INT AUTO_INCREMENT PRIMARY KEY,
         \`key\` VARCHAR(100) NOT NULL UNIQUE,
         value TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
       ) ENGINE=InnoDB;
     `);
    console.log("Ensured settings table.");
  } catch (error) {
    console.error("Migration failed:", error);
    if ((error as any).code === "ER_ACCESS_DENIED_ERROR") {
      console.error("Try checking your database password.");
    }
  } finally {
    await connection.end();
  }
}

fixSchema();
