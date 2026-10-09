import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const payrollRouter = new Hono();

payrollRouter.use("*", authMiddleware);

payrollRouter.get("/runs", async (c) => {
  const user = c.get("user");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");

  const where = user.role === "EMPLOYEE"
    ? { paySlips: { some: { employeeId: user.employeeId } } }
    : {};

  const [items, total] = await Promise.all([
    prisma.payRun.findMany({
      where,
      include: { paySlips: { where: { employeeId: user.employeeId } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payRun.count({ where }),
  ]);

  return c.json({ data: items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

payrollRouter.post("/run", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { month, year, payDate, notes } = body;

  const payRun = await prisma.payRun.create({
    data: {
      month,
      year,
      payDate: new Date(payDate),
      notes,
      status: "DRAFT",
      createdById: user.id,
    } as any,
  });

  return c.json(payRun, 201);
});

payrollRouter.post("/run/:id/finalize", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const payRun = await prisma.payRun.update({
    where: { id },
    data: { status: "FINALIZED", finalizedAt: new Date(), finalizedById: user.id } as any,
  });

  return c.json(payRun);
});

payrollRouter.post("/run/:id/pay", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const payRun = await prisma.payRun.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() } as any,
  });

  return c.json(payRun);
});

payrollRouter.get("/run/:id", async (c) => {
  const id = c.req.param("id");
  const payRun = await prisma.payRun.findUnique({
    where: { id },
    include: { paySlips: { include: { employee: true } } },
  });

  if (!payRun) return c.json({ error: "Not found" }, 404);
  return c.json(payRun);
});

export { payrollRouter };