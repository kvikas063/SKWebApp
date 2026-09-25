import { prisma } from "@/lib/prisma";

type AuditParams = {
  actorId?: string;
  companyId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
};

export async function logAudit(params: AuditParams): Promise<void> {
  // Audit logging must never break the caller's request, but silently
  // swallowing failures hides data-loss. Log to stderr so operators can
  // spot a broken audit trail (e.g. a missing column after a migration)
  // instead of discovering it during an incident review.
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