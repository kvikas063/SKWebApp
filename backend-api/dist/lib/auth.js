import { SignJWT, jwtVerify } from "jose";
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production");
const JWT_ISSUER = "sk-webapp";
const JWT_AUDIENCE = "sk-webapp-api";
export async function createToken(user) {
    return new SignJWT({ ...user })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .setExpirationTime("24h")
        .sign(JWT_SECRET);
}
export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });
        return payload;
    }
    catch {
        return null;
    }
}
export async function getSessionUser(token) {
    return verifyToken(token);
}
export async function requireAuth(token) {
    const user = await getSessionUser(token);
    if (!user)
        throw new Error("Unauthorized");
    return user;
}
export async function requireAdmin(token) {
    const user = await requireAuth(token);
    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
        throw new Error("Forbidden: Admin access required");
    }
    return user;
}
export async function requireManager(token) {
    const user = await requireAuth(token);
    if (user.role !== "MANAGER") {
        throw new Error("Forbidden: Manager access required");
    }
    return user;
}
export function isAdmin(user) {
    return user.role === "ADMIN" || user.role === "MANAGER";
}
export function isManager(user) {
    return user.role === "MANAGER";
}
// Hono middleware wrapper
export async function authMiddleware(c, next) {
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
export async function optionalAuthMiddleware(c, next) {
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
export function requireRole(roles) {
    return async (c, next) => {
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        if (!roles.includes(user.role)) {
            return c.json({ error: "Forbidden: Insufficient permissions" }, 403);
        }
        await next();
    };
}
//# sourceMappingURL=auth.js.map