"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Briefcase, Mail, Hash, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/money";
import { Pagination } from "@/components/ui/pagination";

export type OrgEmployee = {
  id: string;
  employeeCode: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  department: string | null;
  designation: string | null;
  directReportCount: number;
  latestNetPaise: number;
};

export type OrgDepartment = {
  name: string;
  headcount: number;
  pct: number;
  monthlyCost: number;
};

function getInitials(first: string | null, last: string | null, code: string): string {
  const a = (first ?? "").trim();
  const b = (last ?? "").trim();
  if (a || b) return `${a[0] ?? ""}${b[0] ?? ""}`.toUpperCase();
  return code.slice(0, 2).toUpperCase();
}

const PAGE_SIZE = 20;

export function OrgDirectoryTable({
  tab,
  employees,
  managers,
  departments,
  isAdmin,
}: {
  tab: "employees" | "managers" | "departments";
  employees: OrgEmployee[];
  managers: OrgEmployee[];
  departments: OrgDepartment[];
  isAdmin: boolean;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const baseList = tab === "employees" ? employees : tab === "managers" ? managers : null;

  const filtered = useMemo(() => {
    if (!baseList) return null;
    const q = search.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter((e) =>
      [e.firstName, e.lastName, e.employeeCode, e.email, e.department, e.designation]
        .filter(Boolean)
        .some((v) => (v ?? "").toLowerCase().includes(q))
    );
  }, [baseList, search]);

  const filteredDepts = useMemo(() => {
    if (baseList !== null) return null;
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => d.name.toLowerCase().includes(q));
  }, [baseList, departments, search]);

  const total = baseList !== null ? filtered!.length : filteredDepts!.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [tab, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  if (total === 0) {
    return (
      <>
        <div className="flex flex-col gap-2 border-b px-4 py-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab}…`}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-72"
          />
        </div>
        <p className="p-6 text-center text-sm text-muted-foreground">No matches found.</p>
      </>
    );
  }

  const start = (page - 1) * PAGE_SIZE;
  const paged = baseList !== null ? filtered!.slice(start, start + PAGE_SIZE) : filteredDepts!.slice(start, start + PAGE_SIZE);

  return (
    <>
      <div className="flex flex-col gap-2 border-b px-4 py-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab}…`}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-72"
        />
        <p className="text-xs text-muted-foreground sm:ml-auto">
          <span className="font-semibold text-foreground">{total}</span>
          {search.trim() && baseList !== null && <span> of {baseList.length}</span>}
          {search.trim() && baseList === null && <span> of {departments.length}</span>}
        </p>
      </div>

      {tab === "departments" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Headcount</TableHead>
              <TableHead className="text-right">% of Workforce</TableHead>
              <TableHead className="text-right">Latest Monthly Net</TableHead>
              {isAdmin && <TableHead></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(paged as OrgDepartment[]).map((d) => (
              <TableRow key={d.name}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">Department</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-bold tabular-nums">{d.headcount}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-xs font-semibold text-muted-foreground tabular-nums">{d.pct}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {d.monthlyCost > 0 ? formatINR(d.monthlyCost) : "—"}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Link
                      href={`/employees?department=${encodeURIComponent(d.name)}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      View
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Email</TableHead>
              {tab === "managers" && <TableHead className="text-right">Direct Reports</TableHead>}
              <TableHead className="text-right">Latest Net</TableHead>
              {isAdmin && <TableHead></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(paged as OrgEmployee[]).map((e) => {
              const initials = getInitials(e.firstName, e.lastName, e.employeeCode);
              return (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
                        {initials}
                      </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {e.firstName ?? ""} {e.lastName ?? ""}
                            {e.firstName == null && e.lastName == null ? (
                              <span className="text-muted-foreground">—</span>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground">{e.department || "No department"}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      <Hash className="mr-0.5 h-2.5 w-2.5" />
                      {e.employeeCode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{e.department || "Unassigned"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{e.designation || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <a href={`mailto:${e.email}`} className="text-xs text-muted-foreground hover:text-indigo-600">
                        {e.email}
                      </a>
                    </div>
                  </TableCell>
                  {tab === "managers" && (
                    <TableCell className="text-right">
                      <Badge variant="success" className="font-bold tabular-nums">
                        {e.directReportCount}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-right font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {e.latestNetPaise > 0 ? formatINR(e.latestNetPaise) : "—"}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Link
                         href={`/employees/${e.employeeCode}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        View
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </>
  );
}
