import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { authMiddleware } from "./middleware/auth.js";
import { rbacMiddleware } from "./middleware/rbac.js";
import { employeesRouter } from "./routes/employees.js";
import { auditRouter } from "./routes/audit.js";
import { authRouter } from "./routes/auth.js";
import { attendanceRouter } from "./routes/attendance.js";
import { leaveRouter } from "./routes/leave.js";
import { payrollRouter } from "./routes/payroll.js";
import { projectsRouter } from "./routes/projects.js";
import { documentsRouter } from "./routes/documents.js";
import { announcementsRouter } from "./routes/announcements.js";
import { notificationsRouter } from "./routes/notifications.js";
import { orgChartRouter } from "./routes/org-chart.js";
import { profileRouter } from "./routes/profile.js";
import { dashboardRouter } from "./routes/dashboard.js";
const app = new Hono();
// Global middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));
// Public auth routes (no auth required)
app.route("/api/auth", authRouter);
// Protected routes - all require authentication
const protectedRoutes = new Hono();
protectedRoutes.use("*", authMiddleware);
// Apply RBAC middleware where needed
protectedRoutes.use("/api/admin/*", rbacMiddleware(["ADMIN"]));
protectedRoutes.use("/api/manager/*", rbacMiddleware(["ADMIN", "MANAGER"]));
// Mount feature routes
protectedRoutes.route("/api/employees", employeesRouter);
protectedRoutes.route("/api/audit", auditRouter);
protectedRoutes.route("/api/attendance", attendanceRouter);
protectedRoutes.route("/api/leave", leaveRouter);
protectedRoutes.route("/api/payroll", payrollRouter);
protectedRoutes.route("/api/projects", projectsRouter);
protectedRoutes.route("/api/documents", documentsRouter);
protectedRoutes.route("/api/announcements", announcementsRouter);
protectedRoutes.route("/api/notifications", notificationsRouter);
protectedRoutes.route("/api/org-chart", orgChartRouter);
protectedRoutes.route("/api/profile", profileRouter);
protectedRoutes.route("/api/dashboard", dashboardRouter);
app.route("/", protectedRoutes);
// Error handler
app.onError((err, c) => {
    console.error("Unhandled error:", err);
    return c.json({ error: "Internal server error" }, 500);
});
// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));
const port = Number(process.env.PORT) || 4000;
export default {
    fetch: app.fetch,
    port,
};
console.log(`🚀 Backend API running on http://localhost:${port}`);
//# sourceMappingURL=index.js.map