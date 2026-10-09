import { prisma } from "../lib/prisma.js";
import { resolvePaging } from "../lib/pagination.js";
import { rupeesToPaise } from "../lib/money.js";
import bcrypt from "bcryptjs";
export async function listEmployees(params) {
    const paging = resolvePaging(params);
    const search = params.search?.trim();
    const department = params.department?.trim();
    const departmentFilter = department && department !== "ALL" ? department : undefined;
    const where = {
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
        }),
        prisma.employee.count({ where }),
        prisma.employee.groupBy({
            by: ["department"],
            where,
            _count: { id: true },
        }),
    ]);
    const data = items.map((emp) => ({
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
    const deptCounts = {};
    for (const dc of departmentCounts) {
        deptCounts[dc.department ?? "Unknown"] = dc._count.id;
    }
    const totalGrossPaise = items.reduce((sum, emp) => sum + (emp.salaryComponents?.reduce((s, c) => s + (c.amountPaise ?? 0), 0) ?? 0), 0);
    const summaryData = {
        totalEmployees: total,
        totalDepartments: Object.keys(deptCounts).length,
        totalGrossPaise,
        departmentCounts: deptCounts,
    };
    const result = {
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
export async function getEmployeeById(id) {
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
export async function getEmployeeByCode(code) {
    return prisma.employee.findUnique({
        where: { employeeCode: code },
        include: {
            user: { select: { name: true, email: true, role: true, phone: true } },
            salaryComponents: { where: { isActive: true } },
            leaveBalances: true,
            documents: true,
        },
    });
}
export async function createEmployee(data) {
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
            employeeType: data.employeeType,
            taxRegime: data.taxRegime,
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
                    type: sc.type,
                    amountPaise: rupeesToPaise(sc.amount),
                    isActive: true,
                })),
            },
        },
        include: { user: true, salaryComponents: true },
    });
    return employee;
}
export async function updateEmployee(id, data) {
    return prisma.employee.update({
        where: { id },
        data: data,
        include: { user: true, salaryComponents: true },
    });
}
export async function deleteEmployee(id) {
    return prisma.$transaction(async (tx) => {
        const emp = await tx.employee.findUnique({ where: { id }, select: { userId: true } });
        await tx.employee.delete({ where: { id } });
        if (emp?.userId) {
            await tx.user.delete({ where: { id: emp.userId } });
        }
    });
}
//# sourceMappingURL=employees.js.map