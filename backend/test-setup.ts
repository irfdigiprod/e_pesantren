import { db } from "./src/db";
import { users } from "./src/db/schema/users";

async function main() {
  const allUsers = await db.query.users.findMany();
  console.log("Total users:", allUsers.length);
  const roles = new Set(allUsers.map((u) => u.role));
  console.log("Existing Roles:", Array.from(roles));

  if (roles.has("teacher") || roles.has("staff") || roles.has("student")) {
    const nonAdmin = allUsers.find((u) => u.role !== "admin");
    console.log(
      `Found non-admin user: ID=${nonAdmin?.id}, Email=${nonAdmin?.email}, Role=${nonAdmin?.role}`,
    );
  }
  process.exit(0);
}

main().catch(console.error);
