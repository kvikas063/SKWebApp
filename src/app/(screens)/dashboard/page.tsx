import { getAdminDashboard, getEmployeeDashboard, getHolidaysForDashboard, getAnnouncementsForDashboard } from "@/lib/actions/dashboard";
import { requireAuth } from "@/lib/rbac";
import { StatCard } from "@/components/ui/stat-card";
import { AreaChart, BarChart, DonutChart } from "@/components/ui/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Megaphone,
  UserCircle2,
  ArrowRight,
} from "lucide-react";
import { QuickPunch } from "@/components/dashboard/quick-punch";
import { ApplyLeaveCard } from "@/components/dashboard/apply-leave-card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { formatINR } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  Users,
  UserCheck,
  CalendarClock,
  IndianRupee,
  TrendingUp,
  Activity,
  FileText,
  Clock,
  LayoutDashboard,
  UserPlus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Lock,
  CheckCheck,
  Ban,
  Eye,
  KeyRound,
  Download,
  Printer,
  Sparkles,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  REJECTED: "border-transparent bg-destructive text-destructive-foreground",
  CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  REVIEWING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  LOCKED: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  FINALIZED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  PRESENT: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  HALF_DAY: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  HOLIDAY: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  LOP: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const actionStyles: Record<string, { icon: LucideIcon; ring: string; iconBg: string; iconColor: string; label: string }> = {
  CREATE: {
    icon: UserPlus,
    ring: "ring-emerald-300/70 dark:ring-emerald-700/60",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-600",
    iconColor: "text-white",
    label: "Created",
  },
  UPDATE: {
    icon: Pencil,
    ring: "ring-blue-300/70 dark:ring-blue-700/60",
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    iconColor: "text-white",
    label: "Updated",
  },
  DELETE: {
    icon: Trash2,
    ring: "ring-rose-300/70 dark:ring-rose-700/60",
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-600",
    iconColor: "text-white",
    label: "Deleted",
  },
  LOGIN: {
    icon: LogIn,
    ring: "ring-violet-300/70 dark:ring-violet-700/60",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    iconColor: "text-white",
    label: "Signed in",
  },
  SIGN_OUT: {
    icon: LogOut,
    ring: "ring-violet-300/70 dark:ring-violet-700/60",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    iconColor: "text-white",
    label: "Signed out",
  },
  APPROVE: {
    icon: CheckCircle2,
    ring: "ring-emerald-300/70 dark:ring-emerald-700/60",
    iconBg: "bg-gradient-to-br from-emerald-400 to-green-600",
    iconColor: "text-white",
    label: "Approved",
  },
  REJECT: {
    icon: XCircle,
    ring: "ring-rose-300/70 dark:ring-rose-700/60",
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
    iconColor: "text-white",
    label: "Rejected",
  },
  START: {
    icon: PlayCircle,
    ring: "ring-amber-300/70 dark:ring-amber-700/60",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-600",
    iconColor: "text-white",
    label: "Started",
  },
  OPEN: {
    icon: PlayCircle,
    ring: "ring-amber-300/70 dark:ring-amber-700/60",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-600",
    iconColor: "text-white",
    label: "Opened",
  },
  LOCK: {
    icon: Lock,
    ring: "ring-amber-300/70 dark:ring-amber-700/60",
    iconBg: "bg-gradient-to-br from-amber-400 to-yellow-600",
    iconColor: "text-white",
    label: "Locked",
  },
  CLOSE: {
    icon: Lock,
    ring: "ring-slate-300/70 dark:ring-slate-600/60",
    iconBg: "bg-gradient-to-br from-slate-500 to-slate-700",
    iconColor: "text-white",
    label: "Closed",
  },
  FINALIZE: {
    icon: CheckCheck,
    ring: "ring-emerald-300/70 dark:ring-emerald-700/60",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-600",
    iconColor: "text-white",
    label: "Finalized",
  },
  CANCEL: {
    icon: Ban,
    ring: "ring-slate-300/70 dark:ring-slate-700/60",
    iconBg: "bg-gradient-to-br from-slate-500 to-slate-700",
    iconColor: "text-white",
    label: "Cancelled",
  },
  VIEW: {
    icon: Eye,
    ring: "ring-sky-300/70 dark:ring-sky-700/60",
    iconBg: "bg-gradient-to-br from-sky-500 to-cyan-600",
    iconColor: "text-white",
    label: "Viewed",
  },
  PASSWORD: {
    icon: KeyRound,
    ring: "ring-indigo-300/70 dark:ring-indigo-700/60",
    iconBg: "bg-gradient-to-br from-indigo-500 to-blue-600",
    iconColor: "text-white",
    label: "Password",
  },
  PUNCH: {
    icon: Clock,
    ring: "ring-cyan-300/70 dark:ring-cyan-700/60",
    iconBg: "bg-gradient-to-br from-cyan-500 to-blue-600",
    iconColor: "text-white",
    label: "Punch",
  },
  INITIALIZE: {
    icon: Sparkles,
    ring: "ring-violet-300/70 dark:ring-violet-700/60",
    iconBg: "bg-gradient-to-br from-violet-500 to-fuchsia-600",
    iconColor: "text-white",
    label: "Initialized",
  },
  SUBMIT: {
    icon: FileText,
    ring: "ring-sky-300/70 dark:ring-sky-700/60",
    iconBg: "bg-gradient-to-br from-sky-500 to-indigo-600",
    iconColor: "text-white",
    label: "Submitted",
  },
  EXPORT: {
    icon: Download,
    ring: "ring-teal-300/70 dark:ring-teal-700/60",
    iconBg: "bg-gradient-to-br from-teal-500 to-emerald-600",
    iconColor: "text-white",
    label: "Exported",
  },
  PRINT: {
    icon: Printer,
    ring: "ring-slate-300/70 dark:ring-slate-700/60",
    iconBg: "bg-gradient-to-br from-slate-500 to-slate-700",
    iconColor: "text-white",
    label: "Printed",
  },
};

function getActionStyle(action: string) {
  const key = action.split("_")[0];
  return (
    actionStyles[key] ?? {
      icon: ScrollText,
      ring: "ring-slate-300/70 dark:ring-slate-700/60",
      iconBg: "bg-gradient-to-br from-indigo-500 to-violet-600",
      iconColor: "text-white",
      label: action,
    }
  );
}

function timeAgo(d: Date) {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return formatDateTime(d);
}

function formatEntityType(type: string): string {
  return type
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function actionPreposition(action: string) {
  const key = action.split("_")[0];
  if (key === "LOGIN" || key === "SIGN_OUT" || key === "VIEW") return "from";
  if (key === "PUNCH" || key === "PASSWORD") return "—";
  return "on";
}

function AdminDashboard({
  data,
  announcements,
}: {
  data: Awaited<ReturnType<typeof getAdminDashboard>>;
  announcements: { id: string; title: string; body: string; pinned: boolean; author: { name: string | null } | null }[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        icon={LayoutDashboard}
      />

      {announcements.length > 0 && (
        <AnnouncementBanner items={announcements} />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={data.employeeCount}
          icon={<Users className="h-5 w-5" />}
          accent="from-blue-500 to-cyan-500"
          href="/employees"
        />
        <StatCard
          title="Present Today"
          value={data.presentToday}
          icon={<UserCheck className="h-5 w-5" />}
          trend={{ value: `${data.presentToday} checked in`, positive: true }}
          accent="from-emerald-500 to-teal-500"
          href="/attendance"
        />
        <StatCard
          title="Pending Leaves"
          value={data.pendingLeaves}
          icon={<CalendarClock className="h-5 w-5" />}
          trend={{ value: "awaiting review", positive: false }}
          accent="from-amber-500 to-orange-500"
          href="/leave"
        />
        <StatCard
          title="Latest PayRun"
          value={data.latestPayRun ? formatINR(data.latestPayRun.totalNetPaise) : "—"}
          icon={<IndianRupee className="h-5 w-5" />}
          description={data.latestPayRun ? `Gross: ${formatINR(data.latestPayRun.totalGrossPaise)}` : "No runs yet"}
          accent="from-indigo-500 to-purple-500"
          href={data.latestPayRun ? `/payroll/${data.latestPayRun.id}` : "/payroll"}
        />
      </div>

<div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={data.attendanceTrend}
              height={220}
              color="#2563eb"
              showGrid={true}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.deptData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No departments found.</p>
            ) : (
              <DonutChart
                data={data.deptData.map((d, i) => ({
                  label: d.label,
                  value: d.value,
                  color: [
                    "#2563eb", "#7c3aed", "#db2777", "#ea580c",
                    "#16a34a", "#0891b2", "#d97706", "#4f46e5",
                  ][i % 8],
                }))}
                size={160}
                thickness={20}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Payroll Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.payrollTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No finalized pay runs yet.</p>
            ) : (
              <>
                <BarChart data={data.payrollTrend} height={180} color="#7c3aed" />
                <PayrollTrendFooter trend={data.payrollTrend} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pending Leaves
              <span className="text-xs font-bold" style={{ color: "#0746ad" }}>
                ({data.pendingLeaves})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.pendingLeaveReqs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending leave requests.</p>
            ) : (
              <div className="space-y-3">
                {data.pendingLeaveReqs.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-xl border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {req.employee.firstName} {req.employee.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.leaveType} · {req.days} day(s)
                      </p>
                    </div>
                    <Badge className={statusColors[req.status]}>{req.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <Clock className="h-4 w-4" />
            </div>
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentAudit.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">No recent activity</p>
              <p className="text-sm text-muted-foreground">System events will appear here as they happen.</p>
            </div>
          ) : (
            <ol className="relative">
              {data.recentAudit.map((log, i) => {
                const style = getActionStyle(log.action);
                const Icon = style.icon;
                const isLast = i === data.recentAudit.length - 1;
                const actorName = log.actor?.name ?? "System";
                const initials = actorName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("") || "S";
                return (
                  <li
                    key={log.id}
                    className="group relative flex gap-4 px-6 py-4 transition-colors duration-200 ease-out hover:bg-slate-50/60 dark:hover:bg-slate-900/30"
                  >
                    {!isLast && (
                      <span
                        aria-hidden
                        className="absolute left-[2.6rem] top-12 h-[calc(100%-2.75rem)] w-px bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-800"
                      />
                    )}
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${style.iconBg} ${style.iconColor} shadow-lg ring-4 ${style.ring}`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          {style.label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {actionPreposition(log.action)}
                        </span>
                        <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {formatEntityType(log.entityType)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                            {initials}
                          </div>
                          <span className="font-medium text-foreground/80">{actorName}</span>
                        </div>
                        <span aria-hidden>·</span>
                        <time
                          dateTime={new Date(log.createdAt).toISOString()}
                          title={formatDateTime(log.createdAt)}
                          className="font-medium"
                        >
                          {timeAgo(log.createdAt)}
                        </time>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeeDashboard({
  data,
  announcements,
  employeeId,
}: {
  data: Awaited<ReturnType<typeof getEmployeeDashboard>>;
  announcements: { id: string; title: string; body: string; pinned: boolean; author: { name: string | null } | null }[];
  employeeId: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        icon={LayoutDashboard}
      />

      {announcements.length > 0 && <AnnouncementBanner items={announcements} />}

      {data.profileCompleteness.missingFields.length > 0 && (
        <ProfileCompletenessBanner
          missing={data.profileCompleteness.missingFields}
          total={data.profileCompleteness.total}
          filled={data.profileCompleteness.filled}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <QuickPunch
            employeeId={employeeId}
            hasPunchIn={!!data.todayAttendance?.punchIn}
            hasPunchOut={!!data.todayAttendance?.punchOut}
            punchInAt={data.todayAttendance?.punchIn ?? null}
          />
          <ApplyLeaveCard employeeId={employeeId} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2">
          <StatCard
            title="Leave Balance"
            value={`${Math.round(data.totalLeaveBalance)}d`}
            icon={<CalendarClock className="h-5 w-5" />}
            description="Total available leaves"
            accent="from-blue-500 to-cyan-500"
            href="/my-leave"
          />
          <StatCard
            title="Pending Leaves"
            value={data.pendingLeaves}
            icon={<FileText className="h-5 w-5" />}
            trend={{ value: "in review", positive: false }}
            accent="from-amber-500 to-orange-500"
            href="/my-leave"
          />
          <StatCard
            title="Today"
            value={data.todayAttendance?.status ?? "—"}
            icon={<Activity className="h-5 w-5" />}
            description={
              data.todayAttendance?.punchIn
                ? `Punched in at ${new Date(data.todayAttendance.punchIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                : "No punch-in yet"
            }
            accent="from-emerald-500 to-teal-500"
            href="/my-attendance"
          />
          <StatCard
            title="Latest Payslip"
            value={data.latestSlip ? formatINR(data.latestSlip.netPaise) : "—"}
            icon={<IndianRupee className="h-5 w-5" />}
            description={
              data.latestSlip
                ? `${new Date(data.latestSlip.payRun.year, data.latestSlip.payRun.month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
                : "No payslips yet"
            }
            accent="from-indigo-500 to-purple-500"
            href="/my-payslips"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leave Balances</CardTitle>
          </CardHeader>
          <CardContent>
            {data.balances.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leave balances yet.</p>
            ) : (
              <div className="space-y-4">
                {data.balances.map((bal) => {
                  const available = bal.entitled + bal.carriedOver - bal.used;
                  const pct = bal.entitled > 0 ? Math.min(100, Math.round((bal.used / (bal.entitled + bal.carriedOver)) * 100)) : 0;
                  return (
                    <div key={bal.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{bal.leaveType.toLowerCase()}</span>
                        <span className="text-muted-foreground">
                          {available.toFixed(1)} / {(bal.entitled + bal.carriedOver).toFixed(1)} days
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-500 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentLeaves.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leave requests yet.</p>
            ) : (
              <div className="space-y-3">
                {data.recentLeaves.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize">{req.leaveType.toLowerCase()}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(req.startDate)} – {formatDate(req.endDate)} · {req.days} day(s)
                      </p>
                    </div>
                    <Badge className={statusColors[req.status]}>{req.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const isAdmin = user.role === "ADMIN" || user.role === "MANAGER";

  if (isAdmin) {
    const [data, , announcements] = await Promise.all([
      getAdminDashboard(user.companyId!),
      user.companyId ? getHolidaysForDashboard(user.companyId) : Promise.resolve([]),
      user.companyId ? getAnnouncementsForDashboard(user.companyId, "ADMIN") : Promise.resolve([]),
    ]);
    return <AdminDashboard data={data} announcements={announcements} />;
  }

  const [data, announcements] = await Promise.all([
    getEmployeeDashboard(user),
    user.companyId ? getAnnouncementsForDashboard(user.companyId, "EMPLOYEES") : Promise.resolve([]),
  ]);
  return <EmployeeDashboard data={data} announcements={announcements} employeeId={user.employeeId ?? ""} />;
}

function AnnouncementBanner({
  items,
}: {
  items: { id: string; title: string; body: string; pinned: boolean; author: { name: string | null } | null }[];
}) {
  return (
    <div className="space-y-2">
      {items.slice(0, 2).map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-3 rounded-lg border border-indigo-200/30 bg-gradient-to-r from-indigo-50/30 via-violet-50/15 to-pink-50/15 px-4 py-3 text-sm dark:border-indigo-900/50 dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-pink-950/20"
        >
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">{a.title}</p>
              {a.pinned && <Badge variant="warning" className="text-[10px]">Pinned</Badge>}
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {a.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileCompletenessBanner({
  missing,
  total,
  filled,
}: {
  missing: string[];
  total: number;
  filled: number;
}) {
  const pct = Math.round((filled / total) * 100);
  return (
    <Link
      href="/profile/edit"
      className="group flex items-start gap-3 rounded-lg border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/60 to-rose-50/40 px-4 py-3 text-sm transition-all hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10 dark:border-amber-900/50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/20"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30">
        <UserCircle2 className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-foreground">
            Complete your profile ({filled}/{total} done)
          </p>
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold group-hover:underline dark:text-purple-300 dark:group-hover:text-purple-200"
            style={{ color: "#3b0764" }}
          >
            Update now
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Missing: <span className="font-medium text-foreground/80">{missing.join(", ")}</span>
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-200/60 dark:bg-amber-900/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function PayrollTrendFooter({ trend }: { trend: { label: string; value: number }[] }) {
  if (trend.length === 0) return null;

  const total = trend.reduce((s, t) => s + t.value, 0);
  const avg = total / trend.length;
  const peak = trend.reduce((m, t) => (t.value > m.value ? t : m), trend[0]);
  const latest = trend[trend.length - 1];
  const previous = trend.length >= 2 ? trend[trend.length - 2] : null;

  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n.toFixed(0)}`;
  };

  let changePct: number | null = null;
  if (previous && previous.value > 0) {
    changePct = ((latest.value - previous.value) / previous.value) * 100;
  }

  const isUp = changePct !== null && changePct >= 0;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">Avg:</span> {fmt(avg)} / mo
        </span>
        <span>
          <span className="font-semibold text-foreground">Peak:</span> {peak.label} ({fmt(peak.value)})
        </span>
        <span>
          <span className="font-semibold text-foreground">Last 6 mo:</span> {fmt(total)}
        </span>
      </div>
      {changePct !== null && (
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold"
          style={{
            backgroundColor: isUp ? "#10b981" : "#f43f5e",
            color: "#ffffff",
          }}
        >
          {isUp ? "▲" : "▼"} {Math.abs(changePct).toFixed(1)}% vs prev
        </span>
      )}
    </div>
  );
}
