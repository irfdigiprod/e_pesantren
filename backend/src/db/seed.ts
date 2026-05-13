import { db } from "./index";
import { users } from "./schema";
import { hashPassword } from "../utils/password";

async function seed() {
  console.log("Creating admin user...");

  const hashedPassword = await hashPassword("admin123");

  await db.insert(users).values({
    email: "alamat@pemail.com",
    password: hashedPassword,
    firstName: "Nama",
    lastName: "Panjang",
    phone: "0123456789",
    birthPlace: "Karwawang",
    birthDate: new Date("1996-09-25"),
    gender: "male",
    address: "Alamat lengkap",
    role: "admin",
    isActive: true,
  });

  console.log("✅ Admin user created!");
  console.log("Email: alamat@pemail.com");
  console.log("Password: admin123");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
