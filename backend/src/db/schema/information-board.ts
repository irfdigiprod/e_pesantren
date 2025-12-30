import {
  mysqlTable,
  serial,
  varchar,
  timestamp,
  int,
} from "drizzle-orm/mysql-core";

export const informationBoard = mysqlTable("information_board", {
  id: serial("id").primaryKey(),
  imageUrl: varchar("image_url", { length: 255 }).notNull(),
  order: int("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
