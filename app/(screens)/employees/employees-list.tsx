"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatINR } from "@/lib/money";
import { Mail, Briefcase, Building2, Users as UsersIcon, Search, X } from "lucide-react";
import type { DepartmentCount } from "@/lib/types/employees";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  employeeCode: string;
  designation: string | null;
  department: string | null;
  employeeType: string;
  salaryComponents: { type: string; amountPaise: number }[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const typeVariants: Record<string, "default" | "secondary" | "warning" | "success"> = {
  REGULAR: "default",
  PART_TIME: "secondary",
  PROBATION: "warning",
  CONTRACTUAL: "success",
};

export function EmployeesList({
  employees,
  total,
  page,
  pageSize,
  totalPages,
  departmentCounts,
}: {
  employees: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  departmentCounts: DepartmentCount[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search = searchParams.get("search") ?? "";
  const department = searchParams.get("department") ?? "ALL";

  // Keep a local copy so typing stays responsive, and push to the URL (which
  // triggers the server-side query) once the user pauses. The local copy is
  // re-synced from the URL whenever the URL value changes underneath us
  // (e.g. back/forward navigation).
  const [term, setTerm] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (syncedSearch !== search) {
    setSyncedSearch(search);
    setTerm(search);
  }

  // Any filter change must send the user back to the first page, otherwise a
  // deep page number can leave them on an empty result set.
  function navigate(updates: Record<string, string | null>, { resetPage = true } = {}) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    if (resetPage) next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  useEffect(() => {
    if (term === search) return;
    const timer = setTimeout(() => navigate({ search: term }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function goToPage(next: number) {
    navigate({ page: next === 1 ? null : String(next) }, { resetPage: false });
  }

  const departmentTotal = departmentCounts.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by name, email, code, designation..."
              className="pl-9 pr-9"
            />
            {term && (
              <button
                type="button"
                onClick={() => {
                  setTerm("");
                  navigate({ search: null });
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {departmentCounts.length > 0 && (
            <select
              value={department}
              onChange={(e) => navigate({ department: e.target.value === "ALL" ? null : e.target.value })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">All departments ({departmentTotal})</option>
              {departmentCounts.map((d) => (
                <option key={d.department} value={d.department}>
                  {d.department} ({d.count})
                </option>
              ))}
            </select>
          )}
        </div>

        {total === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <UsersIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No employees match your filters</p>
            <p className="text-sm text-muted-foreground">
              {search ? `No results for "${search}"` : "Try a different department"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTerm("");
                navigate({ search: null, department: null });
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <ul className={`divide-y transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}>
              {employees.map((emp) => {
                const gross = emp.salaryComponents
                  .filter((c) => c.type === "EARNING")
                  .reduce((s, c) => s + c.amountPaise, 0);
                const fullName = `${emp.firstName} ${emp.lastName}`;
                return (
                  <li key={emp.id}>
                    <Link
                      href={`/employees/${emp.employeeCode}`}
                      className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white">
                          {getInitials(fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{fullName}</p>
                        <p className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-mono">{emp.employeeCode}</span>
                          {emp.designation && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {emp.designation}
                            </span>
                          )}
                          {emp.email && (
                            <span className="hidden items-center gap-1 sm:flex">
                              <Mail className="h-3 w-3" />
                              {emp.email}
                            </span>
                          )}
                        </p>
                      </div>
                      {emp.department && (
                        <Badge variant="secondary" className="hidden md:inline-flex">
                          <Building2 className="mr-1 h-3 w-3" />
                          {emp.department}
                        </Badge>
                      )}
                      <Badge variant={typeVariants[emp.employeeType] ?? "secondary"}>
                        {emp.employeeType.replace("_", " ")}
                      </Badge>
                      <div className="hidden text-right sm:block">
                        <p className="text-sm font-bold">{formatINR(gross)}</p>
                        <p className="text-[10px] text-muted-foreground">per month</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={total}
              pageSize={pageSize}
              onPageChange={goToPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
