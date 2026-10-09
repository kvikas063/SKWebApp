import { Hono } from "hono";
import { getAuditLogsPage } from "../services/audit.js";
import { requireAdmin } from "../middleware/rbac.js";
import { prisma } from "../lib/prisma.js";
const auditRouter = new Hono();
auditRouter.use("*", requireAdmin);
auditRouter.get("/", async (c) => {
    const params = {
        page: c.req.query("page"),
        limit: c.req.query("limit"),
        offset: c.req.query("offset"),
        action: c.req.query("action"),
    };
    const result = await getAuditLogsPage(params);
    return c.json(result);
});
auditRouter.get("/actions", async (c) => {
    const actions = await prisma.auditLog.groupBy({
        by: ["action"],
        _count: { action: true },
        orderBy: { _count: { action: "desc" } },
        take: 50,
    });
    return c.json(actions.map((a) => ({ action: a.action, count: a._count.action })));
});
export { auditRouter };
//# sourceMappingURL=audit.js.map