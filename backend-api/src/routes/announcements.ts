import { Hono } from "hono";
import { requireAuth, requireManager } from "../middleware/rbac.js";
import { prisma } from "../lib/prisma.js";

const announcementsRouter = new Hono();

announcementsRouter.use("*", requireAuth);

announcementsRouter.get("/", async (c) => {
  const user = c.get("user");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");

  const [items, total] = await Promise.all([
    prisma.announcement.findMany({
      where: { archived: false },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.announcement.count({ where: { archived: false } }),
  ]);

  return c.json({ data: items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

announcementsRouter.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { title, body: content, priority, audience, expiresAt } = body;

  const announcement = await prisma.announcement.create({
    data: {
      title,
      body: content,
      priority: priority || "NORMAL",
      audience: audience || "ALL",
      authorId: user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    },
  });

  return c.json(announcement, 201);
});

announcementsRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { title, body: content, priority, audience, archived, expiresAt } = body;

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(content && { body: content }),
      ...(priority && { priority }),
      ...(audience && { audience }),
      ...(archived !== undefined && { archived }),
      ...(expiresAt && { expiresAt: new Date(expiresAt) }),
    },
  });

  return c.json(announcement);
});

announcementsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await prisma.announcement.delete({ where: { id } });
  return c.json({ ok: true });
});

export { announcementsRouter };