"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/services/email";
import { fanoutNotifications } from "./notifications";

export async function listAnnouncements(companyId: string, opts?: { authorId?: string; audience?: string; take?: number }) {
  return prisma.announcement.findMany({
    where: {
      companyId,
      ...(opts?.authorId ? { authorId: opts.authorId } : {}),
      ...(opts?.audience ? { audience: opts.audience } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take: opts?.take ?? 20,
    include: { author: { select: { name: true } } },
  });
}

export async function getActiveAnnouncements(companyId: string, audience: "ADMIN" | "EMPLOYEE" | "ALL") {
  return prisma.announcement.findMany({
    where: {
      companyId,
      audience: { in: ["ALL", audience] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take: 3,
  });
}

export async function createAnnouncement(data: {
  title: string;
  body: string;
  audience?: string;
  pinned?: boolean;
  expiresAt?: string | null;
  sendEmail?: boolean;
}) {
  const user = await requireAdmin();
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("Company not found");

  const ann = await prisma.announcement.create({
    data: {
      companyId: company.id,
      title: data.title,
      body: data.body,
      audience: data.audience ?? "ALL",
      pinned: data.pinned ?? false,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      authorId: user.id,
    },
  });

  await logAudit({
    actorId: user.id,
    companyId: company.id,
    action: "CREATE",
    entityType: "Announcement",
    entityId: ann.id,
    after: { title: ann.title, audience: ann.audience },
  });

  if (data.sendEmail) {
    const recipients = await prisma.employee.findMany({
      where: {
        companyId: company.id,
        isActive: true,
        ...(data.audience === "ADMIN" ? { user: { role: "ADMIN" } } : {}),
        ...(data.audience === "EMPLOYEES" ? { user: { role: "EMPLOYEE" } } : {}),
      },
      include: { user: true },
    });
    await Promise.all(
      recipients
        .filter((r) => r.user?.email)
        .map((r) =>
          sendEmail({
            template: "ANNOUNCEMENT",
            to: r.user!.email,
            companyId: company.id,
            actorId: user.id,
            variables: {
              title: data.title,
              body: data.body,
              company: company.name,
            },
          }).catch((e) => console.error("[announcement] email failed:", e))
        )
    );
  }

  // In-app notifications for the same audience
  const recipientUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      employee: {
        companyId: company.id,
        isActive: true,
        ...(data.audience === "ADMIN" ? { user: { role: "ADMIN" } } : {}),
        ...(data.audience === "EMPLOYEES" ? { user: { role: "EMPLOYEE" } } : {}),
      },
    },
    select: { id: true },
  });
  await fanoutNotifications({
    type: "ANNOUNCEMENT",
    companyId: company.id,
    userIds: recipientUsers.map((u) => u.id),
    title: data.pinned ? `📌 ${data.title}` : data.title,
    body: data.body,
    href: "/dashboard",
  }).catch((e) => console.error("[announcement] notification failed:", e));

  return ann;
}

export async function deleteAnnouncement(id: string) {
  const user = await requireAdmin();
  const ann = await prisma.announcement.findUnique({ where: { id } });
  if (!ann) throw new Error("Not found");
  await prisma.announcement.delete({ where: { id } });
  await logAudit({
    actorId: user.id,
    companyId: ann.companyId,
    action: "DELETE",
    entityType: "Announcement",
    entityId: id,
  });
}

export async function togglePin(id: string) {
  const user = await requireAdmin();
  const ann = await prisma.announcement.findUnique({ where: { id } });
  if (!ann) throw new Error("Not found");
  const updated = await prisma.announcement.update({
    where: { id },
    data: { pinned: !ann.pinned },
  });
  await logAudit({
    actorId: user.id,
    companyId: ann.companyId,
    action: "UPDATE",
    entityType: "Announcement",
    entityId: id,
    after: { pinned: updated.pinned },
  });
  return updated;
}
