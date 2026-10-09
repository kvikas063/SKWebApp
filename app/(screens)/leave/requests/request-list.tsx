"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import { LeaveReviewButtons } from "../leave-review-buttons";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

type StatusKey = "PENDING" | "APPROVED" | "REJECTED";

export type LeaveRequestRow = {
  id: string;
  leaveType: string;
  startDate: string | Date;
  endDate: string | Date;
  dayType: string;
  days: number;
  reason: string | null;
  reviewNote: string | null;
  status: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    department: string | null;
    designation: string | null;
  };
};

const STATUS_ICON = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
} as const;

export function LeaveRequestList({
  requests,
  status,
  total,
  page,
  pageSize,
  totalPages,
}: {
  requests: LeaveRequestRow[];
  status: StatusKey;
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
    const Icon = STATUS_ICON[status];
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="font-medium">No {status.toLowerCase()} requests</p>
        <p className="text-sm text-muted-foreground">Nothing here at the moment.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {requests.map((req) => (
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

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={total}
        pageSize={pageSize}
        onPageChange={goTo}
        className="mt-4 border-t-0 px-0"
      />
    </>
  );
}