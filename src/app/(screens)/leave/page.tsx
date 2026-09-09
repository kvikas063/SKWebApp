import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getLeaveRequests, getLeavePolicies, getHolidays } from "@/lib/actions/leave";
import { requireAuth } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { LeaveActions } from "./leave-actions";
import { LeaveReviewButtons } from "./leave-review-buttons";
import { CalendarDays, Clock, CheckCircle2, XCircle, FileText, Calendar as CalendarIcon, Plane, ArrowRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export default async function LeavePage() {
  const user = await requireAuth();
  const year = new Date().getFullYear();

  let employeeIds: string[] | undefined;
  if (user.role === UserRole.MANAGER) {
    const me = await prisma.employee.findFirst({ where: { userId: user.id } });
    if (me) {
      const reports = await prisma.employee.findMany({
        where: { managerId: me.id, isActive: true },
        select: { id: true },
      });
      employeeIds = reports.map((r) => r.id);
    }
  }

  const [requests, policies, holidays] = await Promise.all([
    getLeaveRequests(undefined, employeeIds),
    getLeavePolicies(),
    getHolidays(),
  ]);

  const pending = requests.filter((r) => r.status === "PENDING");
  const approved = requests.filter((r) => r.status === "APPROVED").length;
  const rejected = requests.filter((r) => r.status === "REJECTED").length;
  const pendingPreview = pending.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Review requests, manage policies, and holidays"
        icon={CalendarDays}
        actions={<LeaveActions />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending" value={pending.length} icon={<Clock className="h-5 w-5" />} accent="from-amber-500 to-orange-500" />
        <StatCard title="Approved" value={approved} icon={<CheckCircle2 className="h-5 w-5" />} accent="from-emerald-500 to-teal-500" />
        <StatCard title="Rejected" value={rejected} icon={<XCircle className="h-5 w-5" />} accent="from-rose-500 to-pink-500" />
        <StatCard title={`Holidays ${year}`} value={holidays.length} icon={<Plane className="h-5 w-5" />} accent="from-indigo-500 to-violet-500" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pending Requests
              {pending.length > 0 && (
                <Badge variant="warning" className="ml-1">{pending.length}</Badge>
              )}
            </CardTitle>
            {pending.length > 5 && (
              <Button asChild variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                <Link href="/leave/requests">
                  View all ({pending.length})
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="font-medium">All caught up</p>
              <p className="text-sm text-muted-foreground">No pending leave requests to review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPreview.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {req.employee.firstName} {req.employee.lastName}
                      </p>
                      <span className="text-xs text-muted-foreground font-mono">({req.employee.employeeCode})</span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">{req.leaveType}</Badge>
                      <span>·</span>
                      <span>{req.days} day(s)</span>
                      <span>·</span>
                      <span>{formatDate(req.startDate)} – {formatDate(req.endDate)}</span>
                    </p>
                    {req.reason && <p className="mt-1.5 text-sm">{req.reason}</p>}
                  </div>
                  <LeaveReviewButtons requestId={req.id} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Leave Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {policies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No policies configured.</p>
            ) : (
              <div className="space-y-2">
                {policies.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{p.employeeType.replace("_", " ")}</Badge>
                      <span className="text-sm font-medium">{p.leaveType}</span>
                    </div>
                    <span className="text-sm font-semibold">{p.yearlyEntitlement} days/yr</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Holidays {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {holidays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No holidays configured.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {holidays.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-sm font-medium">{h.name}</span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-foreground leading-none">
                      {new Intl.DateTimeFormat("en-IN", { day: "2-digit" }).format(new Date(h.date))}
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                      {new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(h.date))}
                    </div>
                  </div>
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
