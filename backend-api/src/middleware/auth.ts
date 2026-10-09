import { Context, Next } from "hono";
import { getSessionUser } from "../lib/auth.js";
import type { SessionUser } from "../lib/auth.js";

declare module "hono" {
  interface ContextVariableMap {
    user: SessionUser;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
  }

  const token = authHeader.slice(7);
  const user = await getSessionUser(token);
  if (!user) {
    return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
  }

  c.set("user", user);
  await next();
}

export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await getSessionUser(token);
    if (user) {
      c.set("user", user);
    }
  }
  await next();
}