import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { generateProjectReportPdf } from "@/lib/services/project-report-pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const pdfBuffer = await generateProjectReportPdf(id);
    const uint8 = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (err) {
    console.error("PDF export error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}