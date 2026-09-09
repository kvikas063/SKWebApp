"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, FileText } from "lucide-react";

type PaySlip = {
  id: string;
  employee: { firstName: string; lastName: string; employeeCode: string; department: string | null; designation: string | null; pan: string | null; bankAccountNo: string | null; bankIfsc: string | null };
  grossPaise: number;
  netPaise: number;
  totalDeductionsPaise: number;
  paidDays: number;
  lopDays: number;
  earningsJson: unknown;
  deductionsJson: unknown;
  statutoryJson: unknown;
};

type Company = { name: string; address?: string | null; city?: string | null; state?: string | null; pincode?: string | null; pan?: string | null; tan?: string | null };

type PayRunLike = {
  id: string;
  year: number;
  month: number;
  status: string;
  totalGrossPaise: number;
  totalDeductionsPaise: number;
  totalNetPaise: number;
  company: Company;
  paySlips: PaySlip[];
};

function inr(paise: number) {
  return (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthName(m: number) {
  return new Date(2000, m - 1, 1).toLocaleString("en-IN", { month: "long" });
}

export function PrintSummaryDialog({ payRun }: { payRun: PayRunLike }) {
  const [open, setOpen] = useState(false);
  const [printing, setPrinting] = useState(false);

  const earningsAgg: Record<string, number> = {};
  const deductionsAgg: Record<string, number> = {};
  for (const slip of payRun.paySlips) {
    const e = (slip.earningsJson as Array<{ name: string; amountPaise: number }> | null) ?? [];
    const d = (slip.deductionsJson as Array<{ name: string; amountPaise: number }> | null) ?? [];
    for (const item of e) earningsAgg[item.name] = (earningsAgg[item.name] ?? 0) + item.amountPaise;
    for (const item of d) deductionsAgg[item.name] = (deductionsAgg[item.name] ?? 0) + item.amountPaise;
  }
  const earnings = Object.entries(earningsAgg).sort(([, a], [, b]) => b - a);
  const deductions = Object.entries(deductionsAgg).sort(([, a], [, b]) => b - a);

  const totalPFEmp = payRun.paySlips.reduce((s, p) => s + (((p.statutoryJson as { pfEmployeePaise?: number } | null)?.pfEmployeePaise) ?? 0), 0);
  const totalPFEr = payRun.paySlips.reduce((s, p) => s + (((p.statutoryJson as { pfEmployerPaise?: number } | null)?.pfEmployerPaise) ?? 0), 0);
  const totalESIEmp = payRun.paySlips.reduce((s, p) => s + (((p.statutoryJson as { esiEmployeePaise?: number } | null)?.esiEmployeePaise) ?? 0), 0);
  const totalESIEr = payRun.paySlips.reduce((s, p) => s + (((p.statutoryJson as { esiEmployerPaise?: number } | null)?.esiEmployerPaise) ?? 0), 0);
  const totalPT = payRun.paySlips.reduce((s, p) => s + (((p.statutoryJson as { ptPaise?: number } | null)?.ptPaise) ?? 0), 0);
  const totalTDS = payRun.paySlips.reduce((s, p) => s + (((p.statutoryJson as { tdsPaise?: number } | null)?.tdsPaise) ?? 0), 0);

  const companyAddr = [payRun.company.address, payRun.company.city, payRun.company.state, payRun.company.pincode].filter(Boolean).join(", ");

  const paperRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    setPrinting(true);
    if (!paperRef.current) {
      setPrinting(false);
      return;
    }
    const paperHtml = paperRef.current.outerHTML;
    const baseHref = window.location.origin;
    const headHtml = document.head.innerHTML
      .replace(/href="\/_next\//g, `href="${baseHref}/_next/`)
      .replace(/href="\/favicon/g, `href="${baseHref}/favicon`)
      .replace(/<base[^>]*>/i, `<base href="${baseHref}/">`);
    const blob = new Blob(
      [
        `<!doctype html><html><head><meta charset="utf-8"><title>Pay Run Summary</title><base href="${baseHref}/">${headHtml}<style>html,body{background:#fff!important;color:#0f172a;margin:0;padding:0;}@page{size:A4;margin:12mm;}@media print{html,body{background:#fff!important;}.no-print{display:none!important;}}</style></head><body>${paperHtml}</body></html>`,
      ],
      { type: "text/html" }
    );
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.addEventListener("load", () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => {
            URL.revokeObjectURL(url);
            iframe.remove();
            setPrinting(false);
          }, 500);
        }
      }, 350);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Printer className="h-4 w-4" />
          Print Summary
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-5xl gap-0 p-0 sm:max-w-5xl print:max-w-none print:border-0 print:shadow-none print:bg-white"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex max-h-[90vh] flex-col print:max-h-none">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 pl-6 pr-14 py-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Pay Run Summary</h2>
                <p className="text-xs text-muted-foreground">Preview the printable summary before sending to printer</p>
              </div>
            </div>
            <Button
              onClick={handlePrint}
              disabled={printing}
              size="sm"
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm hover:from-indigo-600 hover:to-violet-700"
            >
              {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
              Print
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto bg-muted p-6 print:bg-white print:p-0 print:overflow-visible">
            <div ref={paperRef} className="mx-auto max-w-3xl bg-white p-10 text-slate-900 shadow-md print:max-w-none print:p-10 print:shadow-none print-area">
              <SummaryContent
                payRun={payRun}
                earnings={earnings}
                deductions={deductions}
                totalPFEmp={totalPFEmp}
                totalPFEr={totalPFEr}
                totalESIEmp={totalESIEmp}
                totalESIEr={totalESIEr}
                totalPT={totalPT}
                totalTDS={totalTDS}
                companyAddr={companyAddr}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryContent({
  payRun,
  earnings,
  deductions,
  totalPFEmp,
  totalPFEr,
  totalESIEmp,
  totalESIEr,
  totalPT,
  totalTDS,
  companyAddr,
}: {
  payRun: PayRunLike;
  earnings: [string, number][];
  deductions: [string, number][];
  totalPFEmp: number;
  totalPFEr: number;
  totalESIEmp: number;
  totalESIEr: number;
  totalPT: number;
  totalTDS: number;
  companyAddr: string;
}) {
  return (
    <div className="space-y-6 text-[11px] leading-relaxed">
      <div className="border-b border-slate-300 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{payRun.company.name}</h1>
            {companyAddr && <p className="text-slate-600">{companyAddr}</p>}
            <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-500">
              {payRun.company.pan && <span><strong>PAN:</strong> {payRun.company.pan}</span>}
              {payRun.company.tan && <span><strong>TAN:</strong> {payRun.company.tan}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Pay Run Summary</p>
            <p className="text-base font-semibold text-slate-900">{monthName(payRun.month)} {payRun.year}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Run Totals</h2>
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Employees" value={String(payRun.paySlips.length)} />
          <Stat label="Gross Payout" value={`₹ ${inr(payRun.totalGrossPaise)}`} />
          <Stat label="Total Deductions" value={`₹ ${inr(payRun.totalDeductionsPaise)}`} />
          <Stat label="Net Payout" value={`₹ ${inr(payRun.totalNetPaise)}`} highlight />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Statutory Contributions</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="PF (Employee + Employer)" value={`₹ ${inr(totalPFEmp + totalPFEr)}`} />
          <Stat label="ESI (Employee + Employer)" value={`₹ ${inr(totalESIEmp + totalESIEr)}`} />
          <Stat label="PT + TDS" value={`₹ ${inr(totalPT + totalTDS)}`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Earnings Breakdown</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-1 text-left text-[10px] font-semibold uppercase text-slate-500">Component</th>
                <th className="py-1 text-right text-[10px] font-semibold uppercase text-slate-500">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {earnings.length === 0 ? (
                <tr><td colSpan={2} className="py-2 text-center italic text-slate-500">No earnings recorded</td></tr>
              ) : (
                earnings.map(([name, paise]) => (
                  <tr key={name} className="border-b border-slate-200">
                    <td className="py-1 text-slate-800">{name}</td>
                    <td className="py-1 text-right tabular-nums text-slate-900">{inr(paise)}</td>
                  </tr>
                ))
              )}
              <tr className="border-t-2 border-slate-400">
                <td className="py-1 font-bold text-slate-900">Total Gross</td>
                <td className="py-1 text-right font-bold tabular-nums text-slate-900">{inr(payRun.totalGrossPaise)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Deductions Breakdown</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-1 text-left text-[10px] font-semibold uppercase text-slate-500">Component</th>
                <th className="py-1 text-right text-[10px] font-semibold uppercase text-slate-500">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {deductions.length === 0 ? (
                <tr><td colSpan={2} className="py-2 text-center italic text-slate-500">No deductions recorded</td></tr>
              ) : (
                deductions.map(([name, paise]) => (
                  <tr key={name} className="border-b border-slate-200">
                    <td className="py-1 text-slate-800">{name}</td>
                    <td className="py-1 text-right tabular-nums text-slate-900">{inr(paise)}</td>
                  </tr>
                ))
              )}
              <tr className="border-t-2 border-slate-400">
                <td className="py-1 font-bold text-slate-900">Total Deductions</td>
                <td className="py-1 text-right font-bold tabular-nums text-slate-900">{inr(payRun.totalDeductionsPaise)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">Employee Roster</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="py-1 text-left text-[10px] font-semibold uppercase text-slate-500">#</th>
              <th className="py-1 text-left text-[10px] font-semibold uppercase text-slate-500">Employee</th>
              <th className="py-1 text-left text-[10px] font-semibold uppercase text-slate-500">Code</th>
              <th className="py-1 text-left text-[10px] font-semibold uppercase text-slate-500">Department</th>
              <th className="py-1 text-left text-[10px] font-semibold uppercase text-slate-500">Bank A/c</th>
              <th className="py-1 text-left text-[10px] font-semibold uppercase text-slate-500">IFSC</th>
              <th className="py-1 text-right text-[10px] font-semibold uppercase text-slate-500">Gross</th>
              <th className="py-1 text-right text-[10px] font-semibold uppercase text-slate-500">Ded</th>
              <th className="py-1 text-right text-[10px] font-semibold uppercase text-slate-500">Net</th>
            </tr>
          </thead>
          <tbody>
            {payRun.paySlips.map((slip, i) => (
              <tr key={slip.id} className="border-b border-slate-200">
                <td className="py-1 text-slate-500">{i + 1}</td>
                <td className="py-1 text-slate-800">{slip.employee.firstName} {slip.employee.lastName}</td>
                <td className="py-1 font-mono text-[10px] text-slate-600">{slip.employee.employeeCode}</td>
                <td className="py-1 text-slate-600">{slip.employee.department || "—"}</td>
                <td className="py-1 font-mono text-[10px] text-slate-600">{slip.employee.bankAccountNo || "—"}</td>
                <td className="py-1 font-mono text-[10px] text-slate-600">{slip.employee.bankIfsc || "—"}</td>
                <td className="py-1 text-right tabular-nums text-slate-800">{inr(slip.grossPaise)}</td>
                <td className="py-1 text-right tabular-nums text-slate-800">{inr(slip.totalDeductionsPaise)}</td>
                <td className="py-1 text-right font-semibold tabular-nums text-slate-900">{inr(slip.netPaise)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-400">
              <td colSpan={6} className="py-1 text-right font-bold text-slate-900">Totals</td>
              <td className="py-1 text-right font-bold tabular-nums text-slate-900">{inr(payRun.totalGrossPaise)}</td>
              <td className="py-1 text-right font-bold tabular-nums text-slate-900">{inr(payRun.totalDeductionsPaise)}</td>
              <td className="py-1 text-right font-bold tabular-nums text-slate-900">{inr(payRun.totalNetPaise)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="print-footer border-t border-slate-300 pt-3 text-[10px] text-slate-500">
        <p>This is a system-generated summary. No signature required.</p>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded border ${highlight ? "border-slate-900 bg-slate-50" : "border-slate-300"} p-2`}>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-bold tabular-nums ${highlight ? "text-slate-900" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}
