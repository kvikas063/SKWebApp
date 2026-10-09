import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
const projectsRouter = new Hono();
projectsRouter.use("*", authMiddleware);
projectsRouter.get("/", async (c) => {
    const user = c.get("user");
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const where = user.role === "EMPLOYEE" ? { managerId: user.employeeId } : {};
    const [items, total] = await Promise.all([
        prisma.project.findMany({
            where,
            include: { manager: { select: { firstName: true, lastName: true } }, milestones: true },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.project.count({ where }),
    ]);
    return c.json({ data: items, total, page, limit, totalPages: Math.ceil(total / limit) });
});
projectsRouter.post("/", async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const { name, description, status, priority, startDate, endDate, managerId, projectId, company } = body;
    const project = await prisma.project.create({
        data: {
            name,
            description,
            status: status || "PLANNING",
            priority: priority || "MEDIUM",
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            managerId: managerId || user.employeeId,
            projectId,
            company,
        },
    });
    return c.json(project, 201);
});
projectsRouter.get("/:id", async (c) => {
    const id = c.req.param("id");
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            manager: { select: { firstName: true, lastName: true, employeeCode: true } },
            milestones: { include: { tasks: true } },
        },
    });
    if (!project)
        return c.json({ error: "Not found" }, 404);
    return c.json(project);
});
projectsRouter.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, description, status, priority, startDate, endDate } = body;
    const project = await prisma.project.update({
        where: { id },
        data: {
            ...(name && { name }),
            ...(description && { description }),
            ...(status && { status }),
            ...(priority && { priority }),
            ...(startDate && { startDate: new Date(startDate) }),
            ...(endDate && { endDate: new Date(endDate) }),
        },
    });
    return c.json(project);
});
projectsRouter.delete("/:id", async (c) => {
    const id = c.req.param("id");
    await prisma.project.delete({ where: { id } });
    return c.json({ ok: true });
});
projectsRouter.post("/:id/milestones", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, description, status, dueDate } = body;
    const milestone = await prisma.milestone.create({
        data: {
            projectId: id,
            name,
            description,
            status: status || "PENDING",
            dueDate: new Date(dueDate),
        },
    });
    return c.json(milestone, 201);
});
projectsRouter.post("/milestones/:milestoneId/tasks", async (c) => {
    const milestoneId = c.req.param("milestoneId");
    const body = await c.req.json();
    const { title, description, status, priority, assigneeId, dueDate } = body;
    const task = await prisma.task.create({
        data: {
            milestoneId,
            title,
            description,
            status: status || "TODO",
            priority: priority || "MEDIUM",
            assigneeId,
            dueDate: new Date(dueDate),
        },
    });
    return c.json(task, 201);
});
export { projectsRouter };
//# sourceMappingURL=projects.js.map