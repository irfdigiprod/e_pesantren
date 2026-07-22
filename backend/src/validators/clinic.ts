import { z } from "zod";

// Medicine validators
export const createMedicineSchema = z.object({
    pharmacyId: z.number().nullable().optional(),
    name: z.string().min(1, "Name is required"),
    genericName: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    administrationRoute: z.string().optional(),
    stock: z.number().min(0).default(0),
    unit: z.string().default("pcs"),
    minStock: z.number().min(0).optional(),
    price: z.number().min(0).optional(),
    expiryDate: z.string().optional(),
    manufacturer: z.string().optional(),
    description: z.string().optional(),
});

export const updateMedicineSchema = z.object({
    pharmacyId: z.number().nullable().optional(),
    name: z.string().min(1).optional(),
    genericName: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    administrationRoute: z.string().optional(),
    stock: z.number().min(0).optional(),
    unit: z.string().optional(),
    minStock: z.number().min(0).optional(),
    price: z.number().min(0).optional(),
    expiryDate: z.string().optional(),
    manufacturer: z.string().optional(),
    description: z.string().optional(),
});

// Pharmacy validators
export const createPharmacySchema = z.object({
    name: z.string().min(1, "Nama apotik wajib diisi"),
    description: z.string().optional(),
});

export const updatePharmacySchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
});

export const adjustStockSchema = z.object({
    quantity: z.number(),
    reason: z.string().optional(),
});

// Inpatient validators
export const createInpatientSchema = z.object({
    patientType: z.enum(["student", "teacher"]),
    patientId: z.number().min(1, "Patient ID is required"),
    roomNumber: z.string().optional(),
    bedNumber: z.string().optional(),
    admissionDate: z.string().min(1, "Admission date is required"),
    admissionTime: z.string().optional(),
    diagnosis: z.string().optional(),
    treatment: z.string().optional(),
    attendingDoctor: z.string().optional(),
    notes: z.string().optional(),
});

export const updateInpatientSchema = z.object({
    roomNumber: z.string().optional(),
    bedNumber: z.string().optional(),
    diagnosis: z.string().optional(),
    treatment: z.string().optional(),
    attendingDoctor: z.string().optional(),
    notes: z.string().optional(),
});

export const dischargePatientSchema = z.object({
    dischargeDate: z.string().optional(),
    dischargeTime: z.string().optional(),
    notes: z.string().optional(),
});

// Health examination validators
export const createExaminationSchema = z.object({
    patientType: z.enum(["student", "teacher"]),
    patientId: z.number().min(1, "Patient ID is required"),
    examinationDate: z.string().min(1, "Examination date is required"),
    examinationTime: z.string().optional(),
    symptoms: z.string().optional(),
    diagnosis: z.string().optional(),
    treatment: z.string().optional(),
    prescribedMedicines: z.string().optional(), // JSON string
    bloodPressure: z.string().optional(),
    temperature: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    isInpatient: z.boolean().optional(),
    inpatientId: z.number().optional(),
    followUpDate: z.string().optional(),
    notes: z.string().optional(),
});

export const updateExaminationSchema = z.object({
    symptoms: z.string().optional(),
    diagnosis: z.string().optional(),
    treatment: z.string().optional(),
    prescribedMedicines: z.string().optional(),
    bloodPressure: z.string().optional(),
    temperature: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    followUpDate: z.string().optional(),
    notes: z.string().optional(),
});

export type CreateMedicineInput = z.infer<typeof createMedicineSchema>;
export type UpdateMedicineInput = z.infer<typeof updateMedicineSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type CreateInpatientInput = z.infer<typeof createInpatientSchema>;
export type UpdateInpatientInput = z.infer<typeof updateInpatientSchema>;
export type DischargePatientInput = z.infer<typeof dischargePatientSchema>;
export type CreateExaminationInput = z.infer<typeof createExaminationSchema>;
export type UpdateExaminationInput = z.infer<typeof updateExaminationSchema>;
export type CreatePharmacyInput = z.infer<typeof createPharmacySchema>;
export type UpdatePharmacyInput = z.infer<typeof updatePharmacySchema>;
