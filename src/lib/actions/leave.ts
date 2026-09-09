"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { EmployeeType, LeaveType, Prisma } from "@prisma/client";
import { sendEmail } from "@/lib/services/email";
import { formatDate } from "@/lib/utils";
import { notifyUser, fanoutNotifications } from "./notifications";

const leavePolicySchema = z.object({
  employeeType: z.nativeEnum(EmployeeType),
  leaveType: z.nativeEnum(LeaveType),
  yearlyEntitlement: z.number().min(0),
  allowCarryover: z.boolean().default(false),
  maxCarryoverDays: z.number().min(0).default(0),
  minServiceMonths: z.number().int().min(0).default(0),
});

export async function getLeavePolicies() {
  const company = await prisma.company.findFirst();
  if (!company) return [];
  return prisma.leavePolicy.findMany({
    where: { companyId: company.id },
    orderBy: [{ employeeType: "asc" }, { leaveType: "asc" }],
  });
}

export async function upsertLeavePolicy(
  data: z.infer<typeof leavePolicySchema>,
  id?: string
) {
  const user = await requireAdmin();
  const parsed = leavePolicySchema.parse(data);
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("Company not found");

  if (id) {
    const updated = await prisma.leavePolicy.update({ where: { id }, data: parsed });
    await logAudit({ actorId: user.id, companyId: company.id, action: "UPDATE", entityType: "LeavePolicy", entityId: id, after: updated });
    return updated;
  }

  const created = await prisma.leavePolicy.create({
    data: { ...parsed, companyId: company.id },
  });
  await logAudit({ actorId: user.id, companyId: company.id, action: "CREATE", entityType: "LeavePolicy", entityId: created.id, after: created });
  return created;
}

export async function initializeLeaveBalances(year: number) {
  const user = await requireAdmin();
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("Company not found");

  const employees = await prisma.employee.findMany({
    where: { companyId: company.id, isActive: true },
  });
  const policies = await prisma.leavePolicy.findMany({
    where: { companyId: company.id },
  });

  let count = 0;
  for (const emp of employees) {
    const empPolicies = policies.filter((p) => p.employeeType === emp.employeeType);
    for (const policy of empPolicies) {
      let carriedOver = 0;
      if (policy.allowCarryover && year > 1) {
        const prevBalance = await prisma.leaveBalance.findUnique({
          where: {
            employeeId_leaveType_year: {
              employeeId: emp.id,
              leaveType: policy.leaveType,
              year: year - 1,
            },
          },
        });
        if (prevBalance) {
          const remaining = prevBalance.entitled + prevBalance.carriedOver - prevBalance.used;
          carriedOver = Math.min(Math.max(0, remaining), policy.maxCarryoverDays);
        }
      }

      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveType_year: {
            employeeId: emp.id,
            leaveType: policy.leaveType,
            year,
          },
        },
        create: {
          employeeId: emp.id,
          leaveType: policy.leaveType,
          year,
          entitled: policy.yearlyEntitlement,
          carriedOver,
          used: 0,
        },
        update: {
          entitled: policy.yearlyEntitlement,
          carriedOver,
        },
      });
      count++;
    }
  }

  await logAudit({
    actorId: user.id,
    companyId: company.id,
    action: "INITIALIZE_BALANCES",
    entityType: "LeaveBalance",
    after: { year, count },
  });

  return { count };
}

export async function getLeaveBalances(employeeId?: string) {
  const year = new Date().getFullYear();
  return prisma.leaveBalance.findMany({
    where: {
      year,
      ...(employeeId ? { employeeId } : {}),
    },
    include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
  });
}

const leaveRequestSchema = z.object({
  leaveType: z.nativeEnum(LeaveType),
  startDate: z.string(),
  endDate: z.string(),
  dayType: z.enum(["FULL", "HALF"]).default("FULL"),
  reason: z.string().optional(),
});

export async function createLeaveRequest(employeeId: string, data: z.infer<typeof leaveRequestSchema>) {
  const parsed = leaveRequestSchema.parse(data);
  const start = new Date(parsed.startDate);
  const end = new Date(parsed.endDate);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const days = parsed.dayType === "HALF" ? 0.5 : diffDays;

  const request = await prisma.leaveRequest.create({
    data: {
      employeeId,
      leaveType: parsed.leaveType,
      startDate: start,
      endDate: end,
      dayType: parsed.dayType,
      days,
      reason: parsed.reason,
    },
  });

  // Notify all admins of the company
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { company: true },
  });
  if (employee) {
    const admins = await prisma.user.findMany({
      where: { isActive: true, role: "ADMIN" },
      select: { id: true },
    });
    await fanoutNotifications({
      type: "LEAVE",
      companyId: employee.companyId,
      userIds: admins.map((a) => a.id),
      title: `New leave request: ${employee.firstName} ${employee.lastName}`,
      body: `${parsed.leaveType.toLowerCase()} leave, ${formatDate(start)} – ${formatDate(end)} (${days}d) awaiting review.`,
      href: "/leave/requests",
    }).catch((e) => console.error("[leave-create] notification failed:", e));
  }

  return request;
}

export async function getLeaveRequests(status?: string, employeeIds?: string[]) {
  const where: Prisma.LeaveRequestWhereInput = status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {};
  if (employeeIds && employeeIds.length > 0) {
    where.employeeId = { in: employeeIds };
  }
  return prisma.leaveRequest.findMany({
    where,
    include: {
      employee: { select: { firstName: true, lastName: true, employeeCode: true, department: true, designation: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function reviewLeaveRequest(
  id: string,
  decision: "APPROVED" | "REJECTED",
  note?: string
) {
  const user = await requireAdmin();
  const request = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: true },
  });
  if (!request || request.status !== "PENDING") {
    throw new Error("Request not found or already processed");
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: decision,
      reviewedBy: user.id,
      reviewedAt: new Date(),
      reviewNote: note,
    },
  });

  if (decision === "APPROVED") {
    const year = request.startDate.getFullYear();
    await prisma.leaveBalance.update({
      where: {
        employeeId_leaveType_year: {
          employeeId: request.employeeId,
          leaveType: request.leaveType,
          year,
        },
      },
      data: { used: { increment: request.days } },
    });
  }

  await logAudit({
    actorId: user.id,
    companyId: request.employee.companyId,
    action: decision,
    entityType: "LeaveRequest",
    entityId: id,
    after: updated,
  });

  // Fire email to the employee
  const employeeWithUser = await prisma.employee.findUnique({
    where: { id: request.employeeId },
    include: { user: true, company: true },
  });
  if (employeeWithUser?.user?.email) {
    const template = decision === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED";
    sendEmail({
      template,
      to: employeeWithUser.user.email,
      companyId: employeeWithUser.companyId,
      actorId: user.id,
      variables: {
        name: employeeWithUser.firstName,
        leaveType: String(request.leaveType),
        startDate: formatDate(request.startDate),
        endDate: formatDate(request.endDate),
        days: String(request.days),
        reviewer: user.name || "HR",
        note: note || "",
        company: employeeWithUser.company?.name || "Your Company",
      },
    }).catch((e) => console.error("[leave-review] email failed:", e));
  }

  // In-app notification to the employee
  if (employeeWithUser?.userId) {
    notifyUser({
      userId: employeeWithUser.userId,
      companyId: employeeWithUser.companyId,
      type: "LEAVE",
      title: decision === "APPROVED" ? "Leave approved" : "Leave rejected",
      body: decision === "APPROVED"
        ? `Your ${request.leaveType.toLowerCase()} leave for ${formatDate(request.startDate)} – ${formatDate(request.endDate)} (${request.days}d) was approved.`
        : `Your ${request.leaveType.toLowerCase()} leave for ${formatDate(request.startDate)} – ${formatDate(request.endDate)} was rejected.${note ? ` Note: ${note}` : ""}`,
      href: "/my-leave",
    }).catch((e) => console.error("[leave-review] notification failed:", e));
  }

  return updated;
}

export async function getHolidays() {
  const company = await prisma.company.findFirst();
  if (!company) return [];
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  return prisma.holiday.findMany({
    where: { companyId: company.id, date: { gte: yearStart, lt: yearEnd } },
    orderBy: { date: "asc" },
  });
}

export async function addHoliday(date: string, name: string) {
  const user = await requireAdmin();
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("Company not found");

  const holiday = await prisma.holiday.create({
    data: { companyId: company.id, date: new Date(date), name },
  });

  await logAudit({
    actorId: user.id,
    companyId: company.id,
    action: "CREATE",
    entityType: "Holiday",
    entityId: holiday.id,
    after: holiday,
  });

  return holiday;
}
