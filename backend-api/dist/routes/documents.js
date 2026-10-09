import { Hono } from "hono";
import { requireAuth } from "../middleware/rbac.js";
import { prisma } from "../lib/prisma.js";
const documentsRouter = new Hono();
documentsRouter.use("*", requireAuth);
documentsRouter.get("/", async (c) => {
    const user = c.get("user");
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const [items, total] = await Promise.all([
        prisma.employeeDocument.findMany({
            where: { employeeId: user.employeeId },
            include: { employee: { select: { firstName: true, lastName: true } } },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.employeeDocument.count({ where: { employeeId: user.employeeId } }),
    ]);
    return c.json({ data: items, total, page, limit, totalPages: Math.ceil(total / limit) });
});
documentsRouter.post("/", async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const { title, category, fileUrl, fileName, fileSize, mimeType } = body;
    const document = await prisma.employeeDocument.create({
        data: {
            employeeId: user.employeeId,
            title,
            category,
            fileUrl,
            fileName,
            fileSize,
            mimeType,
        },
    });
    return c.json(document, 201);
});
documentsRouter.delete("/:id", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const document = await prisma.employeeDocument.findUnique({ where: { id } });
    if (!document || document.employeeId !== user.employeeId) {
        return c.json({ error: "Not found" }, 404);
    }
    await prisma.employeeDocument.delete({ where: { id } });
    return c.json({ ok: true });
});
export { documentsRouter };
//# sourceMappingURL=documents.js.map