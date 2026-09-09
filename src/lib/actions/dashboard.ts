import { prisma } from "@/lib/prisma";
import { SessionUser } from "@/lib/rbac";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export async function getAdminDashboard(companyId: string) {
  const today = startOfToday();

  // Last 7 days attendance trend (present counts)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [employeeCount, presentToday, pendingLeaves, latestPayRun, depts, recentAttendance, last6PayRuns, recentAudit, pendingLeaveReqs] =
    await Promise.all([
      prisma.employee.count({ where: { companyId, isActive: true } }),
      prisma.attendance.count({
        where: { date: today, status: "PRESENT" },
      }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.payRun.findFirst({
        where: { companyId, status: "FINALIZED" },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),
      prisma.employee.groupBy({
        by: ["department"],
        where: { companyId, isActive: true },
        _count: { _all: true },
      }),
      prisma.attendance.findMany({
        where: {
          date: { gte: sevenDaysAgo, lte: today },
        },
        select: { date: true, status: true },
      }),
      prisma.payRun.findMany({
        where: { companyId, status: "FINALIZED" },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 6,
      }),
      prisma.auditLog.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { actor: { select: { name: true } } },
      }),
      prisma.leaveRequest.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      }),
    ]);

  // Build 7-day attendance series
  const attendanceByDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    attendanceByDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const a of recentAttendance) {
    if (a.status === "PRESENT") {
      const key = new Date(a.date).toISOString().slice(0, 10);
      attendanceByDay.set(key, (attendanceByDay.get(key) ?? 0) + 1);
    }
  }
  const attendanceTrend = Array.from(attendanceByDay.entries()).map(([k, v]) => ({
    label: new Date(k).toLocaleDateString("en-IN", { weekday: "short" }),
    value: v,
  }));

  const deptData = depts
    .filter((d) => d.department)
    .map((d) => ({ label: d.department as string, value: d._count._all }));

  const payrollTrend = last6PayRuns
    .slice()
    .reverse()
    .map((r) => ({
      label: new Date(r.year, r.month - 1).toLocaleDateString("en-IN", {
        month: "short",
      }),
      value: Math.round(r.totalGrossPaise / 100),
    }));

  return {
    isAdmin: true,
    employeeCount,
    presentToday,
    pendingLeaves,
    latestPayRun,
    attendanceTrend,
    deptData,
    payrollTrend,
    recentAudit,
    pendingLeaveReqs,
  };
}

export async function getHolidaysForDashboard(companyId: string) {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  return prisma.holiday.findMany({
    where: { companyId, date: { gte: yearStart, lt: yearEnd } },
    select: { id: true, date: true, name: true },
    orderBy: { date: "asc" },
  });
}

export async function getAnnouncementsForDashboard(
  companyId: string,
  audience: "ADMIN" | "EMPLOYEES"
) {
  return prisma.announcement.findMany({
    where: {
      companyId,
      audience: { in: ["ALL", audience] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take: 2,
    include: { author: { select: { name: true } } },
  });
}

export async function getEmployeeDashboard(user: SessionUser) {
  const today = startOfToday();
  const employeeId = user.employeeId;

  const [balances, pendingLeaves, todayAttendance, latestSlip, recentLeaves, employee] =
    await Promise.all([
      prisma.leaveBalance.findMany({
        where: { employeeId, year: new Date().getFullYear() },
      }),
      prisma.leaveRequest.count({ where: { employeeId, status: "PENDING" } }),
      prisma.attendance.findFirst({ where: { employeeId, date: today } }),
      prisma.paySlip.findFirst({
        where: { employeeId },
        include: { payRun: { select: { year: true, month: true } } },
        orderBy: { payRun: { year: "desc" } },
      }),
      prisma.leaveRequest.findMany({
        where: { employeeId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      employeeId
        ? prisma.employee.findUnique({
            where: { id: employeeId },
            select: {
              phone: true,
              dateOfBirth: true,
              address: true,
              bankName: true,
              bankAccountNo: true,
              bankIfsc: true,
              pan: true,
            },
          })
        : Promise.resolve(null),
    ]);

  const totalLeaveBalance = balances.reduce(
    (s, b) => s + (b.entitled + b.carriedOver - b.used),
    0
  );

  const missingFields: string[] = [];
  if (employee) {
    if (!employee.phone) missingFields.push("phone");
    if (!employee.dateOfBirth) missingFields.push("date of birth");
    if (!employee.address) missingFields.push("address");
    if (!employee.bankName) missingFields.push("bank name");
    if (!employee.bankAccountNo) missingFields.push("bank account number");
    if (!employee.bankIfsc) missingFields.push("bank IFSC");
    if (!employee.pan) missingFields.push("PAN");
  }

  return {
    isAdmin: false,
    balances,
    pendingLeaves,
    todayAttendance,
    latestSlip,
    recentLeaves,
    totalLeaveBalance,
    profileCompleteness: {
      total: 7,
      filled: 7 - missingFields.length,
      missingFields,
    },
  };
}