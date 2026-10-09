"use server";

import { prisma } from "@/server/lib/prisma";
import { retryFailedEmail } from "@/server/email";
import { requireAdmin } from "@/server/lib/rbac";

import { buildPageMeta, resolvePaging, settlePage } from "@/server/pagination";
import { revalidatePath } from "next/cache";
import { Prisma, EmailStatus } from "@prisma/client";

export async function getEmailLogStats(companyId: string) {
  const [total, sent, failed, queued] = await Promise.all([
    prisma.emailLog.count({ where: { companyId } }),
    prisma.emailLog.count({ where: { companyId, status: "SENT" } }),
    prisma.emailLog.count({ where: { companyId, status: "FAILED" } }),
    prisma.emailLog.count({ where: { companyId, status: "QUEUED" } }),
  ]);
  return { total, sent, failed, queued };
}

/**
 * One page of email logs. Replaces the old fixed `take: 200` window, which
 * silently truncated anything older.
 */
export async function getEmailLogsPage(
  companyId: string,
  params: {
    status?: string;
    page?: number | string;
    limit?: number | string;
    offset?: number | string;
  } = {}
) {
  await requireAdmin();
  const paging = resolvePaging(params);

  const status = params.status?.trim();
  const where: Prisma.EmailLogWhereInput = {
    companyId,
    ...(status && status !== "ALL" ? { status: status as EmailStatus } : {}),
  };

  const findPage = (p: typeof paging) =>
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: p.take,
      skip: p.skip,
    });

  const [data, total] = await Promise.all([
    findPage(paging),
    prisma.emailLog.count({ where }),
  ]);

  const settled = await settlePage({ data, paging, total, refetch: findPage });
  return { data: settled.data, ...buildPageMeta({ ...paging, page: settled.page }, total) };
}

export async function retryEmail(logId: string) {
  await requireAdmin();
  const result = await retryFailedEmail(logId);

  revalidatePath("/email-logs");
  return result;
}
