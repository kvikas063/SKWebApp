"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { AttendanceStatus } from "@prisma/client";

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
