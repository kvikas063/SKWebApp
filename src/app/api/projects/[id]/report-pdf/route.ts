import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";

// @react-pdf/renderer is a heavy native dependency. Lazy-load it inside the
// handler so the common serverless function graph stays tiny and cold starts
// are fast for every route that does NOT generate a PDF.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const { generateProjectReportPdf } = await import("@/lib/services/project-report-pdf");
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