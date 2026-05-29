import {
  mysqlTable,
  int,
  varchar,
  date,
  timestamp,
  boolean,
} from "drizzle-orm/mysql-core";
import { users } from "./users";
import { relations } from "drizzle-orm";

export const savings = mysqlTable("savings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  transferDate: date("transfer_date").notNull(),
  nominal: int("nominal").notNull(),
  receiptPath: varchar("receipt_path", { length: 500 }),
  type: varchar("type", { length: 50 }).notNull().default("deposit"), // 'deposit' | 'withdrawal'
  status: varchar("status", { length: 50 }).notNull().default("pending"), // 'pending' | 'confirmed' | 'rejected'
  description: varchar("description", { length: 500 }),
  confirmedBy: int("confirmed_by").references(() => users.id, { onDelete: "set null" }),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const savingsRelations = relations(savings, ({ one }) => ({
  user: one(users, {
    fields: [savings.userId],
    references: [users.id],
  }),
}));

export type Saving = typeof savings.$inferSelect;
export type NewSaving = typeof savings.$inferInsert;

export const savingsBankAccounts = mysqlTable("savings_bank_accounts", {
  id: int("id").primaryKey().autoincrement(),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  accountName: varchar("account_name", { length: 150 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type SavingsBankAccount = typeof savingsBankAccounts.$inferSelect;
export type NewSavingsBankAccount = typeof savingsBankAccounts.$inferInsert;
