"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

export async function getMyProfile() {
  const user = await requireAuth();
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      dateOfBirth: true,
      phone: true,
      employee: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          dateOfJoining: true,
          employeeType: true,
          taxRegime: true,
          designation: true,
          department: true,
          managerId: true,
          address: true,
          bankName: true,
          bankAccountNo: true,
          bankIfsc: true,
          pan: true,
          aadhaar: true,
          uan: true,
          esiNumber: true,
          company: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true,
            },
          },
          manager: {
            select: { firstName: true, lastName: true, designation: true },
          },
        },
      },
    },
  });
  return profile;
}

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Invalid email"),
  phone: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")).transform((v) => v?.trim() || null),
});

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateMyProfile(input: {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
}): Promise<UpdateProfileResult> {
  const user = await requireAuth();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  if (data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== user.id) {
      return { ok: false, error: "Email is already in use" };
    }
  }

  const before = await prisma.user.findUnique({
    where: { id: user.id },
    include: { employee: true },
  });
  if (!before) return { ok: false, error: "User not found" };

  const dob = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  const phoneVal = data.phone || null;
  const addressVal = data.address || null;

  const firstName = data.name.split(" ")[0] || before.name.split(" ")[0] || "User";
  const lastName =
    data.name.split(" ").slice(1).join(" ") || before.name.split(" ").slice(1).join(" ") || "";

  // Find a company to attach a synthesized employee record to (admins without
  // an Employee row can still store their personal info).
  const company = await prisma.company.findFirst({ select: { id: true } });

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: user.id },
      data: { name: data.name, email: data.email, dateOfBirth: dob, phone: phoneVal },
    });

    if (before.employee) {
      await tx.employee.update({
        where: { id: before.employee.id },
        data: {
          firstName,
          lastName,
          email: data.email,
          phone: phoneVal,
          dateOfBirth: dob,
          address: addressVal,
        },
      });
    } else if (company && (phoneVal || dob)) {
      // Admin user without an Employee record: persist DOB/phone on the User
      // table is enough; nothing else to do.
    }
    return u;
  });

  if (before.employee?.companyId) {
    await logAudit({
      actorId: user.id,
      companyId: before.employee.companyId,
      action: "UPDATE",
      entityType: "Profile",
      entityId: user.id,
      before: {
        name: before.name,
        email: before.email,
        phone: before.employee.phone,
        dateOfBirth: before.employee.dateOfBirth,
        address: before.employee.address,
      },
      after: { name: updated.name, email: updated.email, phone: phoneVal, dateOfBirth: dob, address: addressVal },
    });
  }

  revalidatePath("/profile");
  revalidatePath("/profile/edit");

  return { ok: true };
}

