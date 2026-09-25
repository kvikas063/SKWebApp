import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMonthName } from "@/lib/utils";

// @react-pdf/renderer is a heavy native dependency (~20MB of JS + native libs).
// Importing it at module scope forces every serverless function in the app
// to pay its cold-start cost. It is only needed here, so lazy-load it inside
// the handler to keep the common function graph tiny.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ slipId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slipId } = await ctx.params;

  const slip = await prisma.paySlip.findUnique({
    where: { id: slipId },
    include: { payRun: true, employee: { select: { userId: true } } },
  });
  if (!slip) {
    return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
  }

  // Employees can only download their own payslips; admins can download any
  const isAdmin = session.user.role === "ADMIN";
  const isOwn = slip.employee.userId === session.user.id;
  if (!isAdmin && !isOwn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Lazy-load only after authz checks pass.
  const { generatePayslipPdf } = await import("@/lib/services/payslip-pdf");
  const buffer = await generatePayslipPdf(slipId);
  const filename = `payslip-${getMonthName(slip.payRun.month)}-${slip.payRun.year}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
