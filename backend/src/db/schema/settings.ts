import { mysqlTable, varchar, text } from "drizzle-orm/mysql-core";

export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: text("value"),
  description: text("description"),
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
