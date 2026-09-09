"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const companySchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  pan: z.string().optional(),
  tan: z.string().optional(),
  pfNumber: z.string().optional(),
  esiNumber: z.string().optional(),
});

export async function getCompany() {
  return prisma.company.findFirst({
    include: { statutoryConfig: true },
  });
}

export async function updateCompany(data: z.infer<typeof companySchema>) {
  const user = await requireAdmin();
  const parsed = companySchema.parse(data);
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("Company not found");

  const updated = await prisma.company.update({
    where: { id: company.id },
    data: parsed,
  });

  await logAudit({
    actorId: user.id,
    companyId: company.id,
    action: "UPDATE",
    entityType: "Company",
    entityId: company.id,
    after: updated,
  });

  return updated;
}
