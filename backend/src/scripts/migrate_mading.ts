import mysql from "mysql2/promise";

const connectionString =
  process.env.DATABASE_URL || "mysql://root:@localhost:3306/pesantren";

console.log("Connecting to:", connectionString);

async function migrate() {
  const connection = await mysql.createConnection(connectionString);

  try {
    console.log("Connected to database.");

    // 1. Add is_late column to tahfidz_deposits
    try {
      await connection.query(`
        ALTER TABLE tahfidz_deposits ADD COLUMN is_late BOOLEAN DEFAULT FALSE
      `);
      console.log("Added is_late column to tahfidz_deposits.");
    } catch (e: any) {
      if (e.code === "ER_DUP_FIELDNAME") {
        console.log("is_late column already exists.");
      } else {
        throw e;
      }
    }

    // 2. Add page_number column to tahfidz_deposits
    try {
      await connection.query(`
        ALTER TABLE tahfidz_deposits ADD COLUMN page_number INT
      `);
      console.log("Added page_number column to tahfidz_deposits.");
    } catch (e: any) {
      if (e.code === "ER_DUP_FIELDNAME") {
        console.log("page_number column already exists.");
      } else {
        throw e;
      }
    }

    // 3. Update type enum to include 'sakit'
    // Note: MySQL requires recreating the column for enum changes
    try {
      await connection.query(`
        ALTER TABLE tahfidz_deposits MODIFY COLUMN type ENUM('ziyadah', 'murajaah', 'izin', 'alpha', 'sakit') NOT NULL
      `);
      console.log("Updated type enum to include 'sakit'.");
    } catch (e: any) {
      console.log("Error updating type enum:", e.message);
    }

    // 4. Create tahfidz_targets table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tahfidz_targets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        level VARCHAR(50) NOT NULL UNIQUE,
        target_pages INT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
    console.log("Created tahfidz_targets table.");

    // 5. Insert default target levels
    await connection.query(`
      INSERT IGNORE INTO tahfidz_targets (level, target_pages, description) VALUES
        ('SD', 4, 'Target untuk siswa SD: 4 halaman per bulan'),
        ('SMP', 6, 'Target untuk siswa SMP: 6 halaman per bulan'),
        ('SMA', 8, 'Target untuk siswa SMA: 8 halaman per bulan'),
        ('Tahfidz', 12, 'Target untuk program Tahfidz khusus: 12 halaman per bulan')
    `);
    console.log("Inserted default target levels.");

    console.log("\n✓ Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await connection.end();
  }
}

migrate();
