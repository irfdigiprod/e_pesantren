import { mysqlTable, varchar, int, text, date, datetime, timestamp, decimal, boolean, mysqlEnum } from "drizzle-orm/mysql-core";
import { users } from "./users";

// Stok Obat
export const medicines = mysqlTable("medicines", {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 255 }).notNull(),
    genericName: varchar("generic_name", { length: 255 }),
    type: varchar("type", { length: 100 }), // tablet, sirup, kapsul, etc.
    category: varchar("category", { length: 100 }), // antibiotik, analgesik, etc.
    stock: int("stock").notNull().default(0),
    unit: varchar("unit", { length: 50 }).notNull().default("pcs"), // pcs, bottle, box
    minStock: int("min_stock").default(10),
    price: decimal("price", { precision: 10, scale: 2 }).default("0"),
    expiryDate: date("expiry_date"),
    manufacturer: varchar("manufacturer", { length: 255 }),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Rawat Inap
export const inpatients = mysqlTable("inpatients", {
    id: int("id").primaryKey().autoincrement(),
    patientType: mysqlEnum("patient_type", ["student", "teacher"]).notNull(),
    patientId: int("patient_id").notNull(), // references students.id or teachers.id
    roomNumber: varchar("room_number", { length: 50 }),
    bedNumber: varchar("bed_number", { length: 50 }),
    admissionDate: date("admission_date").notNull(),
    admissionTime: varchar("admission_time", { length: 10 }),
    dischargeDate: date("discharge_date"),
    dischargeTime: varchar("discharge_time", { length: 10 }),
    diagnosis: text("diagnosis"),
    treatment: text("treatment"),
    status: mysqlEnum("status", ["admitted", "discharged", "transferred"]).default("admitted"),
    attendingDoctor: varchar("attending_doctor", { length: 255 }),
    notes: text("notes"),
    createdBy: int("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Pemeriksaan Kesehatan
export const healthExaminations = mysqlTable("health_examinations", {
    id: int("id").primaryKey().autoincrement(),
    patientType: mysqlEnum("patient_type", ["student", "teacher"]).notNull(),
    patientId: int("patient_id").notNull(),
    examinationDate: date("examination_date").notNull(),
    examinationTime: varchar("examination_time", { length: 10 }),
    symptoms: text("symptoms"),
    diagnosis: text("diagnosis"),
    treatment: text("treatment"),
    prescribedMedicines: text("prescribed_medicines"), // JSON string of medicines
    bloodPressure: varchar("blood_pressure", { length: 20 }),
    temperature: decimal("temperature", { precision: 4, scale: 1 }),
    weight: decimal("weight", { precision: 5, scale: 2 }),
    height: decimal("height", { precision: 5, scale: 2 }),
    examiner: int("examiner").references(() => users.id),
    isInpatient: boolean("is_inpatient").default(false),
    inpatientId: int("inpatient_id").references(() => inpatients.id),
    followUpDate: date("follow_up_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Log penggunaan obat
export const medicineUsages = mysqlTable("medicine_usages", {
    id: int("id").primaryKey().autoincrement(),
    medicineId: int("medicine_id").references(() => medicines.id).notNull(),
    examinationId: int("examination_id").references(() => healthExaminations.id),
    quantity: int("quantity").notNull(),
    notes: text("notes"),
    usedBy: int("used_by").references(() => users.id),
    usedAt: timestamp("used_at").defaultNow(),
});

export type Medicine = typeof medicines.$inferSelect;
export type NewMedicine = typeof medicines.$inferInsert;
export type Inpatient = typeof inpatients.$inferSelect;
export type NewInpatient = typeof inpatients.$inferInsert;
export type HealthExamination = typeof healthExaminations.$inferSelect;
export type NewHealthExamination = typeof healthExaminations.$inferInsert;
export type MedicineUsage = typeof medicineUsages.$inferSelect;
export type NewMedicineUsage = typeof medicineUsages.$inferInsert;
