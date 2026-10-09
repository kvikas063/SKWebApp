import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
const leaveRouter = new Hono();
leaveRouter.use("*", authMiddleware);
leaveRouter.get("/my", async (c) => {
    const user = c.get("user");
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const [items, total] = await Promise.all([
        prisma.leaveRequest.findMany({
            where: { employeeId: user.employeeId },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.leaveRequest.count({ where: { employeeId: user.employeeId } }),
    ]);
    return c.json({ data: items, total, page, limit, totalPages: Math.ceil(total / limit) });
});
leaveRouter.post("/", async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const { leaveType, startDate, endDate, reason } = body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const request = await prisma.leaveRequest.create({
        data: {
            employeeId: user.employeeId,
            leaveType,
            startDate: start,
            endDate: end,
            days,
            reason,
            status: "PENDING",
        },
    });
    return c.json(request, 201);
});
leaveRouter.get("/requests", async (c) => {
    const user = c.get("user");
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const where = user.role === "EMPLOYEE" ? { employeeId: user.employeeId } : {};
    const [items, total] = await Promise.all([
        prisma.leaveRequest.findMany({
            where,
            include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.leaveRequest.count({ where }),
    ]);
    return c.json({ data: items, total, page, limit, totalPages: Math.ceil(total / limit) });
});
leaveRouter.patch("/:id/approve", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const request = await prisma.leaveRequest.update({
        where: { id },
        data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date() },
    });
    return c.json(request);
});
leaveRouter.patch("/:id/reject", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = await c.req.json();
    const { reason } = body;
    const request = await prisma.leaveRequest.update({
        where: { id },
        data: { status: "REJECTED", rejectedById: user.id, rejectedAt: new Date(), rejectionReason: reason },
    });
    return c.json(request);
});
export { leaveRouter };
//# sourceMappingURL=leave.js.map