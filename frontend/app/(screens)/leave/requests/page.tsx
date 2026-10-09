import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getLeaveRequestsPage } from "@/server/actions/leave";
import { requireAuth } from "@/server/lib/rbac";
import { CalendarDays, Clock, CheckCircle2, XCircle, ArrowLeft, Filter } from "lucide-react";
import { LeaveRequestList } from "./request-list";

const STATUS_TABS = [
  { key: "PENDING", label: "Pending", icon: Clock, color: "text-amber-600" },
  { key: "APPROVED", label: "Approved", icon: CheckCircle2, color: "text-emerald-600" },
  { key: "REJECTED", label: "Rejected", icon: XCircle, color: "text-rose-600" },
] as const;

type StatusKey = (typeof STATUS_TABS)[number]["key"];

type SearchParams = Promise<{ status?: string; page?: string }>;

function isStatusKey(v: string | undefined): v is StatusKey {
  return !!v && STATUS_TABS.some((t) => t.key === v);
}

export default async function LeaveRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAuth();
  const params = await searchParams;
  const status: StatusKey = isStatusKey(params.status) ? params.status : "PENDING";

  const { data: requests, page, limit, total, totalPages, counts } = await getLeaveRequestsPage({
    status,
    page: params.page,
  });

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
            <Badge variant="secondary" className="ml-1">{total}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveRequestList
            requests={requests}
            status={status}
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
