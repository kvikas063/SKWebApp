"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { transitionPayRun, cancelPayRun, deletePayRun } from "@/lib/actions/payroll";
import { generateBankCSV, generatePFChallan } from "@/lib/services/payroll-exports";
import { useRouter } from "next/navigation";
import type { PayRunStatus } from "@prisma/client";
import {
  PlayCircle,
  Lock,
  CheckCircle2,
  FileSpreadsheet,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { FilePreviewDialog, type PreviewData } from "@/components/ui/file-preview-dialog";

type PaySlip = {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    bankAccountNo: string | null;
    bankIfsc: string | null;
    uan: string | null;
  };
  netPaise: number;
  grossPaise: number;
  statutoryJson: unknown;
};

const nextLabel: Record<string, string> = {
  DRAFT: "Start Review",
  REVIEWING: "Lock Run",
  LOCKED: "Finalize",
};

const nextIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  DRAFT: PlayCircle,
  REVIEWING: Lock,
  LOCKED: CheckCircle2,
};

export function PayRunActions({
  payRunId,
  status,
  year,
  month,
  paySlips,
}: {
  payRunId: string;
  status: PayRunStatus;
  year: number;
  month: number;
  paySlips: PaySlip[];
}) {
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  async function transition(to: PayRunStatus) {
    setLoading(true);
    try {
      await transitionPayRun(payRunId, to);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  async function cancel() {
    setLoading(true);
    try {
      await cancelPayRun(payRunId);
      router.refresh();
      setConfirmCancel(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel");
    }
    setLoading(false);
  }

  async function remove() {
    setLoading(true);
    try {
      await deletePayRun(payRunId);
      router.push("/payroll");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
    setLoading(false);
  }

  const monthName = new Date(2000, month - 1, 1).toLocaleString("en-IN", { month: "long" });

  const bankPreviewData = useMemo<PreviewData>(() => {
    const valid = paySlips.filter((p) => p.employee.bankAccountNo);
    const totalNet = valid.reduce((s, p) => s + p.netPaise, 0);
    return {
      summary: [
        { label: "Beneficiaries", value: String(valid.length) },
        { label: "Skipped (no bank)", value: String(paySlips.length - valid.length) },
        { label: "Total Disbursement", value: `₹${(totalNet / 100).toLocaleString("en-IN")}` },
        { label: "Run", value: `${monthName} ${year}` },
      ],
      headers: [
        { key: "name", label: "Beneficiary" },
        { key: "account", label: "Account Number" },
        { key: "ifsc", label: "IFSC" },
        { key: "amount", label: "Amount (₹)", align: "right", format: (v) => (v ? Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—") },
        { key: "narration", label: "Narration" },
      ],
      rows: valid.map((p) => ({
        name: `${p.employee.firstName} ${p.employee.lastName}`.trim(),
        account: p.employee.bankAccountNo ?? "",
        ifsc: p.employee.bankIfsc ?? "",
        amount: (p.netPaise / 100).toFixed(2),
        narration: "Salary",
      })),
    };
  }, [paySlips, monthName, year]);

  const pfPreviewData = useMemo<PreviewData>(() => {
    const totalEmp = paySlips.reduce((s, p) => {
      const stat = p.statutoryJson as { pfEmployeePaise?: number; pfEmployerPaise?: number } | null;
      return s + (stat?.pfEmployeePaise ?? 0);
    }, 0);
    const totalEr = paySlips.reduce((s, p) => {
      const stat = p.statutoryJson as { pfEmployeePaise?: number; pfEmployerPaise?: number } | null;
      return s + (stat?.pfEmployerPaise ?? 0);
    }, 0);
    return {
      summary: [
        { label: "Records", value: String(paySlips.length) },
        { label: "Employee PF", value: `₹${(totalEmp / 100).toLocaleString("en-IN")}` },
        { label: "Employer PF", value: `₹${(totalEr / 100).toLocaleString("en-IN")}` },
        { label: "Total Contribution", value: `₹${((totalEmp + totalEr) / 100).toLocaleString("en-IN")}` },
      ],
      headers: [
        { key: "uan", label: "UAN" },
        { key: "name", label: "Employee" },
        { key: "empPF", label: "Employee PF (₹)", align: "right", format: (v) => (v ? Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—") },
        { key: "erPF", label: "Employer PF (₹)", align: "right", format: (v) => (v ? Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—") },
        { key: "totalPF", label: "Total PF (₹)", align: "right", format: (v) => (v ? Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—") },
        { key: "wages", label: "Wages (₹)", align: "right", format: (v) => (v ? Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—") },
      ],
      rows: paySlips.map((p) => {
        const stat = p.statutoryJson as { pfEmployeePaise?: number; pfEmployerPaise?: number } | null;
        const empPF = (stat?.pfEmployeePaise ?? 0) / 100;
        const erPF = (stat?.pfEmployerPaise ?? 0) / 100;
        return {
          uan: p.employee.uan ?? "",
          name: `${p.employee.firstName} ${p.employee.lastName}`.trim(),
          empPF: empPF.toFixed(2),
          erPF: erPF.toFixed(2),
          totalPF: (empPF + erPF).toFixed(2),
          wages: (p.grossPaise / 100).toFixed(2),
        };
      }),
    };
  }, [paySlips]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Lifecycle buttons */}
      {status === "DRAFT" && (
        <>
          <Button
            onClick={() => transition("REVIEWING")}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700"
          >
            {(() => {
              const Icon = nextIcon[status];
              return loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />;
            })()}
            {nextLabel[status]}
          </Button>
          <Button
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950/30"
            onClick={() => setConfirmDelete(true)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
            Delete Run
          </Button>
        </>
      )}

      {status === "REVIEWING" && (
        <>
          <Button
            onClick={() => transition("LOCKED")}
            disabled={loading}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Lock Run
          </Button>
          <Button
            variant="outline"
            onClick={() => transition("DRAFT")}
            disabled={loading}
          >
            Move back to Draft
          </Button>
          <Button
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950/30"
            onClick={() => setConfirmCancel(true)}
            disabled={loading}
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
        </>
      )}

      {status === "LOCKED" && (
        <>
          <Button
            onClick={() => transition("FINALIZED")}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Finalize
          </Button>
          <Button
            variant="outline"
            onClick={() => transition("REVIEWING")}
            disabled={loading}
          >
            Move back to Review
          </Button>
        </>
      )}

      {status === "FINALIZED" && (
        <>
          <FilePreviewDialog
            title="Bank Payment File"
            description={`Disbursement for ${monthName} ${year}`}
            kind="csv"
            triggerLabel="Bank CSV"
            triggerVariant="default"
            icon={<FileSpreadsheet className="h-4 w-4" />}
            fetchPreview={async () => bankPreviewData}
            buildDownload={async () => ({
              content: generateBankCSV(paySlips),
              filename: `bank-payment-${monthName}-${year}.csv`,
              mime: "text/csv;charset=utf-8;",
            })}
            downloadLabel="Download CSV"
            emptyText="No payslips with bank details available."
          />
          <FilePreviewDialog
            title="PF Challan"
            description={`Provident Fund contribution for ${monthName} ${year}`}
            kind="csv"
            triggerLabel="PF Challan"
            triggerVariant="default"
            icon={<FileSpreadsheet className="h-4 w-4" />}
            fetchPreview={async () => pfPreviewData}
            buildDownload={async () => ({
              content: generatePFChallan(paySlips),
              filename: `pf-challan-${monthName}-${year}.csv`,
              mime: "text/csv;charset=utf-8;",
            })}
            downloadLabel="Download CSV"
            emptyText="No payslip PF data available."
          />
        </>
      )}

      {status === "CANCELLED" && (
        <span className="text-sm text-muted-foreground">This run was cancelled and is read-only.</span>
      )}

      {/* Cancel confirm */}
      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel pay run?</DialogTitle>
            <DialogDescription>
              Cancelling will mark the run as cancelled. The payslips will be preserved
              but the run will no longer count towards active payroll. This action is
              logged in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(false)} disabled={loading}>
              Keep Run
            </Button>
            <Button onClick={cancel} disabled={loading} className="bg-rose-600 text-white hover:bg-rose-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancel Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm (only DRAFT) */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete draft pay run?</DialogTitle>
            <DialogDescription>
              This will permanently remove the draft pay run and all its payslip records.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={remove} disabled={loading} className="bg-rose-600 text-white hover:bg-rose-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
