import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fileToBuffer, deleteFile } from "@/lib/storage";

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

  try {
    const fileBuffer = await fileToBuffer(doc.filePath);
    const isPreview = _req.nextUrl.searchParams.get("preview") === "true";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType ?? "application/octet-stream",
        "Content-Disposition": isPreview
          ? "inline"
          : `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
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

  await deleteFile(doc.filePath);

  await prisma.employeeDocument.delete({
    where: { id: documentId },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
