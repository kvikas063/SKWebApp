"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { computePayroll } from "@/lib/services/payroll-engine";
import { getAttendanceSummary } from "@/lib/actions/attendance";
import { sendEmail } from "@/lib/services/email";
import { formatINR } from "@/lib/money";
import { getMonthName } from "@/lib/utils";
import { PayRunStatus } from "@prisma/client";
import { fanoutNotifications } from "./notifications";

const VALID_TRANSITIONS: Record<PayRunStatus, PayRunStatus[]> = {
  DRAFT: ["REVIEWING", "CANCELLED"],
  REVIEWING: ["LOCKED", "DRAFT", "CANCELLED"],
  LOCKED: ["FINALIZED", "REVIEWING"],
  FINALIZED: [],
  CANCELLED: [],
};

function assertTransition(from: PayRunStatus, to: PayRunStatus) {
  if (!VALID_TRANSITIONS[from].includes(to)) {
    throw new Error(`Cannot transition pay run from ${from} to ${to}`);
  }
}

export async function getPayRuns() {
  const company = await prisma.company.findFirst();
  if (!company) return [];
  return prisma.payRun.findMany({
    where: { companyId: company.id },
    include: { _count: { select: { paySlips: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function getPayRun(id: string) {
  return prisma.payRun.findUnique({
    where: { id },
    include: {
      company: true,
      paySlips: {
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeCode: true,
              department: true,
              designation: true,
              pan: true,
              bankAccountNo: true,
              bankIfsc: true,
              uan: true,
            },
          },
        },
      },
    },
  });
}

export async function openPayRun(year: number, month: number) {
  const user = await requireAdmin();
  const company = await prisma.company.findFirst({
    include: { statutoryConfig: true },
  });
  if (!company?.statutoryConfig) throw new Error("Company or statutory config not found");

  const existing = await prisma.payRun.findUnique({
    where: { companyId_year_month: { companyId: company.id, year, month } },
  });
  if (existing) throw new Error("Pay run already exists for this month");

  const totalDays = new Date(year, month, 0).getDate();
  const employees = await prisma.employee.findMany({
    where: { companyId: company.id, isActive: true },
    include: { salaryComponents: { where: { isActive: true } } },
  });

  const payRun = await prisma.payRun.create({
    data: {
      companyId: company.id,
      year,
      month,
      status: PayRunStatus.DRAFT,
      openedById: user.id,
      openedAt: new Date(),
    },
  });

  let totalGross = 0;
  let totalNet = 0;
  let totalDeductions = 0;

  for (const emp of employees) {
    const summary = await getAttendanceSummary(year, month, emp.id);
    const result = computePayroll({
      employee: emp,
      components: emp.salaryComponents,
      config: company.statutoryConfig,
      paidDays: summary.paidDays,
      totalDays,
      lopDays: summary.lop,
      daysPresent: summary.present,
      daysAbsent: summary.absent + summary.lop,
    });

    await prisma.paySlip.create({
      data: {
        payRunId: payRun.id,
        employeeId: emp.id,
        grossPaise: result.grossPaise,
        netPaise: result.netPaise,
        totalDeductionsPaise: result.totalDeductionsPaise,
        daysPresent: result.daysPresent,
        daysAbsent: result.daysAbsent,
        lopDays: result.lopDays,
        paidDays: result.paidDays,
        earningsJson: result.earnings,
        deductionsJson: result.deductions,
        statutoryJson: result.statutory,
      },
    });

    totalGross += result.grossPaise;
    totalNet += result.netPaise;
    totalDeductions += result.totalDeductionsPaise;
  }

  const updated = await prisma.payRun.update({
    where: { id: payRun.id },
    data: { totalGrossPaise: totalGross, totalNetPaise: totalNet, totalDeductionsPaise: totalDeductions },
  });

  await logAudit({
    actorId: user.id,
    companyId: company.id,
    action: "OPEN",
    entityType: "PayRun",
    entityId: payRun.id,
    after: updated,
  });

  return updated;
}

export async function transitionPayRun(id: string, toStatus: PayRunStatus) {
  const user = await requireAdmin();
  const payRun = await prisma.payRun.findUnique({ where: { id } });
  if (!payRun) throw new Error("Pay run not found");

  assertTransition(payRun.status, toStatus);

  const data: Record<string, unknown> = { status: toStatus };
  if (toStatus === "FINALIZED") {
    data.finalizedById = user.id;
    data.finalizedAt = new Date();
  }

  const updated = await prisma.payRun.update({ where: { id }, data });

  await logAudit({
    actorId: user.id,
    companyId: payRun.companyId,
    action: toStatus,
    entityType: "PayRun",
    entityId: id,
    before: payRun,
    after: updated,
  });

  if (toStatus === "FINALIZED") {
    // Send payslip emails to each employee
    const slips = await prisma.paySlip.findMany({
      where: { payRunId: id },
      include: { employee: { include: { user: true } } },
    });
    const company = await prisma.company.findUnique({ where: { id: payRun.companyId } });
    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";

    await Promise.all(
      slips
        .filter((s) => s.employee.user?.email)
        .map((s) =>
          sendEmail({
            template: "PAYSLIP_READY",
            to: s.employee.user!.email,
            companyId: payRun.companyId,
            actorId: user.id,
            variables: {
              name: s.employee.firstName,
              month: getMonthName(payRun.month),
              year: String(payRun.year),
              gross: formatINR(s.grossPaise),
              deductions: formatINR(s.totalDeductionsPaise),
              net: formatINR(s.netPaise),
              link: `${baseUrl}/my-payslips`,
              company: company?.name || "Your Company",
            },
          }).catch((e) => console.error("[payroll-finalize] email failed:", e))
        )
    );

    // In-app notifications
    const userIds = slips.map((s) => s.employee.userId).filter((id): id is string => !!id);
    await fanoutNotifications({
      type: "PAYSLIP",
      companyId: payRun.companyId,
      userIds,
      title: `Payslip ready: ${getMonthName(payRun.month)} ${payRun.year}`,
      body: slips.length === 1
        ? `Your salary for ${getMonthName(payRun.month)} ${payRun.year} has been finalized.`
        : `${slips.length} payslips finalized for ${getMonthName(payRun.month)} ${payRun.year}.`,
      href: "/my-payslips",
    }).catch((e) => console.error("[payroll-finalize] notification failed:", e));
  }

  return updated;
}

export async function cancelPayRun(id: string) {
  const user = await requireAdmin();
  const payRun = await prisma.payRun.findUnique({ where: { id } });
  if (!payRun) throw new Error("Pay run not found");
  if (payRun.status === "FINALIZED" || payRun.status === "CANCELLED") {
    throw new Error("Cannot cancel a finalized or already-cancelled pay run");
  }
  const updated = await prisma.payRun.update({
    where: { id },
    data: { status: PayRunStatus.CANCELLED },
  });
  await logAudit({
    actorId: user.id,
    companyId: payRun.companyId,
    action: "CANCEL",
    entityType: "PayRun",
    entityId: id,
    before: payRun,
    after: updated,
  });
  return updated;
}

export async function deletePayRun(id: string) {
  const user = await requireAdmin();
  const payRun = await prisma.payRun.findUnique({ where: { id } });
  if (!payRun) throw new Error("Pay run not found");
  if (payRun.status !== PayRunStatus.DRAFT) {
    throw new Error("Only DRAFT pay runs can be deleted");
  }
  await prisma.$transaction(async (tx) => {
    await tx.paySlip.deleteMany({ where: { payRunId: id } });
    await tx.payRun.delete({ where: { id } });
  });
  await logAudit({
    actorId: user.id,
    companyId: payRun.companyId,
    action: "DELETE",
    entityType: "PayRun",
    entityId: id,
    before: payRun,
  });
  return { ok: true as const };
}

export async function getMyPaySlips() {
  const user = await requireAdmin();
  if (!user.employeeId) return [];
  return prisma.paySlip.findMany({
    where: { employeeId: user.employeeId },
    include: { payRun: { select: { year: true, month: true, status: true } } },
    orderBy: { payRun: { year: "desc" } },
  });
}
