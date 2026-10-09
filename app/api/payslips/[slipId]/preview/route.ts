import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/lib/prisma";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slipId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slipId } = await ctx.params;

  // An explicit `select` of exactly what the preview dialog renders, rather than
  // `include`-ing whole relations. Spreading `employee` sent Aadhaar number,
  // home address, date of birth, phone, tax regime and the linked user id;
  // spreading `company` sent the company's PF and ESI registration numbers;
  // and spreading `payRun` sent the run's other employee totals, which belong
  // to a payroll-run view and not to one person's payslip.
  const slip = await prisma.paySlip.findUnique({
    where: { id: slipId },
    select: {
      id: true,
      grossPaise: true,
      netPaise: true,
      totalDeductionsPaise: true,
      daysPresent: true,
      daysAbsent: true,
      lopDays: true,
      paidDays: true,
      earningsJson: true,
      deductionsJson: true,
      statutoryJson: true,
      employee: {
        select: {
          // Required for the ownership check below; dropped before responding.
          userId: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          designation: true,
          department: true,
          pan: true,
          uan: true,
          bankName: true,
          bankAccountNo: true,
          bankIfsc: true,
        },
      },
      payRun: {
        select: {
          year: true,
          month: true,
          status: true,
          company: {
            select: {
              name: true,
              address: true,
              city: true,
              state: true,
              pincode: true,
              pan: true,
              tan: true,
            },
          },
        },
      },
    },
  });
  if (!slip) {
    return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
  }

  // `userId` is selected only so the ownership check below has something to
  // compare; it is then dropped from the object that gets sent.
  const { userId, ...employee } = slip.employee;

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // The trailing `employee` overrides the spread's own copy, which still
  // carries `userId`.
  return NextResponse.json({ ...slip, employee });
}
