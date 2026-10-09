import { Context, Next } from "hono";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "../lib/prisma.js";
import type { UserRole } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production");
const JWT_ISSUER = "sk-webapp";
const JWT_AUDIENCE = "sk-webapp-api";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId?: string;
  companyId?: string;
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSessionUser(token: string): Promise<SessionUser | null> {
  return verifyToken(token);
}

export async function requireAuth(token: string): Promise<SessionUser> {
  const user = await getSessionUser(token);
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(token: string): Promise<SessionUser> {
  const user = await requireAuth(token);
  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

export async function requireManager(token: string): Promise<SessionUser> {
  const user = await requireAuth(token);
  if (user.role !== "MANAGER") {
    throw new Error("Forbidden: Manager access required");
  }
  return user;
}

export function isAdmin(user: SessionUser): boolean {
  return user.role === "ADMIN" || user.role === "MANAGER";
}

export function isManager(user: SessionUser): boolean {
  return user.role === "MANAGER";
}

// Hono middleware wrapper
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

export function requireRole(roles: SessionUser["role"][]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as SessionUser | undefined;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    if (!roles.includes(user.role)) {
      return c.json({ error: "Forbidden: Insufficient permissions" }, 403);
    }
    await next();
  };
}