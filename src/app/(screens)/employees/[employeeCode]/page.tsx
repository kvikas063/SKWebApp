import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { getEmployeeByCode } from "@/lib/actions/employees";
import { requireAuth } from "@/lib/rbac";
import { formatINR } from "@/lib/money";
import { computePF, computeESI, computePT, computeTDS } from "@/lib/services/payroll-engine";
import { prisma } from "@/lib/prisma";
import { EmployeeTabs } from "./employee-tabs";
import { DeleteEmployeeButton } from "./delete-employee-button";
import {
  Building2,
  Wallet,
  IndianRupee,
  Briefcase,
  Users,
  Edit,
  ArrowLeft,
} from "lucide-react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const typeColors: Record<string, "default" | "secondary" | "warning" | "success"> = {
  REGULAR: "default",
  PART_TIME: "secondary",
  PROBATION: "warning",
  CONTRACTUAL: "success",
};

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ employeeCode: string }>;
}) {
  const user = await requireAuth();
  if (user.role === "EMPLOYEE") {
    redirect("/dashboard");
  }
  const { employeeCode } = await params;
  const employee = await getEmployeeByCode(employeeCode);
  if (!employee) notFound();

  if (user.role === "MANAGER") {
    const me = await prisma.employee.findFirst({ where: { userId: user.id } });
    // Managers may view their own profile or any of their direct reports.
    if (!me || (employee.id !== me.id && employee.managerId !== me.id)) {
      notFound();
    }
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const gross = employee.salaryComponents
    .filter((c: { type: string; amountPaise: number }) => c.type === "EARNING")
    .reduce((s: number, c: { amountPaise: number }) => s + c.amountPaise, 0);
  const customDeductions = employee.salaryComponents
    .filter((c: { type: string; amountPaise: number }) => c.type === "DEDUCTION")
    .reduce((s: number, c: { amountPaise: number }) => s + c.amountPaise, 0);

  const company = await prisma.company.findFirst({
    include: { statutoryConfig: true },
  });
  const statutory = company?.statutoryConfig;
  const basicPaise = employee.salaryComponents.find((c: { type: string; name: string; amountPaise: number }) => c.type === "EARNING" && c.name.toLowerCase().includes("basic"))?.amountPaise ?? 0;
  const pf = statutory ? computePF(basicPaise, statutory, employee.employeeType) : { employee: 0, employer: 0 };
  const esi = statutory ? computeESI(gross, statutory) : { employee: 0, employer: 0 };
  const pt = statutory ? computePT(gross, statutory.ptSlabsJson) : 0;
  const annualGross = gross * 12;
  const tds = statutory ? computeTDS(annualGross, employee.taxRegime, statutory) : 0;

  const statutoryDeductions = pf.employee + esi.employee + pt + tds;
  const totalDeductions = customDeductions + statutoryDeductions;
  const net = gross - totalDeductions;

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        description={`Employee Code: ${employee.employeeCode}`}
        icon={Users}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="default" className="min-w-[120px]">
              <Link href="/org-chart/list?tab=employees">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {user.role === "ADMIN" ? (
              <>
                <Button asChild variant="default" size="default" className="min-w-[120px]">
                  <Link href={`/employees/${employeeCode}/edit`}>
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <DeleteEmployeeButton employeeId={employee.id} employeeName={fullName} />
              </>
            ) : null}
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="relative h-24 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent)]" />
        </div>
        <CardContent className="relative px-6 pb-6">
          <div className="-mt-14 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={typeColors[employee.employeeType] ?? "secondary"}>
                  {employee.employeeType.replace("_", " ")}
                </Badge>
                <Badge variant="outline">
                  <Briefcase className="mr-1 h-3 w-3" />
                  {employee.designation ?? "—"}
                </Badge>
                {employee.department && (
                  <Badge variant="outline">
                    <Building2 className="mr-1 h-3 w-3" />
                    {employee.department}
                  </Badge>
                )}
                {employee.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Monthly Gross" value={formatINR(gross)} icon={<IndianRupee className="h-5 w-5" />} accent="from-indigo-500 to-violet-500" />
        <StatCard title="Total Deductions" value={formatINR(totalDeductions)} icon={<Wallet className="h-5 w-5" />} accent="from-rose-500 to-pink-500" />
        <StatCard title="Net Pay" value={formatINR(net)} icon={<Wallet className="h-5 w-5" />} accent="from-emerald-500 to-teal-500" />
      </div>

      <EmployeeTabs
        employee={employee}
        userRole={user.role}
        customDeductions={customDeductions}
        pf={pf}
        esi={esi}
        pt={pt}
        tds={tds}
      />
    </div>
  );
}