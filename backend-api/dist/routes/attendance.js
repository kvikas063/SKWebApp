import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
const attendanceRouter = new Hono();
attendanceRouter.use("*", authMiddleware);
attendanceRouter.get("/today", async (c) => {
    const user = c.get("user");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const punches = await prisma.attendance.findMany({
        where: {
            employeeId: user.employeeId,
            punchIn: { gte: today, lte: endOfDay },
        },
        include: { employee: { select: { firstName: true, lastName: true } } },
    });
    return c.json(punches);
});
attendanceRouter.post("/punch", async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const { type, latitude, longitude, note } = body;
    const now = new Date();
    const punch = await prisma.attendance.create({
        data: {
            employeeId: user.employeeId,
            punchIn: now,
            type: type || "IN",
            latitude,
            longitude,
            note,
        },
    });
    return c.json(punch, 201);
});
attendanceRouter.get("/history", async (c) => {
    const user = c.get("user");
    const page = parseInt(String(c.req.query("page") || "1"));
    const limit = parseInt(String(c.req.query("limit") || "20"));
    const [items, total] = await Promise.all([
        prisma.attendance.findMany({
            where: { employeeId: user.employeeId },
            orderBy: { punchIn: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.attendance.count({ where: { employeeId: user.employeeId } }),
    ]);
    return c.json({
        data: items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    });
});
attendanceRouter.get("/summary", async (c) => {
    const user = c.get("user");
    const month = parseInt(String(c.req.query("month") || new Date().getMonth() + 1));
    const year = parseInt(String(c.req.query("year") || new Date().getFullYear()));
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const punches = await prisma.attendance.findMany({
        where: {
            employeeId: user.employeeId,
            punchIn: { gte: startDate, lte: endDate },
        },
        orderBy: { punchIn: "asc" },
    });
    return c.json(punches);
});
export { attendanceRouter };
//# sourceMappingURL=attendance.js.map