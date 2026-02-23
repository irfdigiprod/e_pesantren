import { db } from "./src/db";
import { users } from "./src/db/schema/users";
import { userPermissions, rolePermissions } from "./src/db/schema/permissions";
import { generateToken } from "./src/utils/jwt";
import { eq, and } from "drizzle-orm";

async function main() {
  console.log("--- SETUP TEST USER ---");
  // 1. Create a dummy teacher
  await db.delete(users).where(eq(users.email, "testteacher@pesantren.id"));

  const insertRes = await db.insert(users).values({
    name: "Test Teacher",
    email: "testteacher@pesantren.id",
    password: "hashedpassword", // doesn't matter for token
    role: "teacher",
  });

  const teacherId = Number(insertRes[0].insertId);
  console.log("Created Teacher ID:", teacherId);

  // Create token
  const teacherUser = {
    id: teacherId,
    email: "testteacher@pesantren.id",
    role: "teacher",
  };
  const token = generateToken(teacherUser as any);

  console.log(
    "\n--- TEST SCENARIO 1: NO PERMISSION OVERRIDE (Should allow by default per code) ---",
  );
  let res = await fetch("http://localhost:3000/api/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Testing Room",
      building: "Testing",
      capacity: 5,
    }),
  });
  console.log("POST /api/rooms -> Status:", res.status);

  console.log("\n--- TEST SCENARIO 2: ROLE DENIED ---");
  // Insert role permission denied
  await db
    .insert(rolePermissions)
    .values({ role: "teacher", routePath: "/apps/rooms", isAllowed: false });
  res = await fetch("http://localhost:3000/api/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Testing Room",
      building: "Testing",
      capacity: 5,
    }),
  });
  console.log("POST /api/rooms -> Status:", res.status, "(Expected 403)");

  console.log("\n--- TEST SCENARIO 3: USER ALLOWED (Override Role Denied) ---");
  // Insert user override allowed
  await db
    .insert(userPermissions)
    .values({ userId: teacherId, routePath: "/apps/rooms", isAllowed: true });
  res = await fetch("http://localhost:3000/api/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Testing Room",
      building: "Testing",
      capacity: 5,
    }),
  });
  console.log("POST /api/rooms -> Status:", res.status, "(Expected 200)");

  console.log("\n--- TEST SCENARIO 4: ADMIN BYPASS ---");
  const adminUser = await db.query.users.findFirst({
    where: eq(users.role, "admin"),
  });
  if (adminUser) {
    const adminToken = generateToken(adminUser);
    res = await fetch("http://localhost:3000/api/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Testing Room",
        building: "Testing",
        capacity: 5,
      }),
    });
    console.log("POST /api/rooms -> Status:", res.status, "(Expected 200)");
  }

  // Cleanup
  await db.delete(userPermissions).where(eq(userPermissions.userId, teacherId));
  await db
    .delete(rolePermissions)
    .where(
      and(
        eq(rolePermissions.role, "teacher"),
        eq(rolePermissions.routePath, "/apps/rooms"),
      ),
    );
  await db.delete(users).where(eq(users.id, teacherId));

  process.exit(0);
}

main().catch(console.error);
