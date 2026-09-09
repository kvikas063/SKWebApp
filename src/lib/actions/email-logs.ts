"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { listEmailLogs, retryFailedEmail } from "@/lib/services/email";

export async function getEmailLogStats(companyId: string) {
  const [total, sent, failed, queued] = await Promise.all([
    prisma.emailLog.count({ where: { companyId } }),
    prisma.emailLog.count({ where: { companyId, status: "SENT" } }),
    prisma.emailLog.count({ where: { companyId, status: "FAILED" } }),
    prisma.emailLog.count({ where: { companyId, status: "QUEUED" } }),
  ]);
  return { total, sent, failed, queued };
}

export async function getEmailLogs(companyId: string, status?: string) {
  return listEmailLogs(companyId, { status, take: 200 });
}

export async function retryEmail(logId: string) {
  await requireAdmin();
  return retryFailedEmail(logId);
}
