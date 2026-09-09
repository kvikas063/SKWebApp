"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<ChangePasswordResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated" };
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { ok: false, error: "All fields are required" };
  }

  if (newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters" };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, error: "New password and confirmation do not match" };
  }

  if (currentPassword === newPassword) {
    return { ok: false, error: "New password must be different from current password" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) {
    return { ok: false, error: "User not found" };
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Current password is incorrect" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  revalidatePath("/change-password");

  return { ok: true };
}
