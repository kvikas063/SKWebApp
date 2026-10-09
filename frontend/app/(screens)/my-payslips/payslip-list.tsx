"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/money";
import { getMonthName } from "@/lib/utils";
import { PayslipPreviewDialog } from "../payroll/[id]/payslip-preview-dialog";
import { DownloadPayslipButton } from "@/components/payslip/download-payslip-button";
import { Calendar, Banknote, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Slip = {
  id: string;
  paidDays: number;
  lopDays: number;
  grossPaise: number;
  totalDeductionsPaise: number;
  netPaise: number;
  payRun: { id: string; year: number; month: number; status: string };
  deductionsJson?: Array<{ name: string; amountPaise: number }> | null;
};

const PAGE_SIZE = 12;

export function PayslipList({ slips }: { slips: Slip[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(slips.length / PAGE_SIZE));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return slips.slice(start, start + PAGE_SIZE);
  }, [slips, page]);

  function goTo(p: number) {
    setPage(Math.min(Math.max(1, p), totalPages));
  }

  if (slips.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Banknote className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">No payslips yet</p>
          <p className="text-sm text-muted-foreground">Finalized payslips will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3">
        {paged.map((slip) => (
          <Card key={slip.id} className="transition-all hover:border-indigo-200 hover:shadow-md dark:hover:border-indigo-900">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{getMonthName(slip.payRun.month)} {slip.payRun.year}</p>
                    <p className="text-xs text-muted-foreground">
                      {slip.paidDays} paid days · {slip.lopDays} LOP
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-muted-foreground">Gross · Ded · Net</p>
                    <p className="text-sm font-medium">
                      {formatINR(slip.grossPaise)} · {formatINR(slip.totalDeductionsPaise)} · {formatINR(slip.netPaise)}
                    </p>
                    {slip.deductionsJson && slip.deductionsJson.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1">
                        {slip.deductionsJson.map((d) => (
                          <span
                            key={d.name}
                            className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {d.name}: {formatINR(d.amountPaise)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatINR(slip.netPaise)}</p>
                    <p className="text-[10px] text-muted-foreground">net</p>
                  </div>
                  <DownloadPayslipButton slipId={slip.id} />
                  <PayslipPreviewDialog slipId={slip.id} triggerLabel="View" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(page - 1) * PAGE_SIZE + 1}</span>–
            <span className="font-semibold text-foreground">{Math.min(page * PAGE_SIZE, slips.length)}</span> of{" "}
            <span className="font-semibold text-foreground">{slips.length}</span>
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
  );
}
