"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EmployeeDocument } from "@prisma/client";
import { FileText, Download, Trash2, Eye } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { DocumentPreviewDialog } from "@/components/documents/document-preview-dialog";

export function DocumentsList({ documents }: { documents: EmployeeDocument[] }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);

  async function handleDownload(doc: EmployeeDocument) {
    setDownloadingId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to download");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(doc: EmployeeDocument) {
    const confirmed = window.confirm(`Are you sure you want to delete "${doc.fileName}"?`);
    if (!confirmed) return;

    setDeletingId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Delete failed");
      }

      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  function handlePreview(doc: EmployeeDocument) {
    setPreviewDoc(doc);
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">No documents yet</p>
          <p className="text-sm text-muted-foreground">
            Documents shared by the company will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.type.replace("_", " ")} · {formatDate(doc.uploadedAt)}
                      {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(1)} KB` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded on {formatDateTime(doc.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePreview(doc)}
                    title="Preview"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc)}
                    disabled={downloadingId === doc.id}
                  >
                    {downloadingId === doc.id ? (
                      "Downloading..."
                    ) : (
                      <>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                  >
                    {deletingId === doc.id ? (
                      "Deleting..."
                    ) : (
                      <>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {previewDoc && (
        <DocumentPreviewDialog
          open={!!previewDoc}
          onOpenChange={(open) => !open && setPreviewDoc(null)}
          documentId={previewDoc.id}
          fileName={previewDoc.fileName}
        />
      )}
    </>
  );
}
