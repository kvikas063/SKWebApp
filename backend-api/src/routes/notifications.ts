import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const notificationsRouter = new Hono();

notificationsRouter.use("*", authMiddleware);

notificationsRouter.get("/", async (c) => {
  const user = c.get("user");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { userId: user.id } }),
  ]);

  return c.json({ data: items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

notificationsRouter.get("/unread", async (c) => {
  const user = c.get("user");
  const count = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  return c.json({ count });
});

notificationsRouter.patch("/:id/read", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const notification = await prisma.notification.update({
    where: { id, userId: user.id },
    data: { readAt: new Date() },
  });

  return c.json(notification);
});

notificationsRouter.post("/read-all", async (c) => {
  const user = c.get("user");
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return c.json({ ok: true });
});

export { notificationsRouter };