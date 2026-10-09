import { Context, Next } from "hono";
import type { SessionUser } from "../lib/auth.js";
declare module "hono" {
    interface ContextVariableMap {
        user: SessionUser;
    }
}
export declare function authMiddleware(c: Context, next: Next): Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | undefined>;
export declare function optionalAuthMiddleware(c: Context, next: Next): Promise<void>;
//# sourceMappingURL=auth.d.ts.map