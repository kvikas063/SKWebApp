"use client";

import { FilePreviewDialog, type PreviewData } from "@/components/ui/file-preview-dialog";
import { FileSpreadsheet } from "lucide-react";

type PayRunRow = {
  month: string;
  year: number;
  gross: number;
  deductions: number;
  net: number;
};

type DeptRow = {
  department: string;
  headcount: number;
  monthlyCost: number;
};

function paiseToRupee(p: number) {
  return (p / 100).toFixed(2);
}

function inr(p: number) {
  return paiseToRupee(p);
}

export function ExportReportsButton({
  payRuns,
  departments,
  usingMock,
}: {
  payRuns: PayRunRow[];
  departments: DeptRow[];
  usingMock: boolean;
}) {
  async function fetchPreview(): Promise<PreviewData> {
    const totalGross = payRuns.reduce((s, r) => s + r.gross, 0);
    const totalNet = payRuns.reduce((s, r) => s + r.net, 0);
    const totalDed = payRuns.reduce((s, r) => s + r.deductions, 0);
    const totalHc = departments.reduce((s, d) => s + d.headcount, 0);
    const totalDeptCost = departments.reduce((s, d) => s + d.monthlyCost, 0);

    return {
      summary: [
        { label: "Pay Runs", value: String(payRuns.length) },
        { label: "YTD Gross", value: `₹${Number(inr(totalGross)).toLocaleString("en-IN")}` },
        { label: "YTD Net", value: `₹${Number(inr(totalNet)).toLocaleString("en-IN")}` },
        { label: "Departments", value: String(departments.length) },
      ],
      note: usingMock ? "This report contains sample/illustrative data." : undefined,
      headers: [
        { key: "section", label: "Section" },
        { key: "name", label: "Name" },
        { key: "metric1", label: "Gross (₹)", align: "right", format: (v) => (v ? Number(v).toLocaleString("en-IN") : "—") },
        { key: "metric2", label: "Deductions (₹)", align: "right", format: (v) => (v ? Number(v).toLocaleString("en-IN") : "—") },
        { key: "metric3", label: "Net (₹)", align: "right", format: (v) => (v ? Number(v).toLocaleString("en-IN") : "—") },
      ],
      rows: [
        ...payRuns.map((r) => ({
          section: "Pay Run",
          name: `${r.month} ${r.year}`,
          metric1: inr(r.gross),
          metric2: inr(r.deductions),
          metric3: inr(r.net),
        })),
        ...departments.map((d) => ({
          section: "Department",
          name: `${d.department} (${d.headcount} hc)`,
          metric1: "",
          metric2: "",
          metric3: inr(d.monthlyCost),
        })),
        {
          section: "TOTAL",
          name: `${totalHc} employees across ${departments.length} departments`,
          metric1: inr(totalGross),
          metric2: inr(totalDed),
          metric3: inr(totalDeptCost),
        },
      ],
    };
  }

  async function buildDownload() {
    const lines: string[] = [];
    lines.push("HRMS Suite - Payroll Reports");
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    if (usingMock) lines.push("Note: This report contains sample/illustrative data.");
    lines.push("");

    lines.push("MONTHLY PAYROLL SUMMARY");
    lines.push("Period,Status,Gross (INR),Deductions (INR),Net (INR)");
    for (const r of payRuns) {
      lines.push(`${r.month} ${r.year},FINALIZED,${paiseToRupee(r.gross)},${paiseToRupee(r.deductions)},${paiseToRupee(r.net)}`);
    }
    lines.push("");

    lines.push("DEPARTMENT COST ANALYSIS");
    lines.push("Department,Headcount,Monthly Net Cost (INR)");
    for (const d of departments) {
      lines.push(`${d.department},${d.headcount},${paiseToRupee(d.monthlyCost)}`);
    }

    return {
      content: lines.join("\n"),
      filename: `payroll-report-${new Date().toISOString().slice(0, 10)}.csv`,
      mime: "text/csv;charset=utf-8;",
    };
  }

  return (
    <FilePreviewDialog
      title="Payroll Report"
      description="Preview monthly payroll and department cost data before exporting"
      kind="csv"
      triggerLabel="Export CSV"
      triggerVariant="default"
      triggerClassName="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700"
      icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
      fetchPreview={fetchPreview}
      buildDownload={buildDownload}
      downloadLabel="Download CSV"
      emptyText="No payroll data available to export."
    />
  );
}
