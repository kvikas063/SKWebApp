"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { formatINR } from "@/lib/money";
import { PayslipPreviewDialog } from "./payslip-preview-dialog";

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

export function PayslipsTable({
  slips,
  total,
  page,
  pageSize,
  totalPages,
}: {
  slips: Slip[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // The page lives in the URL so the server does the slicing.
  function goTo(p: number) {
    const next = new URLSearchParams(searchParams.toString());
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
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
          {slips.map((slip) => (
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