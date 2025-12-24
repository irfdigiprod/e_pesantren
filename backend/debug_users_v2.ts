import { db } from "./src/db";
import { users } from "./src/db/schema/users";
import { teachers } from "./src/db/schema/teachers";
import { eq } from "drizzle-orm";

async function main() {
  console.log("--- ADMINS ---");
  const admins = await db.select().from(users).where(eq(users.role, "admin"));
  console.table(
    admins.map((u) => ({ id: u.id, email: u.email, password: "[HIDDEN]" }))
  );

  console.log("\n--- TEACHERS WITHOUT PROFILES ---");
  const allTeachers = await db.select().from(teachers);
  const teacherUsers = await db
    .select()
    .from(users)
    .where(eq(users.role, "teacher"));

  for (const u of teacherUsers) {
    const t = allTeachers.find((t) => t.userId === u.id);
    if (!t) {
      console.log(`User  ${u.email} (ID: ${u.id}) missing profile.`);
    }
  }
  process.exit(0);
}

main();
