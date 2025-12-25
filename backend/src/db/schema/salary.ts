import {
  mysqlTable,
  int,
  decimal,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/mysql-core";

// 1. Global Salary Settings
export const salarySettings = mysqlTable("salary_settings", {
  id: int("id").primaryKey().autoincrement(),
  dailyAttendanceRate: decimal("daily_attendance_rate", {
    precision: 15,
    scale: 2,
  }).default("0.00"),
  healthAllowance: decimal("health_allowance", {
    precision: 15,
    scale: 2,
  }).default("0.00"),
  teachingHourRate: decimal("teaching_hour_rate", {
    precision: 15,
    scale: 2,
  }).default("0.00"), // Nominal per jam KBM
  housingAllowance: decimal("housing_allowance", {
    precision: 15,
    scale: 2,
  }).default("0.00"),
  transportAllowance: decimal("transport_allowance", {
    precision: 15,
    scale: 2,
  }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const salaryGrades = mysqlTable("salary_grades", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(), // e.g. "Golongan IA", "Golongan IB"
  dailyAttendanceRate: decimal("daily_attendance_rate", {
    precision: 15,
    scale: 2,
  }).default("0.00"),
  baseSalary: decimal("base_salary", {
    precision: 15,
    scale: 2,
  }).default("0.00"),
  healthAllowance: decimal("health_allowance", {
    precision: 15,
    scale: 2,
  }).default("0.00"),
  teachingHourRate: decimal("teaching_hour_rate", {
    precision: 15,
    scale: 2,
  }).default("0.00"),
  housingAllowance: decimal("housing_allowance", {
    precision: 15,
    scale: 2,
  }).default("0.00"),
  transportAllowance: decimal("transport_allowance", {
    precision: 15,
    scale: 2,
  }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 2. Position Allowances (Jabatan)
export const positionAllowances = mysqlTable("position_allowances", {
  id: int("id").primaryKey().autoincrement(),
  position: varchar("position", { length: 255 }).notNull(), // e.g., "Kepala Aliyah", "Wali Kelas"
  amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 3. Tenure Allowances (Masa Kerja)
export const tenureAllowances = mysqlTable("tenure_allowances", {
  id: int("id").primaryKey().autoincrement(),
  minYears: int("min_years").notNull(),
  maxYears: int("max_years").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 4. Custom Allowances
export const customAllowances = mysqlTable("custom_allowances", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type SalarySettings = typeof salarySettings.$inferSelect;
export type NewSalarySettings = typeof salarySettings.$inferInsert;

export type SalaryGrade = typeof salaryGrades.$inferSelect;
export type NewSalaryGrade = typeof salaryGrades.$inferInsert;

export type PositionAllowance = typeof positionAllowances.$inferSelect;
export type NewPositionAllowance = typeof positionAllowances.$inferInsert;

export type TenureAllowance = typeof tenureAllowances.$inferSelect;
export type NewTenureAllowance = typeof tenureAllowances.$inferInsert;

export type CustomAllowance = typeof customAllowances.$inferSelect;
export type NewCustomAllowance = typeof customAllowances.$inferInsert;
