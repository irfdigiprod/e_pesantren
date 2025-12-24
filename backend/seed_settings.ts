import { db } from "./src/db";
import { settings } from "./src/db/schema/settings";
import { sql } from "drizzle-orm";

async function seedSettings() {
  console.log("Seeding settings...");

  const defaultSettings = [
    {
      key: "attendance_latitude",
      value: "-6.175392",
      description: "Latitude pusat lokasi absensi (Default: Monas)",
    },
    {
      key: "attendance_longitude",
      value: "106.827153",
      description: "Longitude pusat lokasi absensi (Default: Monas)",
    },
    {
      key: "attendance_radius",
      value: "100",
      description: "Radius absensi dalam meter",
    },
  ];

  for (const setting of defaultSettings) {
    await db
      .insert(settings)
      .values(setting)
      .onDuplicateKeyUpdate({ set: { value: sql`value` } }); // Don't overwrite if exists
  }

  console.log("Settings seeded successfully.");
  process.exit(0);
}

seedSettings().catch((err) => {
  console.error("Error seeding settings:", err);
  process.exit(1);
});
