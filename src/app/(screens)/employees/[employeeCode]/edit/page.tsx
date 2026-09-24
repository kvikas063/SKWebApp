import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getEmployeeByCode } from "@/lib/actions/employees";
import { requireAuth } from "@/lib/rbac";
import { EditEmployeeForm } from "./edit-employee-form";
import { ArrowLeft, UserCog } from "lucide-react";
import { UserRole } from "@prisma/client";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ employeeCode: string }>;
}) {
  const user = await requireAuth();
  if (user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }
  const { employeeCode } = await params;
  const employee = await getEmployeeByCode(employeeCode);
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/employees/${employee.employeeCode}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Employee
      </Link>
      <PageHeader
        title="Edit Employee"
        description={`Update details for ${employee.firstName} ${employee.lastName}`}
        icon={UserCog}
      />
      <EditEmployeeForm
        employee={{
          id: employee.id,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          dateOfJoining: employee.dateOfJoining,
          dateOfBirth: employee.dateOfBirth,
          employeeType: employee.employeeType,
          taxRegime: employee.taxRegime,
          designation: employee.designation,
          department: employee.department,
          bankName: employee.bankName,
          bankAccountNo: employee.bankAccountNo,
          bankIfsc: employee.bankIfsc,
          pan: employee.pan,
          uan: employee.uan,
          esiNumber: employee.esiNumber,
        }}
      />
    </div>
  );
}
