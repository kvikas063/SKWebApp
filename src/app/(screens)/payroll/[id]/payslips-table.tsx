"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/money";
import { PayslipPreviewDialog } from "./payslip-preview-dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type Slip = {
  id: string;
  paidDays: number;
  lopDays: number;
  grossPaise: number;
  totalDeductionsPaise: number;
  netPaise: number;
  employee: {
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
};

const PAGE_SIZE = 15;

export function PayslipsTable({ slips }: { slips: Slip[] }) {
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

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead className="text-right">Paid Days</TableHead>
            <TableHead className="text-right">LOP</TableHead>
            <TableHead className="text-right">Gross</TableHead>
            <TableHead className="text-right">Deductions</TableHead>
            <TableHead className="text-right">Net</TableHead>
            <TableHead className="text-right">Payslip</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((slip) => (
            <TableRow key={slip.id}>
              <TableCell className="font-medium">
                <Link href={`/employees/${slip.employee.employeeCode}`} className="hover:underline">
                  {slip.employee.firstName} {slip.employee.lastName}
                </Link>
                <p className="text-[10px] font-mono text-muted-foreground">{slip.employee.employeeCode}</p>
              </TableCell>
              <TableCell className="text-right">{slip.paidDays}</TableCell>
              <TableCell className="text-right">{slip.lopDays}</TableCell>
              <TableCell className="text-right">{formatINR(slip.grossPaise)}</TableCell>
              <TableCell className="text-right">{formatINR(slip.totalDeductionsPaise)}</TableCell>
              <TableCell className="text-right font-semibold">{formatINR(slip.netPaise)}</TableCell>
              <TableCell className="text-right">
                <PayslipPreviewDialog slipId={slip.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(page - 1) * PAGE_SIZE + 1}</span>–
            <span className="font-semibold text-foreground">{Math.min(page * PAGE_SIZE, slips.length)}</span> of{" "}
            <span className="font-semibold text-foreground">{slips.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goTo(1)}
              disabled={page === 1}
              aria-label="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
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
                  <span key={`e-${i}`} className="px-1 text-xs text-muted-foreground">
                    …
                  </span>
                )
              )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goTo(totalPages)}
              disabled={page === totalPages}
              aria-label="Last page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
