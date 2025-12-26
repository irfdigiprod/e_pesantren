import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

/**
 * CORS Configuration untuk mendukung akses lintas port dan external URL
 *
 * Konfigurasi ini memungkinkan frontend dari host yang berbeda mengakses API
 */
export const corsConfig = (): MiddlewareHandler => {
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : [];

  return cors({
    // Jika CORS_ORIGINS kosong, izinkan semua origin
    // Force permissive CORS for development
    origin: (origin) => {
      // Always allow and echo back the origin to support credentials + any IP
      return origin || "*";
    },

    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 86400, // 24 hours
    credentials: true,
  });
};
