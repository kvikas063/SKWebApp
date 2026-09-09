import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId?: string;
  companyId?: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) redirect("/dashboard");
  return user;
}

export function isAdmin(user: SessionUser): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
}

export function isManager(user: SessionUser): boolean {
  return user.role === UserRole.MANAGER;
}
