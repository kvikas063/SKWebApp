import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slipId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slipId } = await ctx.params;

  const slip = await prisma.paySlip.findUnique({
    where: { id: slipId },
    include: {
      payRun: { include: { company: true } },
      employee: true,
    },
  });
  if (!slip) {
    return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwn = slip.employee?.userId === session.user.id;
  if (!isAdmin && !isOwn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(slip);
}
