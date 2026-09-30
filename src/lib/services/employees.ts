import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/rbac";
import {
  buildPageMeta,
  pagingQuerySchema,
  readQueryResult,
  resolvePaging,
} from "@/lib/services/pagination";
import type {
  DepartmentCount,
  EmployeeListRow,
  EmployeeListSummary,
  GetEmployeesParams,
  PaginatedEmployees,
} from "@/lib/types/employees";

/**
 * Query-string schema for the HTTP layer (`GET /api/employees`): the shared
 * paging rules plus this resource's own filters.
 *
 * The server action receives already-typed arguments, so it does not go
 * through this schema; both paths converge on `listEmployees`, which re-applies
 * the same clamps defensively.
 */
const employeesQuerySchema = pagingQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  department: z.string().trim().min(1).max(100).optional(),
});

/** Parse `URLSearchParams` into validated query args, or a field-keyed error map. */
export function parseEmployeesQuery(params: URLSearchParams) {
  // `?page=` and friends coerce to NaN; `readQueryResult`'s sibling
  // `parsePagingQuery` normalises blanks the same way. Mirror that here so an
  // empty query string falls back to defaults instead of failing.
  const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
  const input = Object.fromEntries(
    Array.from(params.keys()).map((key) => [key, blank(params.get(key))]),
  );
  return readQueryResult(employeesQuerySchema.safeParse(input));
}

function emptyResult(limit: number): PaginatedEmployees {
  return {
    data: [],
    total: 0,
    page: 1,
    limit,
    offset: 0,
    totalPages: 1,
    summary: { totalEmployees: 0, totalDepartments: 0, totalGrossPaise: 0 },
    departmentCounts: [],
  };
}

/**
 * The employee list query, shared by the `/employees` page (via the
 * `getEmployees` server action) and `GET /api/employees`.
 *
 * `user` is passed in rather than resolved here so this module stays free of
 * `redirect()` and can be called from a route handler, where an unauthenticated
 * request must become a 401 instead of a redirect to `/login`.
 */
export async function listEmployees(
  user: SessionUser,
  params: GetEmployeesParams = {},
): Promise<PaginatedEmployees> {
  const paging = resolvePaging(params);

  const company = await prisma.company.findFirst();
  if (!company) return emptyResult(paging.limit);

  // `scopeWhere` is the caller-scoped set (a manager only ever sees direct
  // reports). It backs the department facets, which must list every department
  // rather than just the ones present on the current page.
  const scopeWhere: Prisma.EmployeeWhereInput = { companyId: company.id, isActive: true };

  if (user.role === "MANAGER") {
    const me = await prisma.employee.findFirst({ where: { userId: user.id } });
    if (!me) return emptyResult(paging.limit);
    scopeWhere.managerId = me.id;
  }

  const filters: Prisma.EmployeeWhereInput[] = [];
  const search = params.search?.trim();
  if (search) {
    filters.push({
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const department = params.department?.trim();
  if (department && department !== "ALL") {
    filters.push({ department });
  }

  const where: Prisma.EmployeeWhereInput = filters.length
    ? { AND: [scopeWhere, ...filters] }
    : scopeWhere;

  const [total, rows, gross] = await prisma.$transaction([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      // An explicit select rather than the full model: the list never needs
      // bank details, PAN/Aadhaar/UAN or address, and this module is reachable
      // over HTTP, so those columns must not leave the server by default.
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        designation: true,
        department: true,
        employeeType: true,
        dateOfJoining: true,
        isActive: true,
        salaryComponents: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true, type: true, amountPaise: true, sortOrder: true },
        },
        user: { select: { id: true, email: true, role: true } },
      },
      orderBy: { employeeCode: "asc" },
      take: paging.take,
      skip: paging.skip,
    }),
    prisma.salaryComponent.aggregate({
      where: { isActive: true, type: "EARNING", employee: { is: where } },
      _sum: { amountPaise: true },
    }),
  ]);

  // Department facets come from the caller-scoped set, ignoring the search box
  // and the page, so the filter dropdown keeps offering every department.
  const grouped = await prisma.employee.groupBy({
    by: ["department"],
    where: { ...scopeWhere, department: { not: null } },
    orderBy: { department: "asc" },
    _count: { department: true },
  });

  const departmentCounts: DepartmentCount[] = grouped.map((g) => ({
    department: g.department as string,
    count: g._count.department,
  }));

  const data: EmployeeListRow[] = rows.map((row) => ({
    ...row,
    // Serialise dates here so the RSC payload and the JSON body share one shape.
    dateOfJoining: row.dateOfJoining.toISOString(),
  }));

  const summary: EmployeeListSummary = {
    totalEmployees: total,
    totalDepartments: departmentCounts.length,
    totalGrossPaise: gross._sum?.amountPaise ?? 0,
  };

  return {
    data,
    ...buildPageMeta(paging, total),
    summary,
    departmentCounts,
  };
}
