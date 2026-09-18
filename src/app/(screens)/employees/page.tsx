import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getEmployees } from "@/lib/actions/employees";
import { requireAuth } from "@/lib/rbac";
import { formatINR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Briefcase, Users as UsersIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeesList } from "./employees-list";
import { UserRole } from "@prisma/client";

export default async function EmployeesPage() {
  const user = await requireAuth();
  const employees = await getEmployees();

  const totalGross = employees.reduce((sum, emp) => {
    return sum + emp.salaryComponents.filter((c) => c.type === "EARNING").reduce((s, c) => s + c.amountPaise, 0);
  }, 0);

  const departments = new Set(employees.map((e) => e.department).filter(Boolean));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description={`${employees.length} active employees across ${departments.size} department${departments.size === 1 ? "" : "s"}`}
        icon={UsersIcon}
        actions={
          user.role === UserRole.ADMIN ? (
            <Button asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700">
              <Link href="/employees/new">
                <Plus className="h-4 w-4" />
                Add Employee
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Employees"
          value={employees.length}
          icon={<UsersIcon className="h-5 w-5" />}
          accent="from-indigo-500 to-violet-500"
        />
        <StatCard
          title="Departments"
          value={departments.size}
          icon={<Building2 className="h-5 w-5" />}
          accent="from-cyan-500 to-blue-500"
        />
        <StatCard
          title="Total Monthly Gross"
          value={formatINR(totalGross)}
          icon={<Briefcase className="h-5 w-5" />}
          accent="from-emerald-500 to-teal-500"
        />
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <UsersIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No employees yet</p>
            <p className="text-sm text-muted-foreground">Add your first employee to get started.</p>
            {user.role === UserRole.ADMIN && (
              <Button asChild className="mt-2">
                <Link href="/employees/new">
                  <Plus className="h-4 w-4" /> Add Employee
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <EmployeesList employees={employees} />
      )}
    </div>
  );
}
