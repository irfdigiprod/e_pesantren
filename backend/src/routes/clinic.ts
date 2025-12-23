import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  medicines,
  inpatients,
  healthExaminations,
  medicineUsages,
} from "../db/schema/clinic";
import { authMiddleware, requireRole } from "../middleware/auth";
import {
  createMedicineSchema,
  updateMedicineSchema,
  adjustStockSchema,
  createInpatientSchema,
  updateInpatientSchema,
  dischargePatientSchema,
  createExaminationSchema,
  updateExaminationSchema,
} from "../validators/clinic";

const clinicRoute = new Hono();

// Apply auth to all routes
clinicRoute.use("*", authMiddleware);

// ============ MEDICINES ============

// Get all medicines
clinicRoute.get("/medicines", async (c) => {
  try {
    const allMedicines = await db.query.medicines.findMany();

    // Add low stock warning
    const medicinesWithWarning = allMedicines.map((med) => ({
      ...med,
      isLowStock: med.stock <= (med.minStock || 10),
    }));

    return c.json({
      success: true,
      data: medicinesWithWarning,
    });
  } catch (error) {
    console.error("Get medicines error:", error);
    return c.json({ success: false, message: "Failed to get medicines" }, 500);
  }
});

// Get medicine by ID
clinicRoute.get("/medicines/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const medicine = await db.query.medicines.findFirst({
      where: eq(medicines.id, id),
    });

    if (!medicine) {
      return c.json({ success: false, message: "Medicine not found" }, 404);
    }

    return c.json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    console.error("Get medicine error:", error);
    return c.json({ success: false, message: "Failed to get medicine" }, 500);
  }
});

// Create medicine
clinicRoute.post(
  "/medicines",
  requireRole("admin", "clinic", "staff"),
  zValidator("json", createMedicineSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const result = await db.insert(medicines).values({
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      });

      const newMedicine = await db.query.medicines.findFirst({
        where: eq(medicines.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Medicine added successfully",
        data: newMedicine,
      });
    } catch (error) {
      console.error("Create medicine error:", error);
      return c.json({ success: false, message: "Failed to add medicine" }, 500);
    }
  }
);

// Update medicine
clinicRoute.put(
  "/medicines/:id",
  requireRole("admin", "clinic", "staff"),
  zValidator("json", updateMedicineSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.medicines.findFirst({
        where: eq(medicines.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Medicine not found" }, 404);
      }

      await db
        .update(medicines)
        .set({
          ...data,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        })
        .where(eq(medicines.id, id));

      const updated = await db.query.medicines.findFirst({
        where: eq(medicines.id, id),
      });

      return c.json({
        success: true,
        message: "Medicine updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update medicine error:", error);
      return c.json(
        { success: false, message: "Failed to update medicine" },
        500
      );
    }
  }
);

// Adjust stock
clinicRoute.post(
  "/medicines/:id/adjust-stock",
  requireRole("admin", "clinic", "staff"),
  zValidator("json", adjustStockSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const { quantity, reason } = c.req.valid("json");

      const existing = await db.query.medicines.findFirst({
        where: eq(medicines.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Medicine not found" }, 404);
      }

      const newStock = existing.stock + quantity;
      if (newStock < 0) {
        return c.json({ success: false, message: "Insufficient stock" }, 400);
      }

      await db
        .update(medicines)
        .set({
          stock: newStock,
        })
        .where(eq(medicines.id, id));

      const updated = await db.query.medicines.findFirst({
        where: eq(medicines.id, id),
      });

      return c.json({
        success: true,
        message: "Stock adjusted successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Adjust stock error:", error);
      return c.json({ success: false, message: "Failed to adjust stock" }, 500);
    }
  }
);

// Delete medicine
clinicRoute.delete("/medicines/:id", requireRole("admin"), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const existing = await db.query.medicines.findFirst({
      where: eq(medicines.id, id),
    });

    if (!existing) {
      return c.json({ success: false, message: "Medicine not found" }, 404);
    }

    await db.delete(medicines).where(eq(medicines.id, id));

    return c.json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    console.error("Delete medicine error:", error);
    return c.json(
      { success: false, message: "Failed to delete medicine" },
      500
    );
  }
});

// ============ INPATIENTS ============

// Get all inpatients
clinicRoute.get("/inpatients", async (c) => {
  try {
    const status = c.req.query("status");

    const allInpatients = status
      ? await db.query.inpatients.findMany({
          where: eq(inpatients.status, status as any),
        })
      : await db.query.inpatients.findMany();

    return c.json({
      success: true,
      data: allInpatients,
    });
  } catch (error) {
    console.error("Get inpatients error:", error);
    return c.json({ success: false, message: "Failed to get inpatients" }, 500);
  }
});

// Get inpatient by ID
clinicRoute.get("/inpatients/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const inpatient = await db.query.inpatients.findFirst({
      where: eq(inpatients.id, id),
    });

    if (!inpatient) {
      return c.json({ success: false, message: "Inpatient not found" }, 404);
    }

    return c.json({
      success: true,
      data: inpatient,
    });
  } catch (error) {
    console.error("Get inpatient error:", error);
    return c.json({ success: false, message: "Failed to get inpatient" }, 500);
  }
});

// Admit patient
clinicRoute.post(
  "/inpatients",
  requireRole("admin", "clinic", "staff"),
  zValidator("json", createInpatientSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const user = c.get("user");

      const result = await db.insert(inpatients).values({
        patientType: data.patientType,
        patientId: data.patientId,
        roomNumber: data.roomNumber,
        bedNumber: data.bedNumber,
        diagnosis: data.diagnosis,
        admissionDate: data.admissionDate
          ? new Date(data.admissionDate)
          : new Date(),
        admissionTime: data.admissionTime,
        notes: data.notes,
        status: "admitted",
        createdBy: user.userId,
      });

      const newInpatient = await db.query.inpatients.findFirst({
        where: eq(inpatients.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Patient admitted successfully",
        data: newInpatient,
      });
    } catch (error) {
      console.error("Admit patient error:", error);
      return c.json(
        { success: false, message: "Failed to admit patient" },
        500
      );
    }
  }
);

// Update inpatient
clinicRoute.put(
  "/inpatients/:id",
  requireRole("admin", "clinic", "staff"),
  zValidator("json", updateInpatientSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.inpatients.findFirst({
        where: eq(inpatients.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Inpatient not found" }, 404);
      }

      await db
        .update(inpatients)
        .set({
          ...data,
        })
        .where(eq(inpatients.id, id));

      const updated = await db.query.inpatients.findFirst({
        where: eq(inpatients.id, id),
      });

      return c.json({
        success: true,
        message: "Inpatient updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update inpatient error:", error);
      return c.json(
        { success: false, message: "Failed to update inpatient" },
        500
      );
    }
  }
);

// Discharge patient
clinicRoute.put(
  "/inpatients/:id/discharge",
  requireRole("admin", "clinic", "staff"),
  zValidator("json", dischargePatientSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.inpatients.findFirst({
        where: eq(inpatients.id, id),
      });

      if (!existing) {
        return c.json({ success: false, message: "Inpatient not found" }, 404);
      }

      if (existing.status === "discharged") {
        return c.json(
          { success: false, message: "Patient already discharged" },
          400
        );
      }

      const today = new Date();
      const currentTime = new Date().toTimeString().split(" ")[0];

      await db
        .update(inpatients)
        .set({
          status: "discharged",
          dischargeDate: data.dischargeDate
            ? new Date(data.dischargeDate)
            : today,
          dischargeTime: data.dischargeTime || currentTime,
          notes: data.notes || existing.notes,
        })
        .where(eq(inpatients.id, id));

      const updated = await db.query.inpatients.findFirst({
        where: eq(inpatients.id, id),
      });

      return c.json({
        success: true,
        message: "Patient discharged successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Discharge patient error:", error);
      return c.json(
        { success: false, message: "Failed to discharge patient" },
        500
      );
    }
  }
);

// ============ HEALTH EXAMINATIONS ============

// Get all examinations
clinicRoute.get("/examinations", async (c) => {
  try {
    const patientType = c.req.query("patientType");
    const patientId = c.req.query("patientId");

    let examinations;
    if (patientType && patientId) {
      examinations = await db.query.healthExaminations.findMany({
        where: eq(healthExaminations.patientId, parseInt(patientId)),
      });
      examinations = examinations.filter((e) => e.patientType === patientType);
    } else {
      examinations = await db.query.healthExaminations.findMany();
    }

    return c.json({
      success: true,
      data: examinations,
    });
  } catch (error) {
    console.error("Get examinations error:", error);
    return c.json(
      { success: false, message: "Failed to get examinations" },
      500
    );
  }
});

// Get examination by ID
clinicRoute.get("/examinations/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const examination = await db.query.healthExaminations.findFirst({
      where: eq(healthExaminations.id, id),
    });

    if (!examination) {
      return c.json({ success: false, message: "Examination not found" }, 404);
    }

    return c.json({
      success: true,
      data: examination,
    });
  } catch (error) {
    console.error("Get examination error:", error);
    return c.json(
      { success: false, message: "Failed to get examination" },
      500
    );
  }
});

// Create examination
clinicRoute.post(
  "/examinations",
  requireRole("admin", "clinic", "staff"),
  zValidator("json", createExaminationSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const user = c.get("user");

      const result = await db.insert(healthExaminations).values({
        patientType: data.patientType,
        patientId: data.patientId,
        examinationDate: data.examinationDate
          ? new Date(data.examinationDate)
          : new Date(),
        examinationType: data.examinationType,
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        prescription: data.prescription,
        notes: data.notes,
        weight: data.weight,
        height: data.height,
        bloodPressure: data.bloodPressure,
        temperature: data.temperature,
        examiner: user.userId,
      });

      const newExamination = await db.query.healthExaminations.findFirst({
        where: eq(healthExaminations.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Examination recorded successfully",
        data: newExamination,
      });
    } catch (error) {
      console.error("Create examination error:", error);
      return c.json(
        { success: false, message: "Failed to record examination" },
        500
      );
    }
  }
);

// Update examination
clinicRoute.put(
  "/examinations/:id",
  requireRole("admin", "clinic", "staff"),
  zValidator("json", updateExaminationSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const existing = await db.query.healthExaminations.findFirst({
        where: eq(healthExaminations.id, id),
      });

      if (!existing) {
        return c.json(
          { success: false, message: "Examination not found" },
          404
        );
      }

      await db
        .update(healthExaminations)
        .set({
          ...data,
          examinationDate: data.examinationDate
            ? new Date(data.examinationDate)
            : undefined,
        })
        .where(eq(healthExaminations.id, id));

      const updated = await db.query.healthExaminations.findFirst({
        where: eq(healthExaminations.id, id),
      });

      return c.json({
        success: true,
        message: "Examination updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update examination error:", error);
      return c.json(
        { success: false, message: "Failed to update examination" },
        500
      );
    }
  }
);

// Delete examination
clinicRoute.delete(
  "/examinations/:id",
  requireRole("admin", "clinic"),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));

      const existing = await db.query.healthExaminations.findFirst({
        where: eq(healthExaminations.id, id),
      });

      if (!existing) {
        return c.json(
          { success: false, message: "Examination not found" },
          404
        );
      }

      await db.delete(healthExaminations).where(eq(healthExaminations.id, id));

      return c.json({
        success: true,
        message: "Examination deleted successfully",
      });
    } catch (error) {
      console.error("Delete examination error:", error);
      return c.json(
        { success: false, message: "Failed to delete examination" },
        500
      );
    }
  }
);

export default clinicRoute;
