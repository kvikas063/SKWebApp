import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { getEmailLogStats, getEmailLogs } from "@/lib/actions/email-logs";
import { Mail, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { EmailLogActions } from "./email-log-actions";

const statusVariant: Record<string, "default" | "success" | "destructive" | "warning" | "secondary"> = {
  SENT: "success",
  FAILED: "destructive",
  QUEUED: "warning",
  BOUNCED: "destructive",
};

const templateLabels: Record<string, string> = {
  PAYSLIP_READY: "Payslip ready",
  LEAVE_APPROVED: "Leave approved",
  LEAVE_REJECTED: "Leave rejected",
  LEAVE_SUBMITTED: "Leave submitted",
  PASSWORD_RESET: "Password reset",
  MONTHLY_PAYROLL_SUMMARY: "Payroll summary",
  WELCOME: "Welcome",
  PUNCH_REMINDER: "Punch reminder",
  PROFILE_APPROVED: "Profile approved",
  PROFILE_REJECTED: "Profile rejected",
  ANNOUNCEMENT: "Announcement",
};

export default async function EmailLogsPage() {
  await requireAdmin();
  const company = await prisma.company.findFirst();
  if (!company) return null;

  const [stats, logs] = await Promise.all([
    getEmailLogStats(company.id),
    getEmailLogs(company.id),
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
          <CardDescription>{logs.length} most recent email{logs.length === 1 ? "" : "s"}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">No emails sent yet</p>
              <p className="text-sm text-muted-foreground">System emails (payslips, leaves, invites) will appear here.</p>
            </div>
          ) : (
              <ul className="divide-y">
                {logs.map((log) => (
                  <li key={log.id} className="flex items-start gap-3 p-4">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      log.status === "SENT" ? "bg-emerald-500 text-white shadow-sm" :
                      log.status === "FAILED" ? "bg-rose-500 text-white shadow-sm" :
                      "bg-amber-500 text-white shadow-sm"
                    }`}>
                      {log.status === "SENT" ? <CheckCircle2 className="h-4 w-4" /> :
                       log.status === "FAILED" ? <XCircle className="h-4 w-4" /> :
                       <Clock className="h-4 w-4" />}
                    </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <p className="text-sm font-semibold">{log.subject}</p>
                      <Badge variant={statusVariant[log.status] || "secondary"}>{log.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      To: {log.to} · Template: {templateLabels[log.template] || log.template}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.sentAt ? `Sent ${formatDateTime(log.sentAt)}` : `Queued ${formatDateTime(log.createdAt)}`}
                    </p>
                    {log.error && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">Error: {log.error}</p>
                    )}
                  </div>
                  {log.status === "FAILED" && <EmailLogActions logId={log.id} />}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
