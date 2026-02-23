import fs from "fs";
import path from "path";

const ROUTES_DIR = path.join(__dirname, "src", "routes");

const FILE_MAPPINGS = {
  "academic.ts": "/apps/academic/classes", // We might need to refine this later
  "attendance.ts": "/apps/attendance",
  "clinic.ts": "/apps/clinic/dashboard", // General clinic for now
  "divisions.ts": "/apps/divisions",
  "halaqah.ts": "/apps/halaqah",
  "information-board.ts": "/settings/information-board",
  "parents.ts": "/security/users", // Assuming parents are managed here
  "permissions.ts": "/security/roles",
  "punishments.ts": "/apps/rewards/reports",
  "rewards.ts": "/apps/rewards/entry",
  "roles.ts": "/security/roles",
  "rooms.ts": "/apps/rooms",
  "rules.ts": "/apps/rewards/rules",
  "salary-grades.ts": "/settings/salary-grading",
  "salary-report.ts": "/apps/salary-report",
  "salary.ts": "/apps/salary",
  "settings.ts": "/settings/institution",
  "students.ts": "/apps/students",
  "tahfidz.ts": "/apps/tahfidz/dashboard",
  "teachers.ts": "/apps/teachers", // Also covers teacher-attendance maybe, we'll see
  "users.ts": "/security/users",
  "warnings.ts": "/apps/rewards/warnings",
};

// Files that need more granular mapping base on the string path inside them
// We will just apply a generic regex to replace `requireRole(...)` -> `requirePermission('PATH')`
// But we also need to update the import statement

function processFiles() {
  const files = fs.readdirSync(ROUTES_DIR).filter((f) => f.endsWith(".ts"));

  for (const file of files) {
    if (!FILE_MAPPINGS[file]) continue;

    const filePath = path.join(ROUTES_DIR, file);
    let content = fs.readFileSync(filePath, "utf-8");

    const mappedPath = FILE_MAPPINGS[file];

    // 1. Ensure requirePermission is imported
    if (!content.includes("requirePermission")) {
      content = content.replace(
        /import \{([^}]*)requireRole([^}]*)\} from ("|')\.\.\/middleware\/auth("|');?/,
        (match, p1, p2, quote1, quote2) => {
          return `import {${p1}requirePermission${p2}} from ${quote1}../middleware/auth${quote2};`;
        },
      );
    }

    // 2. Replace requireRole("...") with requirePermission(mappedPath)
    // Matches requireRole("admin"), requireRole("admin", "staff"), etc.
    const requireRoleRegex = /requireRole\([^)]+\)/g;

    // We only replace if we actually had matches
    if (requireRoleRegex.test(content)) {
      content = content.replace(
        requireRoleRegex,
        `requirePermission("${mappedPath}")`,
      );
      fs.writeFileSync(filePath, content, "utf-8");
      console.log(`Updated ${file} -> mapped to ${mappedPath}`);
    }
  }
}

processFiles();
