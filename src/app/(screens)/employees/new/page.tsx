"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { createEmployee } from "@/lib/actions/employees";
import { UserPlus, User, Building2, Landmark, Hash, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b pb-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-600 dark:text-indigo-400">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h3 className="text-sm font-semibold">{children}</h3>
    </div>
  );
}

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    try {
      const emp = await createEmployee({
        employeeCode: form.get("employeeCode") as string,
        firstName: form.get("firstName") as string,
        lastName: form.get("lastName") as string,
        email: form.get("email") as string,
        phone: (() => {
          const num = (form.get("phone") as string) || "";
          const code = (form.get("phoneCountry") as string) || "";
          if (!num) return undefined;
          return `${code} ${num}`.trim();
        })(),
        dateOfJoining: form.get("dateOfJoining") as string,
        employeeType: form.get("employeeType") as "REGULAR" | "PART_TIME" | "PROBATION" | "CONTRACTUAL",
        taxRegime: form.get("taxRegime") as "OLD" | "NEW",
        designation: (form.get("designation") as string) || undefined,
        department: (form.get("department") as string) || undefined,
        bankName: (form.get("bankName") as string) || undefined,
        bankAccountNo: (form.get("bankAccountNo") as string) || undefined,
        bankIfsc: (form.get("bankIfsc") as string) || undefined,
        pan: (form.get("pan") as string) || undefined,
        uan: (form.get("uan") as string) || undefined,
        createUser: true,
      });
      router.push(`/employees/${emp.employeeCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/employees"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Employees
      </Link>
      <PageHeader
        title="Add Employee"
        description="Create a new employee record and user account"
        icon={UserPlus}
      />

      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <SectionTitle icon={Hash}>Identification</SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="employeeCode">Employee Code</Label>
                  <Input id="employeeCode" name="employeeCode" placeholder="EMP-001" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dateOfJoining">Date of Joining</Label>
                  <Input id="dateOfJoining" name="dateOfJoining" type="date" required />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SectionTitle icon={User}>Personal</SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="name@company.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <PhoneInput id="phone" name="phone" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SectionTitle icon={Building2}>Employment</SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="employeeType">Employee Type</Label>
                  <select id="employeeType" name="employeeType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required>
                    <option value="REGULAR">Regular</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="PROBATION">Probation</option>
                    <option value="CONTRACTUAL">Contractual</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxRegime">Tax Regime</Label>
                  <select id="taxRegime" name="taxRegime" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required>
                    <option value="NEW">New Regime</option>
                    <option value="OLD">Old Regime</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="designation">Designation</Label>
                  <Input id="designation" name="designation" placeholder="e.g. Senior Engineer" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" name="department" placeholder="e.g. Engineering" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SectionTitle icon={Landmark}>Bank & Statutory</SectionTitle>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input id="bankName" name="bankName" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bankAccountNo">Account Number</Label>
                  <Input id="bankAccountNo" name="bankAccountNo" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bankIfsc">IFSC</Label>
                  <Input id="bankIfsc" name="bankIfsc" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pan">PAN</Label>
                  <Input id="pan" name="pan" placeholder="ABCDE1234F" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="uan">UAN (PF)</Label>
                  <Input id="uan" name="uan" />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Create Employee
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
