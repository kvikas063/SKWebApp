"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { NotificationType, Prisma } from "@prisma/client";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export async function getMyNotifications(take = 20): Promise<NotificationItem[]> {
  const user = await requireAuth();
  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      href: true,
      readAt: true,
      createdAt: true,
    },
  });
  return rows;
}

export async function getMyAllNotifications(): Promise<NotificationItem[]> {
  const user = await requireAuth();
  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      href: true,
      readAt: true,
      createdAt: true,
    },
  });
  return rows;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const user = await requireAuth();
  return prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });
}

export async function markNotificationRead(id: string) {
  const user = await requireAuth();
  await prisma.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const user = await requireAuth();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}

type FanoutInput = {
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  companyId?: string | null;
  userIds: string[];
};

export async function fanoutNotifications(input: FanoutInput) {
  if (input.userIds.length === 0) return;
  await prisma.notification.createMany({
    data: input.userIds.map((userId) => ({
      userId,
      companyId: input.companyId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    })),
  });
}

export async function notifyUser(input: {
  userId: string;
  companyId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
}) {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      companyId: input.companyId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    } satisfies Prisma.NotificationUncheckedCreateInput,
  });
}
