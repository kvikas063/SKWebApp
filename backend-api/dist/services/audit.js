import { prisma } from "../lib/prisma.js";
import { resolvePaging } from "../lib/pagination.js";
export async function logAudit(params) {
    try {
        await prisma.auditLog.create({
            data: {
                actorId: params.actorId,
                companyId: params.companyId,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                beforeJson: params.before ? JSON.parse(JSON.stringify(params.before)) : undefined,
                afterJson: params.after ? JSON.parse(JSON.stringify(params.after)) : undefined,
            },
        });
    }
    catch (err) {
        console.error("[audit] failed to write audit log", {
            action: params.action,
            entityType: params.entityType,
            err,
        });
    }
}
export async function getAuditLogsPage(params = {}) {
    const paging = resolvePaging(params);
    const action = params.action?.trim();
    const where = action && action !== "ALL" ? { action } : {};
    const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: paging.skip,
            take: paging.take,
            include: { actor: { select: { name: true, email: true } } },
        }),
        prisma.auditLog.count({ where }),
    ]);
    return {
        data: items,
        total,
        page: paging.page,
        limit: paging.limit,
        offset: paging.offset,
        totalPages: Math.ceil(total / paging.limit),
        hasNext: paging.page < Math.ceil(total / paging.limit),
        hasPrev: paging.page > 1,
    };
}
//# sourceMappingURL=audit.js.map