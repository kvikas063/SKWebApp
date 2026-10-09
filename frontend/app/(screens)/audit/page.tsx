import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAdmin } from "@/server/lib/rbac";
import { getAuditLogsPage } from "@/server/services-audit";
import { ScrollText, Activity, User, Database } from "lucide-react";
import { AuditLogTable } from "./audit-log-table";

type SearchParams = Promise<{ page?: string; action?: string }>;

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;

  const { data: logs, page, limit, total, totalPages, summary, actionCounts } =
    await getAuditLogsPage({ page: params.page, action: params.action });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Append-only activity log of system events"
        icon={ScrollText}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Events" value={summary.total} icon={<Database className="h-5 w-5" />} accent="from-indigo-500 to-violet-500" />
        <StatCard title="Today" value={summary.todayCount} icon={<Activity className="h-5 w-5" />} accent="from-emerald-500 to-teal-500" />
        <StatCard title="Unique Actors" value={summary.uniqueActors} icon={<User className="h-5 w-5" />} accent="from-amber-500 to-orange-500" />
      </div>

      <Card>
        <CardContent className="p-0">
          <AuditLogTable
            logs={logs}
            total={total}
            page={page}
            pageSize={limit}
            totalPages={totalPages}
            actionCounts={actionCounts}
          />
        </CardContent>
      </Card>
    </div>
  );
}