import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
const profileRouter = new Hono();
profileRouter.use("*", authMiddleware);
profileRouter.get("/", async (c) => {
    const user = c.get("user");
    const profile = await prisma.user.findUnique({
        where: { id: user.id },
        include: { employee: true },
    });
    if (!profile)
        return c.json({ error: "Not found" }, 404);
    return c.json(profile);
});
profileRouter.patch("/edit", async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const { name, phone, dateOfBirth, address } = body;
    const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
            ...(name && { name }),
            ...(phone && { phone }),
            ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
            ...(address && { address }),
        },
        include: { employee: true },
    });
    return c.json(updated);
});
export { profileRouter };
//# sourceMappingURL=profile.js.map