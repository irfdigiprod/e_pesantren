import type { Context, Next } from "hono";
import { verifyToken, type JWTPayload } from "../utils/jwt";

// Extend Hono's context to include user
declare module "hono" {
    interface ContextVariableMap {
        user: JWTPayload;
    }
}

/**
 * Middleware untuk memverifikasi JWT token
 */
export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json(
            {
                success: false,
                message: "Authorization header missing or invalid"
            },
            401
        );
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    if (!payload) {
        return c.json(
            {
                success: false,
                message: "Invalid or expired token"
            },
            401
        );
    }

    // Set user in context for use in routes
    c.set("user", payload);

    await next();
}

/**
 * Middleware untuk role-based access control
 */
export function requireRole(...allowedRoles: string[]) {
    return async (c: Context, next: Next) => {
        const user = c.get("user");

        if (!user) {
            return c.json(
                {
                    success: false,
                    message: "Unauthorized"
                },
                401
            );
        }

        if (!allowedRoles.includes(user.role)) {
            return c.json(
                {
                    success: false,
                    message: "Forbidden: Insufficient permissions"
                },
                403
            );
        }

        await next();
    };
}
