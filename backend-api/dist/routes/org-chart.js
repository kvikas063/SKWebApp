import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
const orgChartRouter = new Hono();
orgChartRouter.use("*", authMiddleware);
orgChartRouter.get("/", async (c) => {
    const user = c.get("user");
    const root = await prisma.employee.findFirst({
        where: { managerId: null },
        include: {
            manager: { select: { firstName: true, lastName: true, employeeCode: true } },
            directReports: {
                include: {
                    directReports: {
                        include: {
                            directReports: {
                                include: {
                                    directReports: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    return c.json(root);
});
orgChartRouter.get("/list", async (c) => {
    const user = c.get("user");
    const items = await prisma.employee.findMany({
        include: { manager: { select: { firstName: true, lastName: true } } },
        orderBy: { employeeCode: "asc" },
    });
    return c.json(items);
});
export { orgChartRouter };
//# sourceMappingURL=org-chart.js.map