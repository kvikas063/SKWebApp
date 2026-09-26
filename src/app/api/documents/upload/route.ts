import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import type { DocumentType } from "@prisma/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "jpg", "jpeg", "png"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

const ALLOWED_DOCUMENT_TYPES = new Set([
  "ID_PROOF",
  "PAN",
  "BANK",
  "OFFER_LETTER",
  "OTHER",
]);

function getExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYEE" || !session.user.employeeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) || "OTHER";

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File size exceeds 5MB limit. Selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB` },
      { status: 400 }
    );
  }

  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: PDF, DOC, DOCX, JPG, PNG" },
      { status: 400 }
    );
  }

  if (!ALLOWED_DOCUMENT_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }

  const docType = type as DocumentType;

  try {
    const stored = await saveFile(file, "documents");

    const doc = await prisma.employeeDocument.create({
      data: {
        employeeId: session.user.employeeId,
        type: docType,
        fileName: file.name,
        filePath: stored.url,
        mimeType: file.type || null,
        fileSize: file.size || null,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error("[upload] failed to store document", { err, employeeId: session.user.employeeId });
    return NextResponse.json(
      { error: "Failed to store document. Please verify BLOB storage is configured." },
      { status: 500 }
    );
  }
}
