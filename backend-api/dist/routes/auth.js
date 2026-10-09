import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { createToken, requireAuth } from "../lib/auth.js";
import { logAudit } from "../services/audit.js";
const authRouter = new Hono();
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    employeeCode: z.string().optional(),
});
authRouter.post("/login", async (c) => {
    const body = await c.req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
    }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
        where: { email },
        include: { employee: true },
    });
    if (!user || !user.passwordHash) {
        return c.json({ error: "Invalid credentials" }, 401);
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return c.json({ error: "Invalid credentials" }, 401);
    }
    const sessionUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
        companyId: user.companyId,
    };
    const token = await createToken(sessionUser);
    await logAudit({
        actorId: user.id,
        companyId: user.companyId,
        action: "LOGIN",
        entityType: "User",
        entityId: user.id,
    });
    return c.json({
        token,
        user: sessionUser,
    });
});
authRouter.post("/register", async (c) => {
    const body = await c.req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
    }
    const { email, password, name, employeeCode } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return c.json({ error: "Email already registered" }, 409);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            name,
            role: "EMPLOYEE",
            employee: employeeCode ? {
                create: {
                    employeeCode,
                    firstName: name.split(" ")[0],
                    lastName: name.split(" ").slice(1).join(" ") || "-",
                    email,
                    department: "General",
                    dateOfJoining: new Date(),
                    company: { connect: { id: "default" } },
                },
            } : undefined,
        },
        include: { employee: true },
    });
    const sessionUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
        companyId: user.companyId,
    };
    const token = await createToken(sessionUser);
    return c.json({ token, user: sessionUser }, 201);
});
authRouter.post("/logout", async (c) => {
    // Client-side token removal is sufficient for JWT
    return c.json({ ok: true });
});
authRouter.get("/me", async (c) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.slice(7);
    const user = await requireAuth(token);
    return c.json({ user });
});
authRouter.post("/change-password", async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const schema = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
    }
    const { currentPassword, newPassword } = parsed.data;
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !dbUser.passwordHash) {
        return c.json({ error: "User not found" }, 404);
    }
    const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!valid) {
        return c.json({ error: "Current password is incorrect" }, 400);
    }
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
    });
    await logAudit({
        actorId: user.id,
        companyId: user.companyId,
        action: "PASSWORD_CHANGE",
        entityType: "User",
        entityId: user.id,
    });
    return c.json({ ok: true });
});
export { authRouter };
//# sourceMappingURL=auth.js.map