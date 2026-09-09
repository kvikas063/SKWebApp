"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateEmployee } from "@/lib/actions/employees";
import {
  User,
  Building2,
  Landmark,
  Hash,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

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

type Employee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfJoining: Date;
  dateOfBirth: Date | null;
  employeeType: "REGULAR" | "PART_TIME" | "PROBATION" | "CONTRACTUAL";
  taxRegime: "OLD" | "NEW";
  designation: string | null;
  department: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  bankIfsc: string | null;
  pan: string | null;
  uan: string | null;
  esiNumber: string | null;
};

export function EditEmployeeForm({ employee }: { employee: Employee }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const form = new FormData(e.currentTarget);
    try {
      await updateEmployee(employee.id, {
        firstName: form.get("firstName") as string,
        lastName: form.get("lastName") as string,
        email: form.get("email") as string,
        phone: (() => {
          const num = (form.get("phone") as string) || "";
          const code = (form.get("phoneCountry") as string) || "";
          if (!num) return undefined;
          return `${code} ${num}`.trim();
        })(),
        employeeType: form.get("employeeType") as Employee["employeeType"],
        taxRegime: form.get("taxRegime") as Employee["taxRegime"],
        designation: (form.get("designation") as string) || undefined,
        department: (form.get("department") as string) || undefined,
        bankName: (form.get("bankName") as string) || undefined,
        bankAccountNo: (form.get("bankAccountNo") as string) || undefined,
        bankIfsc: (form.get("bankIfsc") as string) || undefined,
        pan: (form.get("pan") as string) || undefined,
        uan: (form.get("uan") as string) || undefined,
      });
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update employee");
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="border-b bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-purple-950/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Edit Employee</CardTitle>
              <p className="text-xs text-muted-foreground">
                {employee.firstName} {employee.lastName} · {employee.employeeCode}
              </p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm">
             <Link href={`/employees/${employee.employeeCode}`}>
               <ArrowLeft className="h-3.5 w-3.5" /> Back
             </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <SectionTitle icon={Hash}>Identification</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="employeeCode" className="text-xs font-medium">Employee Code</Label>
                <Input id="employeeCode" value={employee.employeeCode} disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dateOfJoining" className="text-xs font-medium">Date of Joining</Label>
                <Input
                  id="dateOfJoining"
                  value={new Date(employee.dateOfJoining).toISOString().slice(0, 10)}
                  disabled
                />
                <p className="text-[11px] text-muted-foreground">
                  Date of joining cannot be changed
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle icon={User}>Personal</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-medium">First Name</Label>
                <Input id="firstName" name="firstName" defaultValue={employee.firstName} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-medium">Last Name</Label>
                <Input id="lastName" name="lastName" defaultValue={employee.lastName} required />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={employee.email} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium">Phone</Label>
                <PhoneInput id="phone" name="phone" defaultValue={employee.phone ?? ""} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle icon={Building2}>Employment</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="employeeType" className="text-xs font-medium">Employee Type</Label>
                <select
                  id="employeeType"
                  name="employeeType"
                  defaultValue={employee.employeeType}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="REGULAR">Regular</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="PROBATION">Probation</option>
                  <option value="CONTRACTUAL">Contractual</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxRegime" className="text-xs font-medium">Tax Regime</Label>
                <select
                  id="taxRegime"
                  name="taxRegime"
                  defaultValue={employee.taxRegime}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="NEW">New Regime</option>
                  <option value="OLD">Old Regime</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="designation" className="text-xs font-medium">Designation</Label>
                <Input id="designation" name="designation" defaultValue={employee.designation ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-xs font-medium">Department</Label>
                <Input id="department" name="department" defaultValue={employee.department ?? ""} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle icon={Landmark}>Bank & Statutory</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bankName" className="text-xs font-medium">Bank Name</Label>
                <Input id="bankName" name="bankName" defaultValue={employee.bankName ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bankAccountNo" className="text-xs font-medium">Account Number</Label>
                <Input id="bankAccountNo" name="bankAccountNo" defaultValue={employee.bankAccountNo ?? ""} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="bankIfsc" className="text-xs font-medium">IFSC</Label>
                <Input id="bankIfsc" name="bankIfsc" defaultValue={employee.bankIfsc ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pan" className="text-xs font-medium">PAN</Label>
                <Input id="pan" name="pan" defaultValue={employee.pan ?? ""} placeholder="ABCDE1234F" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="uan" className="text-xs font-medium">UAN (PF)</Label>
                <Input id="uan" name="uan" defaultValue={employee.uan ?? ""} />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Employee updated successfully.</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/employees/${employee.employeeCode}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
