import { put, get, del } from "@vercel/blob";
import { join, resolve } from "path";
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from "fs";

// Vercel sets VERCEL=1 and NODE_ENV=production, but we check VERCEL explicitly
// because some deployments may not set NODE_ENV correctly.
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
const isProd = isVercel || process.env.NODE_ENV === "production";

export interface StoredFile {
  url: string;
  size: number;
  mimeType: string;
}

export interface FileMetadata {
  size: number;
  mimeType: string;
  downloadUrl: string;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export async function saveFile(file: File, folder: string): Promise<StoredFile> {
  const safeName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isProd && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobPath = `${folder}/${safeName}`;
      const blob = await put(blobPath, buffer, {
        access: "public",
        contentType: file.type,
      });
      return {
        url: blob.url,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
      };
    } catch (err) {
      console.error("[storage] Blob put failed, falling back to /tmp", { err });
    }
  }

  // Fallback: write to /tmp (ephemeral on Vercel, but at least uploads succeed)
  const baseDir = process.env.UPLOAD_DIR
    ? resolve(process.env.UPLOAD_DIR)
    : join("/tmp", "uploads");
  const absoluteDir = join(baseDir, folder);
  ensureDir(absoluteDir);
  const absolutePath = join(absoluteDir, safeName);
  writeFileSync(absolutePath, buffer);

  return {
    url: absolutePath,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
  };
}

export async function getFile(filePath: string): Promise<FileMetadata> {
  if (isProd && filePath.startsWith("https://")) {
    try {
      const result = await get(filePath, { access: "public" });
      if (!result || result.statusCode === 304) {
        throw new Error("File not found in blob storage");
      }
      return {
        size: result.blob.size,
        mimeType: result.blob.contentType,
        downloadUrl: result.blob.downloadUrl,
      };
    } catch (err) {
      console.error("[storage] Blob get failed", { err });
    }
  }

  if (!existsSync(filePath)) {
    throw new Error("File not found on disk");
  }

  const stat = readFileSync(filePath);
  return {
    size: stat.length,
    mimeType: "application/octet-stream",
    downloadUrl: filePath,
  };
}

export async function deleteFile(filePath: string): Promise<void> {
  if (isProd && filePath.startsWith("https://")) {
    try {
      await del(filePath);
    } catch (err) {
      console.error("[storage] Blob delete failed", { err });
    }
  } else {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }
}

export async function fileToBuffer(filePath: string): Promise<ArrayBuffer> {
  if (isProd && filePath.startsWith("https://")) {
    try {
      const result = await get(filePath, { access: "public" });
      if (!result || result.statusCode === 304) {
        throw new Error("File not found in blob storage");
      }
      return await new Response(result.stream).arrayBuffer();
    } catch (err) {
      console.error("[storage] Blob get failed, trying /tmp", { err });
    }
  }

  if (!existsSync(filePath)) {
    throw new Error("File not found on disk");
  }

  return readFileSync(filePath).buffer;
}
