import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { prisma } from "@/lib/prisma";
import { Mail, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { requireAdmin } from "@/lib/rbac";
import { getEmailLogStats, getEmailLogsPage } from "@/lib/actions/email-logs";
import { EmailLogList } from "./email-log-list";

type SearchParams = Promise<{ page?: string }>;

export default async function EmailLogsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const company = await prisma.company.findFirst();
  if (!company) return null;

  const params = await searchParams;
  const [stats, { data: logs, page, limit, total, totalPages }] = await Promise.all([
    getEmailLogStats(company.id),
    getEmailLogsPage(company.id, { page: params.page }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Log"
        description="All transactional emails sent by the system"
        icon={Mail}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total" value={stats.total} icon={<FileText className="h-5 w-5" />} accent="from-indigo-500 to-violet-500" />
        <StatCard title="Sent" value={stats.sent} icon={<CheckCircle2 className="h-5 w-5" />} accent="from-emerald-500 to-teal-500" />
        <StatCard title="Failed" value={stats.failed} icon={<XCircle className="h-5 w-5" />} accent="from-rose-500 to-pink-500" />
        <StatCard title="Queued" value={stats.queued} icon={<Clock className="h-5 w-5" />} accent="from-amber-500 to-orange-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Emails</CardTitle>
          <CardDescription>
            {total} email{total === 1 ? "" : "s"} sent by the system
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <EmailLogList
            logs={logs}
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
