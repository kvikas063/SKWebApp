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
    console.error("Audit log failed:", err);
  }
}
