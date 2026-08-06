import {
  mysqlTable,
  varchar,
  int,
  text,
  date,
  timestamp,
  boolean,
  json,
  mysqlEnum,
  unique,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { students } from "./students";
import { rooms } from "./rooms";
import { classes, reports } from "./academic";

// Global audit trail for important data changes.
// Keep action/entity fields flexible because audited entities span many modules.
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").primaryKey().autoincrement(),
  actorUserId: int("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 191 }),
  action: varchar("action", { length: 50 }).notNull(),
  beforeJson: json("before_json"),
  afterJson: json("after_json"),
  reason: text("reason"),
  requestId: varchar("request_id", { length: 191 }),
  ipAddress: varchar("ip_address", { length: 100 }),
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Canonical academic period registry for semester/year locking and reporting.
export const academicPeriods = mysqlTable(
  "academic_periods",
  {
    id: int("id").primaryKey().autoincrement(),
    academicYear: varchar("academic_year", { length: 20 }).notNull(),
    semester: int("semester").notNull(),
    startDate: date("start_date"),
    endDate: date("end_date"),
    status: mysqlEnum("status", ["draft", "active", "locked", "archived"])
      .notNull()
      .default("draft"),
    lockedAt: timestamp("locked_at"),
    lockedBy: int("locked_by").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdBy: int("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    academicPeriodUnique: unique().on(table.academicYear, table.semester),
  })
);

// Historical student lifecycle/status records.
export const studentStatusHistory = mysqlTable("student_status_history", {
  id: int("id").primaryKey().autoincrement(),
  studentId: int("student_id")
    .references(() => students.id)
    .notNull(),
  status: mysqlEnum("status", [
    "active",
    "inactive",
    "graduated",
    "transferred",
    "dropped",
    "alumni",
    "leave",
  ]).notNull(),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
  isCurrent: boolean("is_current").default(true),
  reason: text("reason"),
  documentPath: varchar("document_path", { length: 500 }),
  createdBy: int("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Historical student room/asrama assignment records.
export const studentRoomHistory = mysqlTable("student_room_history", {
  id: int("id").primaryKey().autoincrement(),
  studentId: int("student_id")
    .references(() => students.id)
    .notNull(),
  roomId: int("room_id").references(() => rooms.id),
  bedLabel: varchar("bed_label", { length: 100 }),
  academicYear: varchar("academic_year", { length: 20 }),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
  isCurrent: boolean("is_current").default(true),
  reason: text("reason"),
  createdBy: int("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Immutable-ish report snapshot registry. Used to freeze published report payloads.
export const reportSnapshots = mysqlTable("report_snapshots", {
  id: int("id").primaryKey().autoincrement(),
  studentId: int("student_id")
    .references(() => students.id)
    .notNull(),
  classId: int("class_id").references(() => classes.id),
  reportId: int("report_id").references(() => reports.id),
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  semester: int("semester").notNull(),
  reportType: mysqlEnum("report_type", ["academic", "tahfidz", "combined"])
    .notNull()
    .default("academic"),
  status: mysqlEnum("status", [
    "draft",
    "published",
    "revised",
    "archived",
  ])
    .notNull()
    .default("draft"),
  finalPayloadJson: json("final_payload_json"),
  pdfPath: varchar("pdf_path", { length: 500 }),
  publishedBy: int("published_by").references(() => users.id, {
    onDelete: "set null",
  }),
  publishedAt: timestamp("published_at"),
  lockedAt: timestamp("locked_at"),
  revisionOf: int("revision_of"),
  revisionReason: text("revision_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
}));

export const academicPeriodsRelations = relations(academicPeriods, ({ one }) => ({
  locker: one(users, {
    fields: [academicPeriods.lockedBy],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [academicPeriods.createdBy],
    references: [users.id],
  }),
}));

export const studentStatusHistoryRelations = relations(
  studentStatusHistory,
  ({ one }) => ({
    student: one(students, {
      fields: [studentStatusHistory.studentId],
      references: [students.id],
    }),
    creator: one(users, {
      fields: [studentStatusHistory.createdBy],
      references: [users.id],
    }),
  })
);

export const studentRoomHistoryRelations = relations(
  studentRoomHistory,
  ({ one }) => ({
    student: one(students, {
      fields: [studentRoomHistory.studentId],
      references: [students.id],
    }),
    room: one(rooms, {
      fields: [studentRoomHistory.roomId],
      references: [rooms.id],
    }),
    creator: one(users, {
      fields: [studentRoomHistory.createdBy],
      references: [users.id],
    }),
  })
);

export const reportSnapshotsRelations = relations(reportSnapshots, ({ one }) => ({
  student: one(students, {
    fields: [reportSnapshots.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [reportSnapshots.classId],
    references: [classes.id],
  }),
  report: one(reports, {
    fields: [reportSnapshots.reportId],
    references: [reports.id],
  }),
  publisher: one(users, {
    fields: [reportSnapshots.publishedBy],
    references: [users.id],
  }),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type AcademicPeriod = typeof academicPeriods.$inferSelect;
export type NewAcademicPeriod = typeof academicPeriods.$inferInsert;
export type StudentStatusHistory = typeof studentStatusHistory.$inferSelect;
export type NewStudentStatusHistory = typeof studentStatusHistory.$inferInsert;
export type StudentRoomHistory = typeof studentRoomHistory.$inferSelect;
export type NewStudentRoomHistory = typeof studentRoomHistory.$inferInsert;
export type ReportSnapshot = typeof reportSnapshots.$inferSelect;
export type NewReportSnapshot = typeof reportSnapshots.$inferInsert;
