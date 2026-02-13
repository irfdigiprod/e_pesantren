import { db } from "./src/db";
import { students } from "./src/db/schema";

async function checkStudentData() {
  try {
    const allStudents = await db.select().from(students);
    console.log("Total students:", allStudents.length);
    if (allStudents.length > 0) {
      console.log("Sample Student Data:");
      allStudents.forEach((s) => {
        console.log({
          id: s.id,
          name: s.fullName,
          nis: s.nis,
          nisn: s.nisn,
          nisSantri: s.nisSantri,
        });
      });
    } else {
      console.log("No students found.");
    }
  } catch (e) {
    console.log("Error checking students:", e);
  }
  process.exit(0);
}

checkStudentData();
