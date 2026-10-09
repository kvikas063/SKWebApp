import { prisma } from "../lib/prisma.js";
import { resolvePaging, type PagingQuery } from "../lib/pagination.js";
import type { Prisma } from "@prisma/client";
import { rupeesToPaise } from "../lib/money.js";
import bcrypt from "bcryptjs";

export interface EmployeeListRow {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string | null;
  designation: string | null;
  employeeType: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  userRole: string;
  createdAt: Date;
}

export interface EmployeeListSummary {
  totalEmployees: number;
  totalDepartments: number;
  totalGrossPaise: number;
  departmentCounts: Record<string, number>;
}

export interface PaginatedEmployees {
  data: EmployeeListRow[];
  total: number;
  page: number;
  limit: number;
  offset: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  summary: EmployeeListSummary;
  departmentCounts: Record<string, number>;
  filters: { search?: string; department?: string };
}

export async function listEmployees(params: PagingQuery): Promise<PaginatedEmployees> {
  const paging = resolvePaging(params);
  const search = params.search?.trim();
  const department = params.department?.trim();
  const departmentFilter = department && department !== "ALL" ? department : undefined;

  const where: Prisma.EmployeeWhereInput = {
    ...(search ? {
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ],
    } : {}),
    ...(departmentFilter ? { department: departmentFilter } : {}),
  };

  const [items, total, departmentCounts] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { employeeCode: "asc" },
      skip: paging.skip,
      take: paging.take,
      include: {
        user: { select: { name: true, email: true, role: true } },
        salaryComponents: {
          where: { isActive: true, type: "EARNING" },
          select: { amountPaise: true },
        },
      },
    }) as any,
    prisma.employee.count({ where }),
    prisma.employee.groupBy({
      by: ["department"],
      where,
      _count: { id: true },
    }) as any,
  ]);

  const data: EmployeeListRow[] = items.map((emp: any) => ({
    id: emp.id,
    employeeCode: emp.employeeCode,
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    department: emp.department,
    designation: emp.designation,
    employeeType: emp.employeeType,
    userId: emp.userId,
    userName: emp.user?.name ?? "",
    userEmail: emp.user?.email ?? "",
    userRole: emp.user?.role ?? "",
    createdAt: emp.createdAt,
  }));

  const deptCounts: Record<string, number> = {};
  for (const dc of departmentCounts) {
    deptCounts[dc.department ?? "Unknown"] = dc._count.id;
  }

  const totalGrossPaise = items.reduce(
    (sum: number, emp: any) => sum + (emp.salaryComponents?.reduce((s: number, c: any) => s + (c.amountPaise ?? 0), 0) ?? 0),
    0
  );

  const summaryData: EmployeeListSummary = {
    totalEmployees: total,
    totalDepartments: Object.keys(deptCounts).length,
    totalGrossPaise,
    departmentCounts: deptCounts,
  };

  const result: PaginatedEmployees = {
    data,
    total,
    page: paging.page,
    limit: paging.limit,
    offset: paging.offset,
    totalPages: Math.ceil(total / paging.limit),
    hasNext: paging.page < Math.ceil(total / paging.limit),
    hasPrev: paging.page > 1,
    summary: summaryData,
    departmentCounts: deptCounts,
    filters: { search, department },
  };

  return result;
}

export async function getEmployeeById(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, role: true, phone: true } },
      salaryComponents: { where: { isActive: true } },
      leaveBalances: true,
      documents: true,
    },
  });
}

export async function getEmployeeByCode(code: string) {
  return prisma.employee.findUnique({
    where: { employeeCode: code } as any,
    include: {
      user: { select: { name: true, email: true, role: true, phone: true } },
      salaryComponents: { where: { isActive: true } },
      leaveBalances: true,
      documents: true,
    },
  });
}

export async function createEmployee(data: {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  employeeType: "REGULAR" | "PROBATION" | "CONTRACT";
  taxRegime: "OLD" | "NEW";
  dateOfJoining: Date;
  dateOfBirth?: Date;
  phone?: string;
  bankAccount?: string;
  ifscCode?: string;
  panNumber?: string;
  aadharNumber?: string;
  uanNumber?: string;
  esiNumber?: string;
  salaryComponents: { name: string; type: "EARNING" | "DEDUCTION"; amount: number }[];
}) {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      role: "EMPLOYEE",
      passwordHash: await bcrypt.hash("changeme123", 12),
    },
  });

  const employee = await prisma.employee.create({
    data: {
      employeeCode: data.employeeCode,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      department: data.department,
      designation: data.designation,
      employeeType: data.employeeType as any,
      taxRegime: data.taxRegime as any,
      dateOfJoining: data.dateOfJoining,
      dateOfBirth: data.dateOfBirth,
      phone: data.phone,
      bankAccount: data.bankAccount,
      ifscCode: data.ifscCode,
      panNumber: data.panNumber,
      aadharNumber: data.aadharNumber,
      uanNumber: data.uanNumber,
      esiNumber: data.esiNumber,
      userId: user.id,
      salaryComponents: {
        create: data.salaryComponents.map((sc) => ({
          name: sc.name,
          type: sc.type as any,
          amountPaise: rupeesToPaise(sc.amount),
          isActive: true,
        })),
      },
    } as any,
    include: { user: true, salaryComponents: true },
  });

  return employee;
}

export async function updateEmployee(id: string, data: Partial<{
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  employeeType: "REGULAR" | "PROBATION" | "CONTRACT";
  taxRegime: "OLD" | "NEW";
  dateOfBirth: Date;
  phone: string;
  bankAccount: string;
  ifscCode: string;
  panNumber: string;
  aadharNumber: string;
  uanNumber: string;
  esiNumber: string;
}>) {
  return prisma.employee.update({
    where: { id },
    data: data as any,
    include: { user: true, salaryComponents: true },
  });
}

export async function deleteEmployee(id: string) {
  return prisma.$transaction(async (tx) => {
    const emp = await tx.employee.findUnique({ where: { id }, select: { userId: true } });
    await tx.employee.delete({ where: { id } });
    if (emp?.userId) {
      await tx.user.delete({ where: { id: emp.userId } });
    }
  });
}