import { prisma } from "@/server/lib/prisma";
import { buildPageMeta, resolvePaging, settlePage } from "@/server/pagination";
import type { Prisma } from "@prisma/client";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * One page of audit entries. The stat cards and the action dropdown need totals
 * across the whole table, so they come from their own aggregate queries rather
 * than from the rows that happen to be on the current page.
 */
export async function getAuditLogsPage(params: {
  page?: number | string;
  limit?: number | string;
  offset?: number | string;
  action?: string;
} = {}) {
  const paging = resolvePaging(params);

  const action = params.action?.trim();
  const where: Prisma.AuditLogWhereInput =
    action && action !== "ALL" ? { action } : {};

  const findPage = (p: typeof paging) =>
    prisma.auditLog.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        action: true,
        entityType: true,
        actor: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: p.take,
      skip: p.skip,
    });

  const [data, total, todayCount, actionGroups, actorGroups] = await Promise.all([
    findPage(paging),
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: startOfToday() } } }),
    // Option list for the filter dropdown, counted across the whole table.
    prisma.auditLog.groupBy({
      by: ["action"],
      orderBy: { action: "asc" },
      _count: { action: true },
    }),
    prisma.auditLog.groupBy({
      by: ["actorId"],
      orderBy: { actorId: "asc" },
      _count: { actorId: true },
    }),
  ]);

  // `distinct actor` counts system entries (null actorId) as one more actor,
  // matching the previous in-memory `new Set(...)` behaviour.
  const uniqueActors = new Set(actorGroups.map((g) => g.actorId)).size;

  const settled = await settlePage({ data, paging, total, refetch: findPage });

  return {
    data: settled.data.map((l) => ({
      id: l.id,
      createdAt: l.createdAt.toISOString(),
      action: l.action,
      entityType: l.entityType,
      actor: l.actor ? { name: l.actor.name, email: l.actor.email } : null,
    })),
    ...buildPageMeta({ ...paging, page: settled.page }, total),
    summary: { total, todayCount, uniqueActors },
    actionCounts: actionGroups.map((g) => ({ action: g.action, count: g._count.action })),
  };
}