import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { getOrgChart } from "@/lib/actions/org-chart";
import { OrgChartContainer } from "./org-chart-container";
import { Building2, Users, ArrowRight } from "lucide-react";

export default async function OrgChartPage() {
  const company = await prisma.company.findFirst();
  if (!company) return null;

  const tree = await getOrgChart(company.id);
  const employeeCount = await prisma.employee.count({ where: { companyId: company.id, isActive: true } });
  const managerCount = await prisma.employee.count({
    where: {
      companyId: company.id,
      isActive: true,
      directReports: { some: {} },
    },
  });
  const departments = new Set(
    (await prisma.employee.findMany({ where: { companyId: company.id, isActive: true }, select: { department: true } })).map((e) => e.department).filter(Boolean)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Chart"
        description="Visualize the company hierarchy"
        icon={Building2}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/org-chart/list?tab=employees"
          className="group rounded-xl border bg-card p-4 transition-all hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-700"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Total employees</p>
              <p className="text-xl font-bold">{employeeCount}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
          </div>
        </Link>
        <Link
          href="/org-chart/list?tab=managers"
          className="group rounded-xl border bg-card p-4 transition-all hover:border-amber-300 hover:shadow-md dark:hover:border-amber-700"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Managers</p>
              <p className="text-xl font-bold">{managerCount}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" />
          </div>
        </Link>
        <Link
          href="/org-chart/list?tab=departments"
          className="group rounded-xl border bg-card p-4 transition-all hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-700"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Departments</p>
              <p className="text-xl font-bold">{departments.size}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
          </div>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {tree.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No employees found.</p>
          ) : (
            <OrgChartContainer tree={tree} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
