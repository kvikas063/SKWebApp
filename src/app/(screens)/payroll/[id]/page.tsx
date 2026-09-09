import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getPayRun } from "@/lib/actions/payroll";
import { requireAdmin } from "@/lib/rbac";
import { formatINR } from "@/lib/money";
import { getMonthName } from "@/lib/utils";
import { PayRunActions } from "./payrun-actions";
import { PrintSummaryDialog } from "./print-summary-dialog";
import { PayslipsTable } from "./payslips-table";
import {
  ArrowLeft,
  Banknote,
  TrendingDown,
  Wallet,
  Users as UsersIcon,
  FileText,
  IndianRupee,
} from "lucide-react";

const statusVariant = (status: string) => {
  switch (status) {
    case "FINALIZED": return "success" as const;
    case "LOCKED": return "warning" as const;
    case "CANCELLED": return "destructive" as const;
    case "REVIEWING": return "default" as const;
    default: return "secondary" as const;
  }
};

export default async function PayRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const payRun = await getPayRun(id);
  if (!payRun) notFound();

  // Aggregate earnings & deductions across all payslips
  const earningsAgg: Record<string, number> = {};
  const deductionsAgg: Record<string, number> = {};
  for (const slip of payRun.paySlips) {
    const e = (slip.earningsJson as Array<{ name: string; amountPaise: number }> | null) ?? [];
    const d = (slip.deductionsJson as Array<{ name: string; amountPaise: number }> | null) ?? [];
    for (const item of e) earningsAgg[item.name] = (earningsAgg[item.name] ?? 0) + item.amountPaise;
    for (const item of d) deductionsAgg[item.name] = (deductionsAgg[item.name] ?? 0) + item.amountPaise;
  }

  return (
    <div className="space-y-6">
      <Link href="/payroll" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Payroll
      </Link>
      <PageHeader
        title={`${getMonthName(payRun.month)} ${payRun.year}`}
        description={`Pay run for ${payRun.paySlips.length} employees`}
        icon={Banknote}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(payRun.status)} className="text-xs">
              {payRun.status}
            </Badge>
            {payRun.status === "FINALIZED" && <PrintSummaryDialog payRun={payRun} />}
            <PayRunActions
              payRunId={payRun.id}
              status={payRun.status}
              year={payRun.year}
              month={payRun.month}
              paySlips={payRun.paySlips}
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Gross"
          value={formatINR(payRun.totalGrossPaise)}
          icon={<IndianRupee className="h-5 w-5" />}
          accent="from-indigo-500 to-violet-500"
        />
        <StatCard
          title="Total Deductions"
          value={formatINR(payRun.totalDeductionsPaise)}
          icon={<TrendingDown className="h-5 w-5" />}
          accent="from-rose-500 to-pink-500"
        />
        <StatCard
          title="Net Payout"
          value={formatINR(payRun.totalNetPaise)}
          icon={<Wallet className="h-5 w-5" />}
          accent="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Employees"
          value={payRun.paySlips.length}
          icon={<UsersIcon className="h-5 w-5" />}
          accent="from-amber-500 to-orange-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Earnings Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(earningsAgg).length === 0 ? (
              <p className="text-sm text-muted-foreground">No earnings recorded.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(earningsAgg)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, paise]) => {
                    const total = payRun.totalGrossPaise || 1;
                    const pct = Math.round((paise / total) * 100);
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{name}</span>
                          <span className="font-semibold">
                            {formatINR(paise)} <span className="text-xs text-muted-foreground">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Deductions Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(deductionsAgg).length === 0 ? (
              <p className="text-sm text-muted-foreground">No deductions recorded.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(deductionsAgg)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, paise]) => {
                    const total = payRun.totalDeductionsPaise || 1;
                    const pct = Math.round((paise / total) * 100);
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{name}</span>
                          <span className="font-semibold">
                            {formatINR(paise)} <span className="text-xs text-muted-foreground">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Employee Payslips
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payRun.paySlips.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No payslips in this run.</p>
          ) : (
            <PayslipsTable slips={payRun.paySlips} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
