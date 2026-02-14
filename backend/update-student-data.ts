import { db } from "./src/db";
import { students } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function updateStudentData() {
  try {
    // Update the first student found
    const allStudents = await db.select().from(students).limit(1);

    if (allStudents.length > 0) {
      const student = allStudents[0]!;
      console.log(`Updating student ID ${student.id} (${student.fullName})...`);

      await db
        .update(students)
        .set({
          nisn: "0012345678",
          nisSantri: "S-2024-001",
        })
        .where(eq(students.id, student.id));

      console.log("Update successful!");

      // Verify
      const updated = await db.query.students.findFirst({
        where: eq(students.id, student.id),
      });
      if (!updated) {
        console.log("Could not find updated student.");
        process.exit(1);
      }
      console.log("Updated data:", {
        nis: updated.nis,
        nisn: updated.nisn,
        nisSantri: updated.nisSantri,
      });
    } else {
      console.log("No students to update.");
    }
  } catch (e) {
    console.log("Error updating student:", e);
  }
  process.exit(0);
}

updateStudentData();
