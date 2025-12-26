import { Hono } from "hono";
// Force reload 1
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { corsConfig } from "./config/cors";
import {
  authRoute,
  studentsRoute,
  parentsRoute,
  teachersRoute,
  quranRoute,
  attendanceRoute,
  rewardsRoute,
  punishmentsRoute,
  clinicRoute,
  academicRoute,
  halaqahRoute,
  roomsRoute,
  chatRoute,
  uploadsRoute,
  utilsRoute,
  usersRoute,
  notificationsRoute,
  divisionsRoute,
  settingsRoute,
  permissionsRoute,
  salaryRoute,
  salaryReportRoute,
  salaryGradesRoute,
  tahfidzRoute,
} from "./routes";

import {
  websocketHandlers,
  authenticateWebSocket,
  type WebSocketData,
} from "./websocket";

const app = new Hono();

// Global Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", corsConfig());

// Health check
app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Sistem Informasi Manajemen Pesantren API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      students: "/api/students",
      parents: "/api/parents",
      teachers: "/api/teachers",
      quran: "/api/quran",
      attendance: "/api/attendance",
      rewards: "/api/rewards",
      punishments: "/api/punishments",
      clinic: "/api/clinic",
      academic: "/api/academic",
      halaqah: "/api/halaqah",
      rooms: "/api/rooms",
      chat: "/api/chat",
      uploads: "/api/uploads",
      utils: "/api/utils",
      divisions: "/api/divisions",
      websocket: "/ws",
    },
  });
});

// API Health check
app.get("/api/health", (c) => {
  return c.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Register routes
app.route("/api/auth", authRoute);
app.route("/api/students", studentsRoute);
app.route("/api/parents", parentsRoute);
app.route("/api/teachers", teachersRoute);
app.route("/api/quran", quranRoute);
app.route("/api/attendance", attendanceRoute);
app.route("/api/rewards", rewardsRoute);
app.route("/api/punishments", punishmentsRoute);
app.route("/api/clinic", clinicRoute);
app.route("/api/academic", academicRoute);
app.route("/api/halaqah", halaqahRoute);
app.route("/api/rooms", roomsRoute);
app.route("/api/chat", chatRoute);
app.route("/api/uploads", uploadsRoute);
app.route("/api/utils", utilsRoute);
app.route("/api/users", usersRoute);
app.route("/api/notifications", notificationsRoute);
app.route("/api/divisions", divisionsRoute);
app.route("/api/settings", settingsRoute);
app.route("/api/permissions", permissionsRoute);
app.route("/api/salary", salaryRoute);
app.route("/api/salary/reports", salaryReportRoute);
app.route("/api/salary-grades", salaryGradesRoute);
app.route("/api/tahfidz", tahfidzRoute);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "Endpoint not found",
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json(
    {
      success: false,
      message: err.message || "Internal server error",
    },
    500
  );
});

// Start server with WebSocket support
const port = parseInt(process.env.PORT || "3000");

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     Sistem Informasi Manajemen Pesantren - REST API           ║
╠═══════════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${port}                      ║
║  WebSocket endpoint: ws://localhost:${port}/ws                   ║
║  CORS enabled for cross-origin requests                       ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Single Bun.serve instance for both HTTP and WebSocket
const server = Bun.serve<WebSocketData>({
  port,
  hostname: "0.0.0.0", // Listen on all network interfaces
  fetch(req, server) {
    const url = new URL(req.url);

    // Handle WebSocket upgrade for /ws path
    if (url.pathname === "/ws") {
      const wsData = authenticateWebSocket(req.url, req.headers);

      if (!wsData) {
        return new Response("Unauthorized", { status: 401 });
      }

      const success = server.upgrade(req, { data: wsData });
      if (success) {
        return undefined; // Return nothing on successful upgrade
      }
      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    // Handle regular HTTP requests through Hono
    return app.fetch(req);
  },
  websocket: {
    open(ws) {
      websocketHandlers.open(ws as any);
    },
    message(ws, message) {
      websocketHandlers.message(ws as any, message);
    },
    close(ws) {
      websocketHandlers.close(ws as any);
    },
  },
});

console.log(`Server started on port ${server.port}`);
