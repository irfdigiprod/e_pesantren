import { Hono } from "hono";
import { db } from "../db";
import { settings } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const app = new Hono();

// Helper to get setting value
async function getSetting(key: string): Promise<string | null> {
  const result = await db.query.settings.findFirst({
    where: eq(settings.key, key),
  });
  return result?.value || null;
}

// Helper to set setting value
async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.query.settings.findFirst({
    where: eq(settings.key, key),
  });
  if (existing) {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}

// GET /active - Get current active academic year & semester
app.get("/active", async (c) => {
  try {
    const activeYear = await getSetting("active_academic_year");
    const activeSemester = await getSetting("active_semester");

    return c.json({
      success: true,
      data: {
        academicYear: activeYear || "2024-2025",
        semester: activeSemester || "1",
      },
    });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// GET /academic-years - List all academic years
app.get("/academic-years", async (c) => {
  try {
    const yearsJson = await getSetting("academic_years");
    const years = yearsJson ? JSON.parse(yearsJson) : [];
    const activeYear = await getSetting("active_academic_year");

    return c.json({
      success: true,
      data: years.map((y: string) => ({
        year: y,
        isActive: y === activeYear,
      })),
    });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// POST /academic-years - Add new academic year
const addYearSchema = z.object({
  year: z.string().regex(/^\d{4}-\d{4}$/, "Format: YYYY-YYYY"),
});

app.post("/academic-years", zValidator("json", addYearSchema), async (c) => {
  try {
    const { year } = c.req.valid("json");
    const yearsJson = await getSetting("academic_years");
    const years: string[] = yearsJson ? JSON.parse(yearsJson) : [];

    if (years.includes(year)) {
      return c.json(
        { success: false, message: "Tahun pelajaran sudah ada" },
        400
      );
    }

    years.push(year);
    years.sort().reverse(); // Newest first
    await setSetting("academic_years", JSON.stringify(years));

    // If this is the first year, set it as active
    if (years.length === 1) {
      await setSetting("active_academic_year", year);
    }

    return c.json({
      success: true,
      message: "Tahun pelajaran berhasil ditambahkan",
    });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// DELETE /academic-years/:year - Delete academic year
app.delete("/academic-years/:year", async (c) => {
  try {
    const yearToDelete = c.req.param("year");
    const yearsJson = await getSetting("academic_years");
    let years: string[] = yearsJson ? JSON.parse(yearsJson) : [];

    years = years.filter((y) => y !== yearToDelete);
    await setSetting("academic_years", JSON.stringify(years));

    // If deleted year was active, set first remaining as active
    const activeYear = await getSetting("active_academic_year");
    if (activeYear === yearToDelete && years.length > 0) {
      await setSetting("active_academic_year", years[0] as string);
    }

    return c.json({
      success: true,
      message: "Tahun pelajaran berhasil dihapus",
    });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// PUT /academic-years/:year/active - Set active academic year
app.put("/academic-years/:year/active", async (c) => {
  try {
    const year = c.req.param("year");
    await setSetting("active_academic_year", year);

    return c.json({
      success: true,
      message: "Tahun pelajaran aktif berhasil diubah",
    });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// GET /semesters - Get semesters with active status
app.get("/semesters", async (c) => {
  try {
    const activeSemester = await getSetting("active_semester");

    return c.json({
      success: true,
      data: [
        {
          id: "1",
          name: "Ganjil",
          isActive: activeSemester === "1" || !activeSemester,
        },
        { id: "2", name: "Genap", isActive: activeSemester === "2" },
      ],
    });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// PUT /semesters/:id/active - Set active semester
app.put("/semesters/:id/active", async (c) => {
  try {
    const semesterId = c.req.param("id");
    if (semesterId !== "1" && semesterId !== "2") {
      return c.json({ success: false, message: "Semester tidak valid" }, 400);
    }

    await setSetting("active_semester", semesterId);

    return c.json({ success: true, message: "Semester aktif berhasil diubah" });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// GET /grading-rules - Get all grading rules
app.get("/grading-rules", async (c) => {
  try {
    const rules = await getSetting("grading_rules");

    // Default Global Rules Template
    const defaultGlobalRules = [
      {
        min: 92,
        max: 100,
        predicate: "A",
        predicateAr: "ممتاز",
        descriptionId: "Sangat Baik",
        descriptionAr: "Mumtaz",
      },
      {
        min: 84,
        max: 91,
        predicate: "B",
        predicateAr: "جيد جدا",
        descriptionId: "Baik",
        descriptionAr: "Jayyid Jiddan",
      },
      {
        min: 75,
        max: 83,
        predicate: "C",
        predicateAr: "جيد",
        descriptionId: "Cukup",
        descriptionAr: "Jayyid",
      },
      {
        min: 0,
        max: 74,
        predicate: "D",
        predicateAr: "مقبول",
        descriptionId: "Kurang",
        descriptionAr: "Maqbul",
      },
    ];

    if (!rules) {
      return c.json({
        success: true,
        data: {
          mode: "SPECIFIC",
          globalRules: defaultGlobalRules,
          specificRules: [], // Empty initially
        },
      });
    }

    const parsed = JSON.parse(rules);

    // Migration: If it's an array (Legacy), wrap it
    if (Array.isArray(parsed)) {
      return c.json({
        success: true,
        data: {
          mode: "SPECIFIC",
          globalRules: defaultGlobalRules,
          specificRules: parsed,
        },
      });
    }

    // Return as is if already new format
    return c.json({
      success: true,
      data: parsed,
    });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// POST /grading-rules - Save grading rules
const ruleSchema = z.object({
  min: z.number().min(0).max(100),
  max: z.number().min(0).max(100),
  predicate: z.string(),
  predicateAr: z.string().optional(),
  descriptionId: z.string(),
  descriptionAr: z.string(),
});

const gradingRulesSchema = z.object({
  mode: z.enum(["SPECIFIC", "GLOBAL"]),
  globalRules: z.array(ruleSchema),
  specificRules: z.array(
    z.object({
      kkm: z.number().min(0).max(100),
      rules: z.array(ruleSchema),
    })
  ),
});

app.post(
  "/grading-rules",
  zValidator("json", gradingRulesSchema),
  async (c) => {
    try {
      const rules = c.req.valid("json");
      await setSetting("grading_rules", JSON.stringify(rules));

      return c.json({
        success: true,
        message: "Aturan penilaian berhasil disimpan",
      });
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 500);
    }
  }
);

// GET /report-header - Get report header settings
app.get("/report-header", async (c) => {
  try {
    const institutionLogo = await getSetting("academic_report_header_logo");
    const principalName = await getSetting("academic_report_principal_name");
    const cityName = await getSetting("academic_report_city_name");

    return c.json({
      success: true,
      data: {
        institutionLogo: institutionLogo || "",
        principalName: principalName || "",
        cityName: cityName || "Purwakarta",
      },
    });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// PUT /report-header - Update report header settings
const reportHeaderSchema = z.object({
  institutionLogo: z.string().optional(),
  principalName: z.string().optional(),
  cityName: z.string().optional(),
});

app.put("/report-header", zValidator("json", reportHeaderSchema), async (c) => {
  try {
    const data = c.req.valid("json");

    if (data.institutionLogo !== undefined) {
      await setSetting("academic_report_header_logo", data.institutionLogo);
    }
    if (data.principalName !== undefined) {
      await setSetting("academic_report_principal_name", data.principalName);
    }
    if (data.cityName !== undefined) {
      await setSetting("academic_report_city_name", data.cityName);
    }

    return c.json({
      success: true,
      message: "Pengaturan header rapor berhasil disimpan",
    });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

export default app;
