"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatINR } from "@/lib/money";
import { Mail, Briefcase, Building2, Users as UsersIcon, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function EmployeesList({ employees }: { employees: Employee[] }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [employees]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return employees.filter((emp) => {
      if (dept !== "ALL" && emp.department !== dept) return false;
      if (!term) return true;
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const hay = [
        fullName,
        emp.firstName?.toLowerCase() ?? "",
        emp.lastName?.toLowerCase() ?? "",
        emp.email?.toLowerCase() ?? "",
        emp.employeeCode.toLowerCase(),
        emp.designation?.toLowerCase() ?? "",
        emp.department?.toLowerCase() ?? "",
      ].join(" ");
      return hay.includes(term);
    });
  }, [employees, q, dept]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [q, dept]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  function goTo(p: number) {
    setPage(Math.min(Math.max(1, p), totalPages));
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, code, designation..."
              className="pl-9 pr-9"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {departments.length > 0 && (
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">All departments ({employees.length})</option>
              {departments.map((d) => {
                const count = employees.filter((e) => e.department === d).length;
                return (
                  <option key={d} value={d}>
                    {d} ({count})
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <UsersIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No employees match your filters</p>
            <p className="text-sm text-muted-foreground">
              {q ? `No results for "${q}"` : "Try a different department"}
            </p>
            <Button variant="outline" size="sm" onClick={() => { setQ(""); setDept("ALL"); setPage(1); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
          <ul className="divide-y">
            {paged.map((emp) => {
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

          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{(page - 1) * PAGE_SIZE + 1}</span>–
                <span className="font-semibold text-foreground">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                <span className="font-semibold text-foreground">{filtered.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goTo(1)}
                  disabled={page === 1}
                  aria-label="First page"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goTo(page - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 7) return true;
                    if (p === 1 || p === totalPages) return true;
                    if (Math.abs(p - page) <= 1) return true;
                    return false;
                  })
                  .reduce<Array<number | "ellipsis-prev" | "ellipsis-next">>((acc, p, i, arr) => {
                    if (i > 0) {
                      const prev = arr[i - 1] as number;
                      if (p - prev > 1) {
                        acc.push(p === page - 1 ? "ellipsis-prev" : "ellipsis-next");
                      }
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    typeof item === "number" ? (
                      <Button
                        key={item}
                        variant={item === page ? "default" : "outline"}
                        size="icon"
                        className={cn(
                          "h-8 w-8 text-xs font-semibold tabular-nums",
                          item === page && "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm"
                        )}
                        onClick={() => goTo(item)}
                      >
                        {item}
                      </Button>
                    ) : (
                      <span key={`e-${i}`} className="px-1 text-xs text-muted-foreground">
                        …
                      </span>
                    )
                  )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goTo(page + 1)}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goTo(totalPages)}
                  disabled={page === totalPages}
                  aria-label="Last page"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
