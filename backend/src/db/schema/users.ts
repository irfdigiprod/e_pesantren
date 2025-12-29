import {
  mysqlTable,
  varchar,
  int,
  boolean,
  timestamp,
  mysqlEnum,
  date,
  text,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  role: mysqlEnum("role", [
    "admin",
    "teacher",
    "student",
    "parent",
    "staff",
    "clinic",
  ])
    .notNull()
    .default("student"),
  isActive: boolean("is_active").notNull().default(true),

  // Profile fields
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  gender: mysqlEnum("gender", ["male", "female"]),
  birthPlace: varchar("birth_place", { length: 255 }),
  birthDate: date("birth_date"),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  // Detailed address fields
  province: text("province"), // JSON: { code, name }
  regency: text("regency"), // JSON: { code, name }
  district: text("district"), // JSON: { code, name }
  village: text("village"), // JSON: { code, name }
  addressDetail: text("address_detail"),
  postalCode: varchar("postal_code", { length: 10 }),
  photo: varchar("photo", { length: 500 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
