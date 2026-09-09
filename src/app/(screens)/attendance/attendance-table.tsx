"use client";

import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { CalendarOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "PRESENT" | "ABSENT" | "LOP" | "HALF_DAY" | "HOLIDAY" | "LEAVE" | string;

type Record = {
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

const PAGE_SIZE = 20;

export function AttendanceTable({ records }: { records: Record[] }) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const totalBeforeFilter = records.length;
  const filtered = useMemo(
    () => (statusFilter === "ALL" ? records : records.filter((r) => r.status === statusFilter)),
    [records, statusFilter]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  function goTo(p: number) {
    setPage(Math.min(Math.max(1, p), totalPages));
  }

  if (records.length === 0) {
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
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as "ALL" | Status); setPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All statuses ({totalBeforeFilter})</option>
          {Array.from(new Set(records.map((r) => r.status))).map((s) => {
            const count = records.filter((r) => r.status === s).length;
            return (
              <option key={s} value={s}>
                {s.replace("_", " ")} ({count})
              </option>
            );
          })}
        </select>
        <div className="text-xs text-muted-foreground sm:ml-auto">
          <span className="font-semibold text-foreground">{filtered.length}</span> record{filtered.length === 1 ? "" : "s"}
          {statusFilter !== "ALL" && <span> · filtered</span>}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="font-medium">No records match this filter</p>
          <p className="text-sm text-muted-foreground">Try a different status.</p>
          <Button variant="outline" size="sm" onClick={() => { setStatusFilter("ALL"); setPage(1); }}>
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
              {paged.map((r) => (
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

          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{(page - 1) * PAGE_SIZE + 1}</span>–
                <span className="font-semibold text-foreground">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                <span className="font-semibold text-foreground">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(1)} disabled={page === 1} aria-label="First page">
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(page - 1)} disabled={page === 1} aria-label="Previous page">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 7) return true;
                    if (p === 1 || p === totalPages) return true;
                    if (Math.abs(p - page) <= 1) return true;
                    return false;
                  })
                  .reduce<Array<number | "ellipsis">>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("ellipsis");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    typeof item === "number" ? (
                      <Button
                        key={item}
                        variant={item === page ? "default" : "outline"}
                        size="icon"
                        className={cn(
                          "h-8 w-8 text-xs font-semibold tabular-nums",
                          item === page && "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
                        )}
                        onClick={() => goTo(item)}
                      >
                        {item}
                      </Button>
                    ) : (
                      <span key={`e-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                    )
                  )}
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(page + 1)} disabled={page === totalPages} aria-label="Next page">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goTo(totalPages)} disabled={page === totalPages} aria-label="Last page">
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
