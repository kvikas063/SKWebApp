import { prisma } from "../lib/prisma.js";
import { buildPageMeta, resolvePaging, settlePage, type PagingQuery } from "../lib/pagination.js";
import type { Prisma } from "@prisma/client";

export async function logAudit(params: {
  actorId?: string;
  companyId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
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
  } catch (err) {
    console.error("[audit] failed to write audit log", {
      action: params.action,
      entityType: params.entityType,
      err,
    });
  }
}

export async function getAuditLogsPage(params: any = {}) {
  const paging = resolvePaging(params);
  const action = params.action?.trim();
  const where: Prisma.AuditLogWhereInput = action && action !== "ALL" ? { action } : {};

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