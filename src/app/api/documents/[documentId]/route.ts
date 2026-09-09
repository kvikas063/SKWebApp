import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ documentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await ctx.params;
  const doc = await prisma.employeeDocument.findUnique({
    where: { id: documentId },
    include: { employee: { select: { userId: true, companyId: true } } },
  });
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwn = doc.employee.userId === session.user.id;
  if (!isAdmin && !isOwn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!fs.existsSync(doc.filePath)) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(doc.filePath);
  const isPreview = _req.nextUrl.searchParams.get("preview") === "true";

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType ?? "application/octet-stream",
      "Content-Disposition": isPreview ? "inline" : `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ documentId: string }> }
) {
  const session = await auth();
  if (!session?.user || !session.user.employeeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { documentId } = await ctx.params;

  const doc = await prisma.employeeDocument.findUnique({
    where: { id: documentId },
    select: { id: true, employeeId: true, filePath: true },
  });

  if (!doc || doc.employeeId !== session.user.employeeId) {
    return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
  }

  if (fs.existsSync(doc.filePath)) {
    fs.unlinkSync(doc.filePath);
  }

  await prisma.employeeDocument.delete({
    where: { id: documentId },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
