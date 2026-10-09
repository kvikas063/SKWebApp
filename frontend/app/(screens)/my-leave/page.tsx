import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAuth } from "@/server/lib/rbac";
import { getLeaveBalances, getMyLeaveRequestsPage } from "@/server/actions/leave";
import { MyLeaveRequestList } from "./my-leave-request-list";
import { LeaveRequestForm } from "./leave-request-form";
import { CalendarDays, Palmtree, Heart, Briefcase, FileText } from "lucide-react";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CASUAL: Palmtree,
  EARNED: Briefcase,
  SICK: Heart,
};

type SearchParams = Promise<{ page?: string }>;

export default async function MyLeavePage({ searchParams }: { searchParams: SearchParams }) {
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

  const params = await searchParams;
  // Scoped in the query: this used to pull every request in the company and
  // then discard all but the current employee's.
  const [balances, { data: myRequests, page, limit, total, totalPages }] = await Promise.all([
    getLeaveBalances(user.employeeId),
    getMyLeaveRequestsPage({ employeeId: user.employeeId, page: params.page }),
  ]);

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
          <MyLeaveRequestList
            requests={myRequests}
            total={total}
            page={page}
            pageSize={limit}
            totalPages={totalPages}
          />
        </CardContent>
      </Card>
    </div>
  );
}
