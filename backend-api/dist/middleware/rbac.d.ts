import { Context, Next } from "hono";
import type { SessionUser } from "../lib/auth.js";
export declare function rbacMiddleware(allowedRoles: SessionUser["role"][]): (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 403, "json">) | undefined>;
export declare function requireRole(roles: SessionUser["role"][]): (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 403, "json">) | undefined>;
export declare const requireAdmin: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 403, "json">) | undefined>;
export declare const requireManager: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 403, "json">) | undefined>;
export declare const requireEmployee: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 403, "json">) | undefined>;
//# sourceMappingURL=rbac.d.ts.map