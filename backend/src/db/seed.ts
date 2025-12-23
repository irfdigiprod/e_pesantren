import { db } from "./index";
import { users } from "./schema";
import { hashPassword } from "../utils/password";

async function seed() {
  console.log("Creating admin user...");

  const hashedPassword = await hashPassword("admin123");

  await db.insert(users).values({
    email: "admin@pesantren.id",
    password: hashedPassword,
    firstName: "Admin",
    lastName: "Sedunia",
    phone: "085609340567",
    birthPlace: "Karwawang",
    birthDate: new Date("1996-09-25"),
    gender: "male",
    address: "Dusun Bolang RT 004 RW 001 Desa Bolang",
    role: "admin",
    isActive: true,
  });

  console.log("✅ Admin user created!");
  console.log("Email: admin@pesantren.id");
  console.log("Password: admin123");

  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
