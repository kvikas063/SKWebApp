import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { UserRole } from "@prisma/client";
import { Building2, Users, UserCog, ChevronRight } from "lucide-react";
import { OrgDirectoryTable, type OrgEmployee, type OrgDepartment } from "./org-directory-table";

type SearchParams = Promise<{ tab?: string }>;

const TABS = ["employees", "managers", "departments"] as const;
type TabKey = (typeof TABS)[number];

function isTabKey(v: string | undefined): v is TabKey {
  return !!v && (TABS as readonly string[]).includes(v);
}

const TAB_META: Record<TabKey, { label: string; icon: typeof Users; description: string }> = {
  employees: { label: "Employees", icon: Users, description: "All active employees in the company" },
  managers: { label: "Managers", icon: UserCog, description: "Employees who have at least one direct report" },
  departments: { label: "Departments", icon: Building2, description: "All departments with headcount and monthly cost" },
};

export default async function OrgChartListPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireAuth();
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
  const company = await prisma.company.findFirst();
  if (!company) return null;

  const params = await searchParams;
  const tab: TabKey = isTabKey(params.tab) ? params.tab : "employees";

  const employeesRaw = await prisma.employee.findMany({
    where: { companyId: company.id, isActive: true },
    orderBy: [{ department: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      email: true,
      department: true,
      designation: true,
      directReports: { select: { id: true } },
      paySlips: {
        orderBy: { id: "desc" },
        take: 1,
        select: { netPaise: true },
      },
    },
  });

  const employees: OrgEmployee[] = employeesRaw.map((e) => ({
    id: e.id,
    employeeCode: e.employeeCode,
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    department: e.department,
    designation: e.designation,
    directReportCount: e.directReports.length,
    latestNetPaise: e.paySlips[0]?.netPaise ?? 0,
  }));

  const managers = employees.filter((e) => e.directReportCount > 0);

  const deptMap = new Map<string, { headcount: number; cost: number }>();
  for (const e of employees) {
    const key = e.department || "Unassigned";
    if (!deptMap.has(key)) deptMap.set(key, { headcount: 0, cost: 0 });
    const entry = deptMap.get(key)!;
    entry.headcount += 1;
    if (e.latestNetPaise > 0) entry.cost += e.latestNetPaise;
  }
  const totalEmployees = employees.length;
  const departments: OrgDepartment[] = Array.from(deptMap.entries())
    .map(([name, v]) => ({
      name,
      headcount: v.headcount,
      pct: Math.round((v.headcount / Math.max(totalEmployees, 1)) * 100),
      monthlyCost: v.cost,
    }))
    .sort((a, b) => b.headcount - a.headcount);

  const meta = TAB_META[tab];
  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Directory"
        description="Browse all employees, managers, and departments"
        icon={Building2}
        actions={
          <Link
            href="/org-chart"
            className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
          >
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            Back to Org Chart
          </Link>
        }
      />

      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
        {TABS.map((key) => {
          const TabIcon = TAB_META[key].icon;
          const active = tab === key;
          const count = key === "employees" ? employees.length : key === "managers" ? managers.length : departments.length;
          return (
            <Link
              key={key}
              href={`/org-chart/list?tab=${key}`}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {TAB_META[key].label}
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-indigo-500" />
            {meta.label}
          </CardTitle>
          <CardDescription>{meta.description}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <OrgDirectoryTable
            tab={tab}
            employees={employees}
            managers={managers}
            departments={departments}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
