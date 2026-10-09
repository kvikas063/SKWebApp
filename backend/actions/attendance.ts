"use server";

import { prisma } from "@/server/lib/prisma";
import { requireAdmin, requireAuth } from "@/server/lib/rbac";
import { logAudit } from "@/server/audit";
import { AttendanceStatus, Prisma } from "@prisma/client";
import { buildPageMeta, resolvePaging, settlePage } from "@/server/pagination";
import { revalidatePath } from "next/cache";

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function punchIn(employeeId: string) {
  const user = await requireAuth();
  const date = todayDate();

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date } },
  });

  if (existing?.punchIn) throw new Error("Already punched in today");

  const attendance = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date } },
    create: {
      employeeId,
      date,
      punchIn: new Date(),
      status: AttendanceStatus.PRESENT,
    },
    update: {
      punchIn: new Date(),
      status: AttendanceStatus.PRESENT,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "PUNCH_IN",
    entityType: "Attendance",
    entityId: attendance.id,
    after: attendance,
  });


  revalidatePath("/my-attendance");
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return attendance;
}

export async function punchOut(employeeId: string) {
  const user = await requireAuth();
  const date = todayDate();

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date } },
  });

  if (!existing?.punchIn) throw new Error("Must punch in first");
  if (existing.punchOut) throw new Error("Already punched out today");

  const punchOut = new Date();
  const workedMinutes = Math.round(
    (punchOut.getTime() - existing.punchIn.getTime()) / 60000
  );

  const attendance = await prisma.attendance.update({
    where: { id: existing.id },
    data: { punchOut, workedMinutes },
  });

  await logAudit({
    actorId: user.id,
    action: "PUNCH_OUT",
    entityType: "Attendance",
    entityId: attendance.id,
    after: attendance,
  });


  revalidatePath("/my-attendance");
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return attendance;
}

export async function getTodayAttendance(employeeId: string) {
  return prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: todayDate() } },
  });
}

export async function getAttendanceForMonth(year: number, month: number, employeeId?: string, employeeIds?: string[]) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return prisma.attendance.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(employeeId ? { employeeId } : {}),
      ...(employeeIds && employeeIds.length > 0 ? { employeeId: { in: employeeIds } } : {}),
    },
    include: {
      employee: { select: { firstName: true, lastName: true, employeeCode: true } },
    },
    orderBy: [{ date: "asc" }, { employee: { employeeCode: "asc" } }],
  });
}

/**
 * One page of attendance records for a month, with the status filter applied in
 * the query rather than in the browser, and the header counts computed over the
 * whole month so the stat cards stay right on every page.
 *
 * `getAttendanceForMonth` is left unbounded on purpose: payroll has to read
 * every record in the month to compute LOP and paid days.
 */
export async function getAttendancePage(params: {
  year: number;
  month: number;
  page?: number | string;
  limit?: number | string;
  offset?: number | string;
  status?: string;
  employeeIds?: string[];
}) {
  const user = await requireAuth();
  const paging = resolvePaging({ page: params.page, limit: params.limit, offset: params.offset });

  const start = new Date(params.year, params.month - 1, 1);
  const end = new Date(params.year, params.month, 0);

  // A manager only ever sees their own reports.
  let scopedEmployeeIds = params.employeeIds;
  if (user.role === "MANAGER" && !scopedEmployeeIds) {
    const me = await prisma.employee.findFirst({ where: { userId: user.id }, select: { id: true } });
    const reports = me
      ? await prisma.employee.findMany({ where: { managerId: me.id, isActive: true }, select: { id: true } })
      : [];
    scopedEmployeeIds = reports.map((r) => r.id);
  }

  const where: Prisma.AttendanceWhereInput = {
    date: { gte: start, lte: end },
    ...(scopedEmployeeIds && scopedEmployeeIds.length > 0
      ? { employeeId: { in: scopedEmployeeIds } }
      : {}),
  };

  // Status counts ignore the status filter itself, so the dropdown can show what
  // selecting each status would yield.
  const statusWhere: Prisma.AttendanceWhereInput = { ...where };
  const status = params.status?.trim();
  if (status && status !== "ALL") {
    where.status = status as AttendanceStatus;
  }

  const findPage = (p: typeof paging) =>
    prisma.attendance.findMany({
      where,
      select: {
        id: true,
        date: true,
        punchIn: true,
        punchOut: true,
        status: true,
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: [{ date: "asc" }, { employee: { employeeCode: "asc" } }],
      take: p.take,
      skip: p.skip,
    });

  const [data, total, present, absent, halfDay] = await prisma.$transaction([
    findPage(paging),
    prisma.attendance.count({ where }),
    prisma.attendance.count({ where: { ...statusWhere, status: "PRESENT" } }),
    prisma.attendance.count({ where: { ...statusWhere, status: { in: ["ABSENT", "LOP"] } } }),
    prisma.attendance.count({ where: { ...statusWhere, status: "HALF_DAY" } }),
  ]);

  // Facet counts are computed outside the transaction array: Prisma's `groupBy`
  // generic does not narrow when it is one element of a heterogeneous tuple.
  const grouped = await prisma.attendance.groupBy({
    by: ["status"],
    where: statusWhere,
    orderBy: { status: "asc" },
    _count: { status: true },
  });

  const settled = await settlePage({ data, paging, total, refetch: findPage });

  return {
    data: settled.data,
    ...buildPageMeta({ ...paging, page: settled.page }, total),
    summary: {
      totalRecords: grouped.reduce((sum, g) => sum + g._count.status, 0),
      present,
      absent,
      halfDay,
    },
    statusCounts: grouped.map((g) => ({ status: g.status, count: g._count.status })),
  };
}

export async function updateAttendance(
  id: string,
  data: { status: AttendanceStatus; notes?: string }
) {
  const user = await requireAdmin();
  const before = await prisma.attendance.findUnique({ where: { id } });
  if (!before) throw new Error("Attendance not found");

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      status: data.status,
      notes: data.notes,
      editedBy: user.id,
      editedAt: new Date(),
    },
  });

  await logAudit({
    actorId: user.id,
    action: "UPDATE",
    entityType: "Attendance",
    entityId: id,
    before,
    after: updated,
  });


  revalidatePath("/attendance");
  revalidatePath("/my-attendance");
  return updated;
}

export async function closeMonth(year: number, month: number) {
  const user = await requireAdmin();
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("Company not found");

  const employees = await prisma.employee.findMany({
    where: { companyId: company.id, isActive: true },
  });

  const holidays = await prisma.holiday.findMany({
    where: {
      companyId: company.id,
      date: {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0),
      },
    },
  });
  const holidayDates = new Set(holidays.map((h) => h.date.toISOString().split("T")[0]));

  const daysInMonth = new Date(year, month, 0).getDate();
  let created = 0;

  for (const emp of employees) {
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split("T")[0];
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        await prisma.attendance.upsert({
          where: { employeeId_date: { employeeId: emp.id, date } },
          create: { employeeId: emp.id, date, status: AttendanceStatus.HOLIDAY, notes: "Weekend" },
          update: {},
        });
        continue;
      }

      if (holidayDates.has(dateStr)) {
        await prisma.attendance.upsert({
          where: { employeeId_date: { employeeId: emp.id, date } },
          create: { employeeId: emp.id, date, status: AttendanceStatus.HOLIDAY },
          update: {},
        });
        continue;
      }

      const existing = await prisma.attendance.findUnique({
        where: { employeeId_date: { employeeId: emp.id, date } },
      });

      if (!existing) {
        await prisma.attendance.create({
          data: { employeeId: emp.id, date, status: AttendanceStatus.LOP },
        });
        created++;
      }
    }
  }

  await logAudit({
    actorId: user.id,
    companyId: company.id,
    action: "CLOSE_MONTH",
    entityType: "Attendance",
    after: { year, month, lopCreated: created },
  });


  revalidatePath("/attendance");
  revalidatePath("/my-attendance");
  revalidatePath("/payroll");
  revalidatePath("/dashboard");
  return { lopCreated: created };
}

export async function getAttendanceSummary(year: number, month: number, employeeId: string) {
  const records = await getAttendanceForMonth(year, month, employeeId);
  const summary = {
    present: 0,
    absent: 0,
    halfDay: 0,
    holiday: 0,
    lop: 0,
    paidDays: 0,
  };

  for (const r of records) {
    switch (r.status) {
      case "PRESENT": summary.present++; summary.paidDays++; break;
      case "ABSENT": summary.absent++; break;
      case "HALF_DAY": summary.halfDay++; summary.paidDays += 0.5; break;
      case "HOLIDAY": summary.holiday++; summary.paidDays++; break;
      case "LOP": summary.lop++; break;
    }
  }

  return summary;
}
