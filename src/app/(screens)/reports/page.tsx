import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { formatINR } from "@/lib/money";
import { getMonthName } from "@/lib/utils";
import { BarChart, DonutChart, LineChart, type DonutSlice } from "@/components/ui/charts";
import {
  FileText,
  Users,
  TrendingUp,
  Wallet,
  Building2,
  Briefcase,
  Calendar,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportReportsButton } from "./export-reports-button";
import { UserRole } from "@prisma/client";

function buildMonthlyTrend() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    };
  });
}

function generateMockReport(companyName: string, employeeCount: number) {
  const months = buildMonthlyTrend();
  const payRuns = months.map((m, i) => {
    const baseGross = (employeeCount || 12) * 65000 * (0.92 + i * 0.025);
    const gross = Math.round(baseGross);
    const deductions = Math.round(gross * 0.18);
    const net = gross - deductions;
    return {
      id: `mock-${m.year}-${m.month}`,
      month: m.month,
      year: m.year,
      totalGrossPaise: gross,
      totalDeductionsPaise: deductions,
      totalNetPaise: net,
      status: "FINALIZED" as const,
      _isMock: true,
    };
  });

  const departments = ["Engineering", "Sales", "Marketing", "Operations", "Finance", "HR"];
  const headcount = Math.max(employeeCount || 12, 12);
  const deptBreakdown = departments.map((dept, i) => {
    const empInDept = Math.max(1, Math.round(headcount / departments.length) + (i % 2 === 0 ? 1 : 0));
    const avgCost = 55000 + i * 4500;
    return {
      department: dept,
      headcount: empInDept,
      monthlyCost: empInDept * avgCost,
    };
  });

  const earningsBreakdown = [
    { label: "Basic", value: 38 },
    { label: "HRA", value: 20 },
    { label: "Allowances", value: 22 },
    { label: "Bonus", value: 12 },
    { label: "Incentives", value: 8 },
  ];

  const deductionsBreakdown = [
    { label: "PF (Employee)", value: 32 },
    { label: "ESI", value: 8 },
    { label: "Professional Tax", value: 4 },
    { label: "TDS", value: 38 },
    { label: "Loan / Advance", value: 6 },
    { label: "LOP", value: 12 },
  ];

  return { payRuns, deptBreakdown, earningsBreakdown, deductionsBreakdown, months };
}

export default async function ReportsPage() {
  const user = await requireAuth();
  const company = await prisma.company.findFirst();
  
  let managerReportIds: string[] | undefined;
  if (user.role === UserRole.MANAGER) {
    const me = await prisma.employee.findFirst({ where: { userId: user.id } });
    if (me) {
      const reports = await prisma.employee.findMany({
        where: { managerId: me.id, isActive: true },
        select: { id: true },
      });
      managerReportIds = reports.map((r) => r.id);
    }
  }
  
  const employeeCount = company
    ? await prisma.employee.count({ where: { companyId: company.id, isActive: true } })
    : 0;

  const payRuns = company
    ? await prisma.payRun.findMany({
        where: { companyId: company.id, status: "FINALIZED" },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 12,
        include: {
          paySlips: {
            where: managerReportIds && managerReportIds.length > 0 ? { employeeId: { in: managerReportIds } } : undefined,
            include: { employee: { select: { department: true } } },
          },
        },
      })
    : [];

  const usingMock = payRuns.length === 0;
  const mock = usingMock ? generateMockReport(company?.name || "Your Company", employeeCount) : null;

  const chartSource = mock ? mock.payRuns : payRuns;
  const ytdGross = chartSource.reduce((s, r) => s + r.totalGrossPaise, 0);
  const ytdNet = chartSource.reduce((s, r) => s + r.totalNetPaise, 0);
  const ytdDeductions = chartSource.reduce((s, r) => s + r.totalDeductionsPaise, 0);
  const avgNet = chartSource.length > 0 ? Math.round(ytdNet / chartSource.length) : 0;

  const trendData = chartSource
    .slice()
    .reverse()
    .map((r) => ({ label: getMonthName(r.month).slice(0, 3), value: Math.round(r.totalGrossPaise / 100) }));

  const netTrendData = chartSource
    .slice()
    .reverse()
    .map((r) => ({ label: getMonthName(r.month).slice(0, 3), value: Math.round(r.totalNetPaise / 100) }));

  let departmentBreakdown: { department: string; headcount: number; monthlyCost: number }[] = mock?.deptBreakdown || [];
  if (!mock && payRuns.length > 0) {
    const map = new Map<string, { headcount: Set<string>; monthlyCost: number }>();
    const latest = payRuns[0];
    const employees = await prisma.employee.findMany({
      where: {
        companyId: company!.id,
        isActive: true,
        ...(managerReportIds && managerReportIds.length > 0 ? { id: { in: managerReportIds } } : {}),
      },
      select: { id: true, department: true },
    });
    for (const e of employees) {
      const dept = e.department || "Unassigned";
      if (!map.has(dept)) map.set(dept, { headcount: new Set(), monthlyCost: 0 });
      const entry = map.get(dept)!;
      entry.headcount.add(e.id);
    }
    for (const slip of latest.paySlips) {
      const dept = slip.employee.department || "Unassigned";
      if (map.has(dept)) {
        map.get(dept)!.monthlyCost += slip.netPaise;
      }
    }
    departmentBreakdown = Array.from(map.entries())
      .map(([department, v]) => ({ department, headcount: v.headcount.size, monthlyCost: v.monthlyCost }))
      .sort((a, b) => b.monthlyCost - a.monthlyCost);
  }

  const earningsBreakdown = mock?.earningsBreakdown || [];
  const deductionsBreakdown = mock?.deductionsBreakdown || [];

  if (!mock) {
    const allEarnings = new Map<string, number>();
    const allDeductions = new Map<string, number>();
    for (const run of payRuns) {
      for (const slip of run.paySlips) {
        const earnings = Array.isArray(slip.earningsJson) ? (slip.earningsJson as { name: string; amountPaise: number }[]) : [];
        const deductions = Array.isArray(slip.deductionsJson) ? (slip.deductionsJson as { name: string; amountPaise: number }[]) : [];
        for (const e of earnings) {
          allEarnings.set(e.name, (allEarnings.get(e.name) || 0) + (e.amountPaise || 0));
        }
        for (const d of deductions) {
          allDeductions.set(d.name, (allDeductions.get(d.name) || 0) + (d.amountPaise || 0));
        }
      }
    }
    const totalE = Array.from(allEarnings.values()).reduce((s, v) => s + v, 0) || 1;
    const totalD = Array.from(allDeductions.values()).reduce((s, v) => s + v, 0) || 1;
    const sortedE = Array.from(allEarnings.entries()).sort((a, b) => b[1] - a[1]);
    const sortedD = Array.from(allDeductions.entries()).sort((a, b) => b[1] - a[1]);
    if (sortedE.length > 0) {
      earningsBreakdown.push(
        ...sortedE.map(([label, v]) => ({ label, value: Math.round((v / totalE) * 100) }))
      );
    }
    if (sortedD.length > 0) {
      deductionsBreakdown.push(
        ...sortedD.map(([label, v]) => ({ label, value: Math.round((v / totalD) * 100) }))
      );
    }
  }

  const headcountData: DonutSlice[] = departmentBreakdown.map((d, i) => ({
    label: d.department,
    value: d.headcount,
    color: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6"][i % 7],
  }));
  const costData = departmentBreakdown.map((d) => ({ label: d.department, value: Math.round(d.monthlyCost / 100) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Payroll summary, YTD figures, and cost analytics"
        icon={FileText}
        actions={
          <ExportReportsButton
            payRuns={chartSource.map((r) => ({
              month: getMonthName(r.month),
              year: r.year,
              gross: r.totalGrossPaise,
              deductions: r.totalDeductionsPaise,
              net: r.totalNetPaise,
            }))}
            departments={departmentBreakdown}
            usingMock={usingMock}
          />
        }
      />

      {usingMock && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white">
            <span className="text-xs font-bold">i</span>
          </span>
          <div>
            <p className="font-medium">Showing illustrative data</p>
            <p className="text-amber-700 dark:text-amber-400">
              No finalized pay runs yet. Finalize a pay run from the Payroll page to see live analytics here.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Headcount" value={employeeCount} icon={<Users className="h-5 w-5" />} accent="from-indigo-500 to-violet-500" />
        <StatCard title="YTD Gross" value={formatINR(ytdGross)} icon={<TrendingUp className="h-5 w-5" />} accent="from-cyan-500 to-blue-500" />
        <StatCard title="YTD Deductions" value={formatINR(ytdDeductions)} icon={<TrendingUp className="h-5 w-5" />} accent="from-rose-500 to-pink-500" />
        <StatCard title="Avg Monthly Net" value={formatINR(avgNet)} icon={<Wallet className="h-5 w-5" />} accent="from-emerald-500 to-teal-500" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Gross Payroll Trend
            </CardTitle>
            <CardDescription>Total monthly gross payout</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <BarChart data={trendData} height={220} color="#6366f1" />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-500" />
              Net Payout Trend
            </CardTitle>
            <CardDescription>Total monthly net payout</CardDescription>
          </CardHeader>
          <CardContent>
            {netTrendData.length > 0 ? (
              <LineChart data={netTrendData} height={220} color="#10b981" />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-violet-500" />
            Department Cost Analysis
          </CardTitle>
          <CardDescription>Headcount and monthly net cost by department</CardDescription>
        </CardHeader>
        <CardContent>
          {departmentBreakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No department data. Assign a department to employees to see analytics.
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Headcount</p>
                <DonutChart data={headcountData} size={200} centerLabel="Total" centerValue={String(headcountData.reduce((s, d) => s + d.value, 0))} />
              </div>
              <div className="space-y-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monthly Cost (₹)</p>
                {costData.length > 0 ? (
                  <BarChart data={costData} height={220} color="#8b5cf6" horizontal />
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-500" />
              Earnings Composition
            </CardTitle>
            <CardDescription>Average split across finalized pay runs</CardDescription>
          </CardHeader>
          <CardContent>
            {earningsBreakdown.length > 0 ? (
              <div className="space-y-3">
                {earningsBreakdown.map((e) => (
                  <div key={e.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{e.label}</span>
                      <span className="text-muted-foreground">{e.value}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{ width: `${e.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-rose-500" />
              Deductions Composition
            </CardTitle>
            <CardDescription>Average split across finalized pay runs</CardDescription>
          </CardHeader>
          <CardContent>
            {deductionsBreakdown.length > 0 ? (
              <div className="space-y-3">
                {deductionsBreakdown.map((d) => (
                  <div key={d.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{d.label}</span>
                      <span className="text-muted-foreground">{d.value}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500"
                        style={{ width: `${d.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            Monthly Payroll Summary
          </CardTitle>
          <CardDescription>Finalized pay runs over the selected period</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {chartSource.length === 0 ? (
            <p className="p-6 text-muted-foreground">No data to display.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Avg / Employee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartSource.map((run) => {
                  const empCount = Math.max(employeeCount || 12, 1);
                  const avg = Math.round(run.totalNetPaise / empCount);
                  return (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getMonthName(run.month)} {run.year}
                          {usingMock && (
                            <Badge variant="outline" className="text-[10px]">sample</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={run.status === "FINALIZED" ? "success" : "secondary"}>
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatINR(run.totalGrossPaise)}</TableCell>
                      <TableCell className="text-right text-rose-600 dark:text-rose-400">
                        - {formatINR(run.totalDeductionsPaise)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatINR(run.totalNetPaise)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatINR(avg)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
