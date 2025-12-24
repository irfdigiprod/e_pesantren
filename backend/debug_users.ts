import { db } from "./src/db";
import { users } from "./src/db/schema/users";
import { teachers } from "./src/db/schema/teachers";
import { eq } from "drizzle-orm";

async function main() {
  console.log("--- USERS ---");
  const allUsers = await db.select().from(users);
  console.table(
    allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.name,
    }))
  );

  console.log("\n--- TEACHERS ---");
  const allTeachers = await db.select().from(teachers);
  console.table(
    allTeachers.map((t) => ({
      id: t.id,
      userId: t.userId,
      fullName: t.fullName,
      nip: t.nip,
    }))
  );

  console.log("\n--- ORPHAN TEACHER USERS ---");
  const teacherUsers = allUsers.filter((u) => u.role === "teacher");
  for (const u of teacherUsers) {
    const t = allTeachers.find((t) => t.userId === u.id);
    if (!t) {
      console.log(
        `[ORPHAN] User ID ${u.id} (${u.email}) is a teacher but has NO linked teacher profile.`
      );
    } else {
      console.log(
        `[LINKED] User ID ${u.id} (${u.email}) -> Teacher ID ${t.id} (${t.fullName})`
      );
    }
  }
  process.exit(0);
}

main();
