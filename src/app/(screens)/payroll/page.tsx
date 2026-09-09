import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getPayRuns } from "@/lib/actions/payroll";
import { requireAdmin } from "@/lib/rbac";
import { formatINR } from "@/lib/money";
import { getMonthName } from "@/lib/utils";
import { PayrollActions } from "./payroll-actions";
import { Banknote, Users, TrendingUp, Wallet, Calendar as CalendarIcon, Filter } from "lucide-react";

const statusVariant = (status: string) => {
  switch (status) {
    case "FINALIZED": return "success" as const;
    case "LOCKED": return "warning" as const;
    case "CANCELLED": return "destructive" as const;
    default: return "secondary" as const;
  }
};

type SearchParams = Promise<{ year?: string }>;

export default async function PayrollPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const allRuns = await getPayRuns();
  const now = new Date();
  const params = await searchParams;

  const years = Array.from(new Set(allRuns.map((r) => r.year))).sort((a, b) => b - a);
  const selectedYear = params.year && years.includes(Number(params.year)) ? Number(params.year) : null;
  const payRuns = selectedYear ? allRuns.filter((r) => r.year === selectedYear) : allRuns;

  const totalNet = payRuns.reduce((s, r) => s + r.totalNetPaise, 0);
  const totalGross = payRuns.reduce((s, r) => s + r.totalGrossPaise, 0);
  const totalEmployees = payRuns.reduce((s, r) => s + r._count.paySlips, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Manage pay runs and monthly payouts"
        icon={Banknote}
        actions={<PayrollActions year={now.getFullYear()} month={now.getMonth() + 1} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pay Runs" value={payRuns.length} icon={<CalendarIcon className="h-5 w-5" />} accent="from-indigo-500 to-violet-500" />
        <StatCard title="Total Gross" value={formatINR(totalGross)} icon={<TrendingUp className="h-5 w-5" />} accent="from-cyan-500 to-blue-500" />
        <StatCard title="Total Net" value={formatINR(totalNet)} icon={<Wallet className="h-5 w-5" />} accent="from-emerald-500 to-teal-500" />
        <StatCard title="Payslips Issued" value={totalEmployees} icon={<Users className="h-5 w-5" />} accent="from-amber-500 to-orange-500" />
      </div>

      {years.length > 1 && (
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
          <span className="flex items-center gap-1.5 px-2 text-xs font-semibold text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Year:
          </span>
          <Link
            href="/payroll"
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedYear === null
                ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                selectedYear === null ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {allRuns.length}
            </span>
          </Link>
          {years.map((y) => {
            const count = allRuns.filter((r) => r.year === y).length;
            const active = selectedYear === y;
            return (
              <Link
                key={y}
                href={`/payroll?year=${y}`}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {y}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {payRuns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Banknote className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No pay runs {selectedYear ? `in ${selectedYear}` : "yet"}</p>
            <p className="text-sm text-muted-foreground">
              {selectedYear ? "Try selecting a different year." : "Open a pay run to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {payRuns.map((run) => (
            <Link
              key={run.id}
              href={`/payroll/${run.id}`}
              className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-all hover:border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-violet-50/50 hover:shadow-md dark:hover:border-indigo-900 dark:hover:from-indigo-950/20 dark:hover:to-violet-950/20"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {getMonthName(run.month)} {run.year}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> {run._count.paySlips} employees
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                <div className="text-right">
                  <p className="font-bold">{formatINR(run.totalNetPaise)}</p>
                  <p className="text-[10px] text-muted-foreground">net payout</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
