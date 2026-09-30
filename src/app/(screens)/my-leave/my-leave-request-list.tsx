"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export type MyLeaveRequestRow = {
  id: string;
  leaveType: string;
  startDate: string | Date;
  endDate: string | Date;
  days: number;
  status: string;
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

export function MyLeaveRequestList({
  requests,
  total,
  page,
  pageSize,
  totalPages,
}: {
  requests: MyLeaveRequestRow[];
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
    return <p className="text-sm text-muted-foreground">No leave requests yet.</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {requests.map((req) => {
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