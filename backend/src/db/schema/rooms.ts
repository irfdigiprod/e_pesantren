import {
  mysqlTable,
  varchar,
  int,
  text,
  timestamp,
  mysqlEnum,
  unique,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { students } from "./students";
import { teachers } from "./teachers";

// Rooms - Main room table (asrama/kamar)
export const rooms = mysqlTable("rooms", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Kamar Al-Fatihah", "Kamar 101"
  building: varchar("building", { length: 255 }), // e.g., "Gedung A", "Asrama Putra"
  floor: varchar("floor", { length: 50 }), // e.g., "Lantai 1", "Lt. 2"
  capacity: int("capacity"), // Maximum students
  description: text("description"),
  status: mysqlEnum("status", ["active", "maintenance", "inactive"]).default(
    "active"
  ),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Room Supervisors - Many-to-many: teachers <-> rooms (guru pembimbing kamar)
export const roomSupervisors = mysqlTable(
  "room_supervisors",
  {
    id: int("id").primaryKey().autoincrement(),
    roomId: int("room_id")
      .notNull()
      .references(() => rooms.id),
    teacherId: int("teacher_id")
      .notNull()
      .references(() => teachers.id),
    role: mysqlEnum("role", ["lead", "assistant"]).default("assistant"), // Pembimbing utama atau pembantu
    assignedAt: timestamp("assigned_at").defaultNow(),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uniqueSupervisor: unique().on(table.roomId, table.teacherId),
  })
);

// Relations
export const roomsRelations = relations(rooms, ({ many }) => ({
  supervisors: many(roomSupervisors),
}));

export const roomSupervisorsRelations = relations(
  roomSupervisors,
  ({ one }) => ({
    room: one(rooms, {
      fields: [roomSupervisors.roomId],
      references: [rooms.id],
    }),
    teacher: one(teachers, {
      fields: [roomSupervisors.teacherId],
      references: [teachers.id],
    }),
  })
);

// Types
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type RoomSupervisor = typeof roomSupervisors.$inferSelect;
export type NewRoomSupervisor = typeof roomSupervisors.$inferInsert;
