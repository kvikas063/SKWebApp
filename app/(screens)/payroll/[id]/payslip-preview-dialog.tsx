"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Eye } from "lucide-react";
import { paiseToRupees } from "@/lib/money";
import { getMonthName } from "@/lib/utils";

type PaySlipPreview = {
  id: string;
  grossPaise: number;
  netPaise: number;
  totalDeductionsPaise: number;
  paidDays: number;
  lopDays: number;
  daysPresent: number;
  daysAbsent: number;
  earningsJson: Array<{ name: string; amountPaise: number }> | null;
  deductionsJson: Array<{ name: string; amountPaise: number }> | null;
  statutoryJson: {
    pfEmployeePaise: number;
    pfEmployerPaise: number;
    esiEmployeePaise: number;
    esiEmployerPaise: number;
    ptPaise: number;
    tdsPaise: number;
  } | null;
  employee: {
    employeeCode: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    designation: string | null;
    department: string | null;
    pan: string | null;
    uan: string | null;
    bankName: string | null;
    bankAccountNo: string | null;
    bankIfsc: string | null;
  };
  payRun: {
    year: number;
    month: number;
    status: string;
    company: {
      name: string;
      address: string | null;
      city: string | null;
      state: string | null;
      pincode: string | null;
      pan: string | null;
      tan: string | null;
    };
  };
};

function inr(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function chunk(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + chunk(n % 100) : "");
  }
  let result = "";
  let n = num;
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const rest = n;
  if (crore) result += chunk(crore) + " Crore ";
  if (lakh) result += chunk(lakh) + " Lakh ";
  if (thousand) result += chunk(thousand) + " Thousand ";
  if (rest) result += chunk(rest);
  return result.trim() + " Rupees Only";
}

export function PayslipPreviewDialog({ slipId, triggerLabel = "Preview" }: { slipId: string; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaySlipPreview | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/payslips/${slipId}/preview`);
      if (!res.ok) throw new Error("Failed to load preview");
      const json = (await res.json()) as PaySlipPreview;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [slipId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open && !data) load();
  }, [open, data, load]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/payslips/${slipId}/pdf`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") ?? "";
      const m = cd.match(/filename="([^"]+)"/);
      a.download = m?.[1] ?? `payslip-${slipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm hover:from-indigo-700 hover:to-violet-700"
      >
        <Eye className="h-3.5 w-3.5" />
        {triggerLabel}
      </Button>
      <DialogContent className="max-w-4xl gap-0 p-0 sm:max-w-4xl">
        <div className="flex max-h-[90vh] flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card pl-6 pr-14 py-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-foreground">Payslip Preview</h2>
              <p className="truncate text-xs text-muted-foreground">Review the payslip before downloading the PDF</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button onClick={handleDownload} disabled={downloading || loading || !data} size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download PDF
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-muted p-6">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex h-64 items-center justify-center text-sm text-rose-600">{error}</div>
            ) : data ? (
              <PayslipPaper data={data} />
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PayslipPaper({ data }: { data: PaySlipPreview }) {
  const company = data.payRun.company;
  const companyAddr = [company.address, company.city, company.state, company.pincode].filter(Boolean).join(", ");
  const stat = data.statutoryJson;
  const fullName = `${data.employee.firstName ?? ""} ${data.employee.lastName ?? ""}`.trim() || "—";
  const monthName = getMonthName(data.payRun.month);
  const lastDay = new Date(data.payRun.year, data.payRun.month, 0).getDate();
  const netRupees = paiseToRupees(data.netPaise);

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-md border border-slate-200 bg-white text-gray-900 shadow-2xl dark:border-slate-700">
      {/* Header */}
      <div className="bg-blue-900 px-6 py-3.5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-bold">{company.name}</div>
            {companyAddr && <div className="mt-0.5 text-[8px] text-blue-200">{companyAddr}</div>}
            {company.pan && <div className="text-[8px] text-blue-200">PAN: {company.pan}  ·  TAN: {company.tan ?? "—"}</div>}
          </div>
          <div className="text-right">
            <div className="text-[13px] font-bold uppercase tracking-widest">Payslip</div>
            <div className="mt-0.5 text-[9px] text-blue-200">{monthName} {data.payRun.year}</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3.5">
        {/* Employee Details */}
        <div className="mb-2.5">
          <div className="border-b border-blue-900 bg-slate-100 px-2 py-1">
            <div className="text-[9px] font-bold uppercase tracking-wider text-blue-900">Employee Details</div>
          </div>
          <div className="grid grid-cols-4 border border-slate-300 border-t-0">
            <EmpCell label="Employee Name" value={fullName} />
            <EmpCell label="Employee ID" value={data.employee.employeeCode} />
            <EmpCell label="Designation" value={data.employee.designation ?? "—"} />
            <EmpCell label="Department" value={data.employee.department ?? "—"} />
            <EmpCell label="Email" value={data.employee.email} />
            <EmpCell label="PAN" value={data.employee.pan ?? "—"} />
            <EmpCell label="UAN / PF No." value={data.employee.uan ?? "—"} />
            <EmpCell label="Pay Date" value={`${monthName} ${lastDay}, ${data.payRun.year}`} />
            <EmpCell label="Bank Name" value={data.employee.bankName ?? "—"} />
            <EmpCell label="Account No." value={data.employee.bankAccountNo ?? "—"} />
            <EmpCell label="IFSC" value={data.employee.bankIfsc ?? "—"} />
          </div>
        </div>

        {/* Attendance */}
        <div className="mb-2.5 grid grid-cols-4 gap-1">
          <AttCell label="Paid Days" value={String(data.paidDays)} />
          <AttCell label="LOP Days" value={String(data.lopDays)} />
          <AttCell label="Days Present" value={String(data.daysPresent)} />
          <AttCell label="Days Absent" value={String(data.daysAbsent)} />
        </div>

        {/* Earnings + Deductions */}
        <div className="grid grid-cols-2 gap-2">
          <SlipTable
            title="Earnings"
            headerColor="bg-green-700"
            rows={(data.earningsJson ?? []).map((e) => ({ name: e.name, value: inr(paiseToRupees(e.amountPaise)) }))}
            totalLabel="Gross Earnings (A)"
            totalValue={inr(paiseToRupees(data.grossPaise))}
            emptyText="— No earnings —"
          />
          <SlipTable
            title="Deductions"
            headerColor="bg-red-700"
            rows={(data.deductionsJson ?? []).map((d) => ({ name: d.name, value: inr(paiseToRupees(d.amountPaise)) }))}
            totalLabel="Total Deductions (B)"
            totalValue={inr(paiseToRupees(data.totalDeductionsPaise))}
            emptyText="— No deductions —"
          />
        </div>

        {/* Net Pay */}
        <div className="mt-2.5 flex border border-blue-900">
          <div className="flex-1 bg-blue-900 px-4 py-2.5 text-white">
            <div className="text-[10px] font-bold uppercase tracking-widest">Net Pay (A − B)</div>
            <div className="mt-0.5 text-[8px] italic text-blue-200">{numberToWords(Math.round(netRupees))}</div>
          </div>
          <div className="flex w-[180px] items-center justify-end px-4 py-2.5">
            <div className="text-[18px] font-bold text-blue-900">₹ {inr(netRupees)}</div>
          </div>
        </div>

        {/* Bottom: Statutory + Bank */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {stat && (
            <div>
              <div className="bg-gray-700 px-2 py-1">
                <div className="text-[8px] font-bold uppercase tracking-wider text-white">Statutory Contributions (Employee)</div>
              </div>
              <div className="border border-gray-700 border-t-0">
                <BottomRow k="PF (Provident Fund)" v={inr(paiseToRupees(stat.pfEmployeePaise))} />
                <BottomRow k="ESI (State Insurance)" v={inr(paiseToRupees(stat.esiEmployeePaise))} />
                <BottomRow k="PT (Professional Tax)" v={inr(paiseToRupees(stat.ptPaise))} />
                <BottomRow k="TDS (Income Tax)" v={inr(paiseToRupees(stat.tdsPaise))} last />
              </div>
            </div>
          )}
          <div>
            <div className="bg-gray-700 px-2 py-1">
              <div className="text-[8px] font-bold uppercase tracking-wider text-white">Bank Details</div>
            </div>
            <div className="border border-gray-700 border-t-0">
              <BottomRow k="Bank Name" v={data.employee.bankName ?? "—"} />
              <BottomRow k="Account Number" v={data.employee.bankAccountNo ?? "—"} />
              <BottomRow k="IFSC Code" v={data.employee.bankIfsc ?? "—"} />
              <BottomRow k="Payment Mode" v="Bank Transfer" last />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-blue-900 bg-slate-50 px-6 py-2 text-[7.5px] text-slate-500">
        <span className="italic">This is a system-generated payslip and does not require a physical signature.</span>
        <span>Generated on {new Date().toLocaleDateString("en-IN")}</span>
      </div>
    </div>
  );
}

function EmpCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-r border-slate-200 p-1.5 last:border-r-0">
      <div className="text-[7px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-[9px] font-bold">{value || "—"}</div>
    </div>
  );
}

function AttCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border border-slate-300 bg-slate-50 px-2 py-1">
      <div className="text-[7px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-[12px] font-bold leading-none text-blue-900">{value}</div>
    </div>
  );
}

function SlipTable({
  title,
  headerColor,
  rows,
  totalLabel,
  totalValue,
  emptyText,
}: {
  title: string;
  headerColor: string;
  rows: { name: string; value: string }[];
  totalLabel: string;
  totalValue: string;
  emptyText?: string;
}) {
  return (
    <div>
      <div className={`px-2 py-1 ${headerColor}`}>
        <div className="text-[9px] font-bold uppercase tracking-wider text-white">{title}</div>
      </div>
      <table className="w-full border border-slate-300 border-t-0 text-[9px]">
        <thead>
          <tr className="bg-slate-200">
            <th className="px-2 py-1.5 text-left font-bold uppercase tracking-wider text-slate-700">Component</th>
            <th className="w-20 px-2 py-1.5 text-right font-bold uppercase tracking-wider text-slate-700">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={2} className="border-b border-slate-200 px-2 py-2 text-center italic text-slate-400">
                {emptyText ?? "—"}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.name} className={`border-b border-slate-200 ${i % 2 === 1 ? "bg-slate-50" : ""}`}>
                <td className="px-2 py-1.5 text-slate-700">{r.name}</td>
                <td className="px-2 py-1.5 text-right text-slate-700">{inr2(r.value)}</td>
              </tr>
            ))
          )}
          <tr className="bg-amber-100">
            <td className="border-t border-amber-900 px-2 py-1.5 font-bold text-amber-900">{totalLabel}</td>
            <td className="border-t border-amber-900 px-2 py-1.5 text-right font-bold text-amber-900">{inr2(totalValue)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function inr2(v: string) {
  return `₹ ${v}`;
}

function BottomRow({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <div className={`flex px-2 py-1 text-[8px] ${last ? "" : "border-b border-slate-200"}`}>
      <div className="flex-1 text-slate-500">{k}</div>
      <div className="flex-1 text-right font-bold text-slate-900">{v || "—"}</div>
    </div>
  );
}
