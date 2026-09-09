import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAuth } from "@/lib/rbac";
import { getLeaveBalances, getLeaveRequests } from "@/lib/actions/leave";
import { formatDate } from "@/lib/utils";
import { LeaveRequestForm } from "./leave-request-form";
import { CalendarDays, Palmtree, Heart, Briefcase, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CASUAL: Palmtree,
  EARNED: Briefcase,
  SICK: Heart,
};

const statusVariants: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  APPROVED: "success",
  REJECTED: "destructive",
  PENDING: "warning",
  CANCELLED: "secondary",
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  PENDING: Clock,
  CANCELLED: XCircle,
};

export default async function MyLeavePage() {
  const user = await requireAuth();
  if (!user.employeeId) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Leave" icon={CalendarDays} />
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No employee profile linked to your account.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [balances, requests] = await Promise.all([
    getLeaveBalances(user.employeeId),
    getLeaveRequests(),
  ]);

  const myRequests = requests.filter((r) => r.employeeId === user.employeeId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leave"
        description="View balances, request leave, and track history"
        icon={CalendarDays}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {balances.length === 0 ? (
          <Card className="sm:col-span-3">
            <CardContent className="py-8 text-center text-muted-foreground">
              No leave balances assigned yet.
            </CardContent>
          </Card>
        ) : (
          balances.map((b) => {
            const Icon = typeIcons[b.leaveType] ?? CalendarDays;
            const available = b.entitled + b.carriedOver - b.used;
            const total = b.entitled + b.carriedOver;
            return (
              <StatCard
                key={b.id}
                title={b.leaveType}
                value={`${available}d`}
                icon={<Icon className="h-5 w-5" />}
                description={`${b.used} used of ${total} days`}
                accent={
                  b.leaveType === "CASUAL"
                    ? "from-amber-500 to-orange-500"
                    : b.leaveType === "EARNED"
                    ? "from-indigo-500 to-violet-500"
                    : "from-rose-500 to-pink-500"
                }
              />
            );
          })
        )}
      </div>

      <LeaveRequestForm employeeId={user.employeeId} />

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">My Requests</h3>
          </div>
          {myRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests yet.</p>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => {
                const StatusIcon = statusIcons[req.status] ?? Clock;
                return (
                  <div key={req.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{req.leaveType} — {req.days} day(s)</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(req.startDate)} – {formatDate(req.endDate)}
                      </p>
                    </div>
                    <Badge variant={statusVariants[req.status]}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {req.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
