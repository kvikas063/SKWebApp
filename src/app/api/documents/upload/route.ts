import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
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

  // Scope the upload directory to a fixed subfolder of the project so
  // Turbopack can statically trace the filesystem access. Without this the
  // dynamic env-driven path causes the whole project to be bundled into the
  // server function graph, inflating cold starts.
  const baseDir = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "uploads");
  const absoluteDir = path.join(baseDir, "documents");
  if (!fs.existsSync(absoluteDir)) {
    fs.mkdirSync(absoluteDir, { recursive: true });
  }

  const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const absolutePath = path.join(absoluteDir, safeFileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  fs.writeFileSync(absolutePath, buffer);

  const doc = await prisma.employeeDocument.create({
    data: {
      employeeId: session.user.employeeId,
      type: docType,
      fileName: file.name,
      filePath: absolutePath,
      mimeType: file.type || null,
      fileSize: file.size || null,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
