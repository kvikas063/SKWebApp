import { Context, Next } from "hono";
import type { UserRole } from "@prisma/client";
export interface SessionUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    employeeId?: string;
    companyId?: string;
}
export declare function createToken(user: SessionUser): Promise<string>;
export declare function verifyToken(token: string): Promise<SessionUser | null>;
export declare function getSessionUser(token: string): Promise<SessionUser | null>;
export declare function requireAuth(token: string): Promise<SessionUser>;
export declare function requireAdmin(token: string): Promise<SessionUser>;
export declare function requireManager(token: string): Promise<SessionUser>;
export declare function isAdmin(user: SessionUser): boolean;
export declare function isManager(user: SessionUser): boolean;
export declare function authMiddleware(c: Context, next: Next): Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | undefined>;
export declare function optionalAuthMiddleware(c: Context, next: Next): Promise<void>;
export declare function requireRole(roles: SessionUser["role"][]): (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 403, "json">) | undefined>;
//# sourceMappingURL=auth.d.ts.map