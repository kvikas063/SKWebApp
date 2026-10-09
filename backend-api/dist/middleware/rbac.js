export function rbacMiddleware(allowedRoles) {
    return async (c, next) => {
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        if (!allowedRoles.includes(user.role)) {
            return c.json({ error: "Forbidden: Insufficient permissions" }, 403);
        }
        await next();
    };
}
export function requireRole(roles) {
    return rbacMiddleware(roles);
}
export const requireAdmin = requireRole(["ADMIN"]);
export const requireManager = requireRole(["ADMIN", "MANAGER"]);
export const requireEmployee = requireRole(["ADMIN", "MANAGER", "EMPLOYEE"]);
//# sourceMappingURL=rbac.js.map