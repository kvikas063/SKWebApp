import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const dashboardRouter = new Hono();

dashboardRouter.use("*", authMiddleware);

dashboardRouter.get("/", async (c) => {
  const user = c.get("user");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7));

  const [todayPunches, recentPunches, myLeaveBalances, myPayslips, myNotifications, pendingLeaves, totalEmployees] = await Promise.all([
    prisma.attendance.findMany({
      where: { employeeId: user.employeeId, punchIn: { gte: today, lte: endOfDay } },
      include: { employee: { select: { firstName: true, lastName: true } } },
    }),
    prisma.attendance.findMany({
      where: { employeeId: user.employeeId, punchIn: { gte: sevenDaysAgo } },
      orderBy: { punchIn: "desc" },
      take: 10,
    }),
    prisma.leaveBalance.findMany({ where: { employeeId: user.employeeId } }),
    prisma.paySlip.findMany({
      where: { employeeId: user.employeeId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId: user.id, readAt: null },
      take: 5,
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.employee.count(),
  });

  return c.json({
    todayPunches,
    recentPunches,
    myLeaveBalances,
    myPayslips,
    myNotifications,
    pendingLeaves,
    totalEmployees,
  });
});

export { dashboardRouter };