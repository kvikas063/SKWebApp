import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getLeaveRequests } from "@/lib/actions/leave";
import { requireAuth } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { LeaveReviewButtons } from "../leave-review-buttons";
import { CalendarDays, Clock, CheckCircle2, XCircle, ArrowLeft, Filter } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const STATUS_TABS = [
  { key: "PENDING", label: "Pending", icon: Clock, color: "text-amber-600" },
  { key: "APPROVED", label: "Approved", icon: CheckCircle2, color: "text-emerald-600" },
  { key: "REJECTED", label: "Rejected", icon: XCircle, color: "text-rose-600" },
] as const;

type StatusKey = (typeof STATUS_TABS)[number]["key"];

type SearchParams = Promise<{ status?: string }>;

function isStatusKey(v: string | undefined): v is StatusKey {
  return !!v && STATUS_TABS.some((t) => t.key === v);
}

export default async function LeaveRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireAuth();
  const params = await searchParams;
  const status: StatusKey = isStatusKey(params.status) ? params.status : "PENDING";

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

  const requests = await getLeaveRequests(undefined, employeeIds);
  const filtered = requests.filter((r) => r.status === status);
  const counts = {
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Requests"
        description={`All ${status.toLowerCase()} leave requests across the company`}
        icon={CalendarDays}
        actions={
          <Button asChild variant="outline">
            <Link href="/leave">
              <ArrowLeft className="h-4 w-4" />
              Back to Leave
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Pending"
          value={counts.PENDING}
          icon={<Clock className="h-5 w-5" />}
          accent="from-amber-500 to-orange-500"
          href="/leave/requests?status=PENDING"
        />
        <StatCard
          title="Approved"
          value={counts.APPROVED}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="from-emerald-500 to-teal-500"
          href="/leave/requests?status=APPROVED"
        />
        <StatCard
          title="Rejected"
          value={counts.REJECTED}
          icon={<XCircle className="h-5 w-5" />}
          accent="from-rose-500 to-pink-500"
          href="/leave/requests?status=REJECTED"
        />
      </div>

      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
        {STATUS_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const active = tab.key === status;
          return (
            <Link
              key={tab.key}
              href={`/leave/requests?status=${tab.key}`}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {counts[tab.key]}
              </span>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {STATUS_TABS.find((t) => t.key === status)?.label} Requests
            <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                {(() => {
                  const Icon = STATUS_TABS.find((t) => t.key === status)?.icon ?? Clock;
                  return <Icon className="h-5 w-5 text-muted-foreground" />;
                })()}
              </div>
              <p className="font-medium">No {status.toLowerCase()} requests</p>
              <p className="text-sm text-muted-foreground">Nothing here at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {req.employee.firstName} {req.employee.lastName}
                      </p>
                      <span className="text-xs text-muted-foreground font-mono">({req.employee.employeeCode})</span>
                      <Badge variant="secondary" className="text-[10px]">{req.leaveType}</Badge>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span>{req.days} day(s)</span>
                      <span>·</span>
                      <span>{formatDate(req.startDate)} – {formatDate(req.endDate)}</span>
                      {req.employee.department && (
                        <>
                          <span>·</span>
                          <span>{req.employee.department}</span>
                        </>
                      )}
                    </p>
                    {req.reason && <p className="mt-1.5 text-sm">{req.reason}</p>}
                    {status !== "PENDING" && req.reviewNote && (
                      <p className="mt-1 text-xs italic text-muted-foreground">Reviewer note: {req.reviewNote}</p>
                    )}
                  </div>
                  {status === "PENDING" ? (
                    <LeaveReviewButtons requestId={req.id} />
                  ) : (
                    <Badge
                      variant={status === "APPROVED" ? "success" : "destructive"}
                      className="ml-4 shrink-0"
                    >
                      {status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
