import {
  mysqlTable,
  varchar,
  int,
  text,
  date,
  datetime,
  timestamp,
  decimal,
  boolean,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { users } from "./users";

// Pasien Klinik (Unified Table)
export const clinicPatients = mysqlTable("clinic_patients", {
  id: int("id").primaryKey().autoincrement(),
  type: mysqlEnum("type", ["student", "teacher", "external"]).notNull(),
  refId: int("ref_id"), // ID of student or teacher if applicable
  name: varchar("name", { length: 255 }).notNull(),
  gender: mysqlEnum("gender", ["L", "P"]).default("L"),
  dob: date("dob"), // Date of Birth
  birthPlace: varchar("birth_place", { length: 255 }),
  bloodType: varchar("blood_type", { length: 5 }), // A, B, AB, O

  phone: varchar("phone", { length: 20 }),

  // Structured Address
  province: text("province"), // JSON
  regency: text("regency"), // JSON
  district: text("district"), // JSON
  village: text("village"), // JSON
  addressDetail: text("address_detail"),
  postalCode: varchar("postal_code", { length: 10 }),

  // Legacy/Simple address fallback
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Ruangan Klinik (Bed Management)
export const clinicRooms = mysqlTable("clinic_rooms", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Ruang Melati"
  capacity: int("capacity").notNull().default(1),
  gender: mysqlEnum("gender", ["L", "P", "mixed"]).default("mixed"), // L=Male only, P=Female only
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Stok Obat
export const medicines = mysqlTable("medicines", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  genericName: varchar("generic_name", { length: 255 }),
  type: varchar("type", { length: 100 }), // tablet, sirup, kapsul, etc.
  category: varchar("category", { length: 100 }), // antibiotik, analgesik, etc.
  administrationRoute: varchar("administration_route", { length: 255 }), // Injeksi, Obat oral, etc.
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
  // Legacy support or fallback, prefer using clinicPatientId
  patientType: mysqlEnum("patient_type", [
    "student",
    "teacher",
    "external",
  ]).default("student"),
  patientId: int("patient_id"), // Legacy reference

  // New Relations
  clinicPatientId: int("clinic_patient_id").references(() => clinicPatients.id),
  roomId: int("room_id").references(() => clinicRooms.id),

  // Legacy Room display (optional, can sync with roomId)
  roomNumber: varchar("room_number", { length: 50 }),
  bedNumber: varchar("bed_number", { length: 50 }),

  admissionDate: date("admission_date").notNull(),
  admissionTime: varchar("admission_time", { length: 10 }),
  dischargeDate: date("discharge_date"),
  dischargeTime: varchar("discharge_time", { length: 10 }),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  status: mysqlEnum("status", [
    "admitted",
    "discharged",
    "transferred",
  ]).default("admitted"),
  attendingDoctor: varchar("attending_doctor", { length: 255 }),
  notes: text("notes"),
  createdBy: int("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Pemeriksaan Kesehatan
export const healthExaminations = mysqlTable("health_examinations", {
  id: int("id").primaryKey().autoincrement(),
  // Legacy
  patientType: mysqlEnum("patient_type", [
    "student",
    "teacher",
    "external",
  ]).default("student"),
  patientId: int("patient_id"),

  // New Relation
  clinicPatientId: int("clinic_patient_id").references(() => clinicPatients.id),

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
  // Medical History
  historyPastDiseases: text("history_past_diseases"),
  historyFamilyDiseases: text("history_family_diseases"),
  historyAllergies: text("history_allergies"),
  historyCurrentMedications: text("history_current_medications"),
  historyHabits: text("history_habits"),

  // Anamnesis
  anamnesis: text("anamnesis"),

  // Vitals & Physical
  heartRate: int("heart_rate"), // bpm
  respiratoryRate: int("respiratory_rate"), // rpm
  physicalExam: text("physical_exam"),

  // Clinical Data
  labResults: text("lab_results"),
  imagingResults: text("imaging_results"),
  diagnosisCode: varchar("diagnosis_code", { length: 50 }),
  treatmentPlan: text("treatment_plan"),
  progressNotes: text("progress_notes"),
  followUpInstructions: text("follow_up_instructions"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Log penggunaan obat
export const medicineUsages = mysqlTable("medicine_usages", {
  id: int("id").primaryKey().autoincrement(),
  medicineId: int("medicine_id")
    .references(() => medicines.id)
    .notNull(),
  examinationId: int("examination_id").references(() => healthExaminations.id),
  quantity: int("quantity").notNull(),
  notes: text("notes"),
  usedBy: int("used_by").references(() => users.id),
  usedAt: timestamp("used_at").defaultNow(),
});

export type ClinicPatient = typeof clinicPatients.$inferSelect;
export type NewClinicPatient = typeof clinicPatients.$inferInsert;
export type ClinicRoom = typeof clinicRooms.$inferSelect;
export type NewClinicRoom = typeof clinicRooms.$inferInsert;
export type Medicine = typeof medicines.$inferSelect;
export type NewMedicine = typeof medicines.$inferInsert;
export type Inpatient = typeof inpatients.$inferSelect;
export type NewInpatient = typeof inpatients.$inferInsert;
export type HealthExamination = typeof healthExaminations.$inferSelect;
export type NewHealthExamination = typeof healthExaminations.$inferInsert;
export type MedicineUsage = typeof medicineUsages.$inferSelect;
export type NewMedicineUsage = typeof medicineUsages.$inferInsert;
