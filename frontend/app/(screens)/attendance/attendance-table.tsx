"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";
import { CalendarOff } from "lucide-react";

type Status = "PRESENT" | "ABSENT" | "LOP" | "HALF_DAY" | "HOLIDAY" | "LEAVE" | string;

type AttendanceRow = {
  id: string;
  date: string | Date;
  punchIn: string | Date | null;
  punchOut: string | Date | null;
  status: Status;
  employee: { firstName: string; lastName: string };
};

const statusVariant = (status: string) => {
  switch (status) {
    case "PRESENT": return "success" as const;
    case "ABSENT":
    case "LOP": return "destructive" as const;
    case "HALF_DAY": return "warning" as const;
    case "HOLIDAY": return "default" as const;
    default: return "secondary" as const;
  }
};

export function AttendanceTable({
  records,
  total,
  page,
  pageSize,
  totalPages,
  statusCounts,
  isFiltered,
}: {
  records: AttendanceRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: { status: string; count: number }[];
  isFiltered: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const status = searchParams.get("status") ?? "ALL";
  const totalAll = statusCounts.reduce((sum, s) => sum + s.count, 0);

  // Both the filter and the page live in the URL, so the server does the
  // filtering and paging. Changing either rewrites the query string.
  function navigate(updates: Record<string, string | null>, { resetPage = true } = {}) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    // A deep page number can land past the end of a narrower result set, so any
    // filter change returns to the first page.
    if (resetPage) next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  if (totalAll === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <CalendarOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium">No attendance records</p>
        <p className="text-sm text-muted-foreground">No records for this month yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
        <select
          value={status}
          onChange={(e) => navigate({ status: e.target.value === "ALL" ? null : e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All statuses ({totalAll})</option>
          {statusCounts.map((s) => (
            <option key={s.status} value={s.status}>
              {s.status.replace("_", " ")} ({s.count})
            </option>
          ))}
        </select>
        <div className="text-xs text-muted-foreground sm:ml-auto">
          <span className="font-semibold text-foreground">{total}</span> record{total === 1 ? "" : "s"}
          {isFiltered && <span> · filtered</span>}
        </div>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="font-medium">No records match this filter</p>
          <p className="text-sm text-muted-foreground">Try a different status.</p>
          <Button variant="outline" size="sm" onClick={() => navigate({ status: null })}>
            Clear filter
          </Button>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Punch In</TableHead>
                <TableHead>Punch Out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.employee.firstName} {r.employee.lastName}
                  </TableCell>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell>
                    {r.punchIn
                      ? new Date(r.punchIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {r.punchOut
                      ? new Date(r.punchOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(r.status)}>{r.status.replace("_", " ")}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={total}
            pageSize={pageSize}
            onPageChange={(next) => navigate({ page: next === 1 ? null : String(next) }, { resetPage: false })}
          />
        </>
      )}
    </>
  );
}
