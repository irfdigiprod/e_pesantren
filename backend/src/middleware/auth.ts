import type { Context, Next } from "hono";
import { verifyToken, type JWTPayload } from "../utils/jwt";
import { db } from "../db";
import { rolePermissions, userPermissions } from "../db/schema/permissions";
import { eq, and } from "drizzle-orm";

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
        message: "Authorization header missing or invalid",
      },
      401,
    );
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return c.json({ success: false, message: "Invalid token format" }, 401);
  }
  const payload = verifyToken(token);

  if (!payload) {
    return c.json(
      {
        success: false,
        message: "Invalid or expired token",
      },
      401,
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
          message: "Unauthorized",
        },
        401,
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          success: false,
          message: "Forbidden: Insufficient permissions",
        },
        403,
      );
    }

    await next();
  };
}

/**
 * Middleware untuk role-based and user-based dynamic access control
 */
export function requirePermission(routePath: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          success: false,
          message: "Unauthorized",
        },
        401,
      );
    }

    const PROTECTED_ADMIN_ROUTES = ["/security/users", "/security/roles"];
    if (user.role === "admin" && PROTECTED_ADMIN_ROUTES.includes(routePath)) {
      await next();
      return;
    }

    try {
      // Check user specific permissions first (override)
      const userPerm = await db.query.userPermissions.findFirst({
        where: and(
          eq(userPermissions.userId, user.userId),
          eq(userPermissions.routePath, routePath),
        ),
      });

      if (userPerm) {
        if (!userPerm.isAllowed) {
          return c.json(
            {
              success: false,
              message: "Forbidden: Akses ditolak oleh pengaturan user",
            },
            403,
          );
        }
        await next();
        return;
      }

      // Check role permissions
      const rolePerm = await db.query.rolePermissions.findFirst({
        where: and(
          eq(rolePermissions.role, user.role as any),
          eq(rolePermissions.routePath, routePath),
        ),
      });

      if (rolePerm && !rolePerm.isAllowed) {
        return c.json(
          {
            success: false,
            message: "Forbidden: Akses ditolak oleh pengaturan role",
          },
          403,
        );
      }

      // Default behavior is allowed if no explicit record exists
      await next();
    } catch (error) {
      console.error("Permission check error:", error);
      return c.json(
        {
          success: false,
          message: "Internal server error during permission check",
        },
        500,
      );
    }
  };
}
