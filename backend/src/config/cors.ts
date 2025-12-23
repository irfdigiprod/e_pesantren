import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

/**
 * CORS Configuration untuk mendukung akses lintas port dan external URL
 * 
 * Konfigurasi ini memungkinkan frontend dari host yang berbeda mengakses API
 */
export const corsConfig = (): MiddlewareHandler => {
    const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map(origin => origin.trim())
        : [];

    return cors({
        // Jika CORS_ORIGINS kosong, izinkan semua origin
        origin: allowedOrigins.length > 0
            ? (origin) => {
                // Allow requests with no origin (like mobile apps or curl)
                if (!origin) return "*";

                // Check if origin is in allowed list
                if (allowedOrigins.includes(origin)) return origin;

                // Check for wildcard patterns
                for (const allowed of allowedOrigins) {
                    if (allowed === "*") return origin;
                    if (allowed.includes("*")) {
                        const pattern = new RegExp("^" + allowed.replace(/\*/g, ".*") + "$");
                        if (pattern.test(origin)) return origin;
                    }
                }

                return null; // Not allowed
            }
            : "*", // Allow all origins if CORS_ORIGINS is empty

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
