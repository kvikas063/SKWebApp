"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { EmployeeType, TaxRegime, UserRole, Prisma } from "@prisma/client";
import { rupeesToPaise } from "@/lib/money";

const employeeSchema = z.object({
  employeeCode: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfJoining: z.string(),
  employeeType: z.nativeEnum(EmployeeType),
  taxRegime: z.nativeEnum(TaxRegime),
  designation: z.string().optional(),
  department: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankIfsc: z.string().optional(),
  pan: z.string().optional(),
  uan: z.string().optional(),
  esiNumber: z.string().optional(),
  createUser: z.boolean().default(true),
  password: z.string().min(6).optional(),
});

export async function getEmployees() {
  const user = await requireAuth();
  const company = await prisma.company.findFirst();
  if (!company) return [];

  const where: Prisma.EmployeeWhereInput = { companyId: company.id, isActive: true };
  if (user.role === "MANAGER") {
    const me = await prisma.employee.findFirst({ where: { userId: user.id } });
    if (me) {
      where.managerId = me.id;
    } else {
      return [];
    }
  }

  return prisma.employee.findMany({
    where,
    include: {
      salaryComponents: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      user: { select: { id: true, email: true, role: true } },
    },
    orderBy: { employeeCode: "asc" },
  });
}

export async function getEmployeeByCode(employeeCode: string) {
  const result = await prisma.employee.findFirst({
    where: { employeeCode },
    include: {
      salaryComponents: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      documents: true,
      user: { select: { id: true, email: true, role: true } },
      leaveBalances: { where: { year: new Date().getFullYear() } },
    },
  });
  return result;
}

export async function createEmployee(data: z.infer<typeof employeeSchema>) {
  const user = await requireAdmin();
  const parsed = employeeSchema.parse(data);
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("Company not found");

  const password = parsed.password || "employee123";
  const passwordHash = await bcrypt.hash(password, 12);

  const employee = await prisma.$transaction(async (tx) => {
    let userId: string | undefined;

    if (parsed.createUser) {
      const newUser = await tx.user.create({
        data: {
          email: parsed.email,
          name: `${parsed.firstName} ${parsed.lastName}`,
          passwordHash,
          role: UserRole.EMPLOYEE,
        },
      });
      userId = newUser.id;
    }

    const emp = await tx.employee.create({
      data: {
        companyId: company.id,
        userId,
        employeeCode: parsed.employeeCode,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        phone: parsed.phone,
        dateOfJoining: new Date(parsed.dateOfJoining),
        employeeType: parsed.employeeType,
        taxRegime: parsed.taxRegime,
        designation: parsed.designation,
        department: parsed.department,
        bankName: parsed.bankName,
        bankAccountNo: parsed.bankAccountNo,
        bankIfsc: parsed.bankIfsc,
        pan: parsed.pan,
        uan: parsed.uan,
        esiNumber: parsed.esiNumber,
      },
    });

    // Default salary components
    const defaults = [
      { name: "Basic", type: "EARNING" as const, amountPaise: rupeesToPaise(25000), sortOrder: 1 },
      { name: "HRA", type: "EARNING" as const, amountPaise: rupeesToPaise(10000), sortOrder: 2 },
      { name: "Special Allowance", type: "EARNING" as const, amountPaise: rupeesToPaise(8000), sortOrder: 3 },
      { name: "Conveyance", type: "EARNING" as const, amountPaise: rupeesToPaise(1600), sortOrder: 4 },
    ];

    await tx.salaryComponent.createMany({
      data: defaults.map((d) => ({ ...d, employeeId: emp.id })),
    });

    return emp;
  });

  await logAudit({
    actorId: user.id,
    companyId: company.id,
    action: "CREATE",
    entityType: "Employee",
    entityId: employee.id,
    after: employee,
  });

  return employee;
}

export async function updateEmployee(id: string, data: Partial<z.infer<typeof employeeSchema>>) {
  const user = await requireAuth();
  const before = await prisma.employee.findUnique({ where: { id } });
  if (!before) throw new Error("Employee not found");

  if (user.role === UserRole.MANAGER) {
    const me = await prisma.employee.findFirst({ where: { userId: user.id } });
    if (!me || before.managerId !== me.id) {
      throw new Error("Not authorized to edit this employee");
    }
  }

  const updated = await prisma.employee.update({
    where: { id },
    data: {
      ...data,
      dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : undefined,
    },
  });

  await logAudit({
    actorId: user.id,
    companyId: before.companyId,
    action: "UPDATE",
    entityType: "Employee",
    entityId: id,
    before,
    after: updated,
  });

  return updated;
}

export async function deleteEmployee(id: string) {
  const user = await requireAdmin();
  const before = await prisma.employee.findUnique({
    where: { id },
    include: { user: { select: { id: true } } },
  });
  if (!before) throw new Error("Employee not found");

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id },
      data: { isActive: false, dateOfLeaving: new Date() },
    });
    if (before.user) {
      await tx.user.update({
        where: { id: before.user.id },
        data: { isActive: false },
      });
    }
  });

  await logAudit({
    actorId: user.id,
    companyId: before.companyId,
    action: "DELETE",
    entityType: "Employee",
    entityId: id,
    before,
  });

  return { ok: true as const };
}

const salaryComponentSchema = z.object({  name: z.string().min(1),
  type: z.enum(["EARNING", "DEDUCTION"]),
  amountPaise: z.number().int().min(0),
  sortOrder: z.number().int().default(0),
});

export async function upsertSalaryComponent(
  employeeId: string,
  data: z.infer<typeof salaryComponentSchema>,
  id?: string
) {
  const user = await requireAdmin();
  const parsed = salaryComponentSchema.parse(data);

  if (id) {
    const updated = await prisma.salaryComponent.update({
      where: { id },
      data: parsed,
    });
    await logAudit({
      actorId: user.id,
      action: "UPDATE",
      entityType: "SalaryComponent",
      entityId: id,
      after: updated,
    });
    return updated;
  }

  const created = await prisma.salaryComponent.create({
    data: { ...parsed, employeeId },
  });
  await logAudit({
    actorId: user.id,
    action: "CREATE",
    entityType: "SalaryComponent",
    entityId: created.id,
    after: created,
  });
  return created;
}

export async function deleteSalaryComponent(id: string) {
  const user = await requireAdmin();
  const updated = await prisma.salaryComponent.update({
    where: { id },
    data: { isActive: false },
  });
  await logAudit({
    actorId: user.id,
    action: "DELETE",
    entityType: "SalaryComponent",
    entityId: id,
  });
  return updated;
}
