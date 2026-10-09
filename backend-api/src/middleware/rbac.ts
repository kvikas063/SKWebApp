import { Context, Next } from "hono";
import type { SessionUser } from "../lib/auth.js";

export function rbacMiddleware(allowedRoles: SessionUser["role"][]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as SessionUser | undefined;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: "Forbidden: Insufficient permissions" }, 403);
    }
    await next();
  };
}

export function requireRole(roles: SessionUser["role"][]) {
  return rbacMiddleware(roles);
}

export const requireAdmin = requireRole(["ADMIN"]);
export const requireManager = requireRole(["ADMIN", "MANAGER"]);
export const requireEmployee = requireRole(["ADMIN", "MANAGER", "EMPLOYEE"]);