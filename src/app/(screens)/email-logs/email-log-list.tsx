"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/utils";
import { Mail, CheckCircle2, XCircle, Clock } from "lucide-react";
import { EmailLogActions } from "./email-log-actions";

export type EmailLogRow = {
  id: string;
  subject: string;
  to: string;
  template: string;
  status: string;
  error: string | null;
  sentAt: string | Date | null;
  createdAt: string | Date;
};

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

function StatusIcon({ status }: { status: string }) {
  if (status === "SENT") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "FAILED") return <XCircle className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

function statusClasses(status: string) {
  if (status === "SENT") return "bg-emerald-500 text-white shadow-sm";
  if (status === "FAILED") return "bg-rose-500 text-white shadow-sm";
  return "bg-amber-500 text-white shadow-sm";
}

export function EmailLogList({
  logs,
  total,
  page,
  pageSize,
  totalPages,
}: {
  logs: EmailLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function goTo(p: number) {
    const next = new URLSearchParams(searchParams.toString());
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Mail className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium">No emails sent yet</p>
        <p className="text-sm text-muted-foreground">
          System emails (payslips, leaves, invites) will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y">
        {logs.map((log) => (
          <li key={log.id} className="flex items-start gap-3 p-4">
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${statusClasses(log.status)}`}>
              <StatusIcon status={log.status} />
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

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={total}
        pageSize={pageSize}
        onPageChange={goTo}
      />
    </>
  );
}