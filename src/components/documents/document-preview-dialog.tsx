/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  documentId,
  fileName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  fileName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !documentId) return;

    let url: string | null = null;
    let cancelled = false;

    async function loadPreview() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/documents/${documentId}?preview=true`);
        if (!res.ok) throw new Error("Failed to load preview");
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        if (!cancelled) {
          setPreviewUrl(url);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load preview");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [open, documentId]);

  const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = fileName.match(/\.pdf$/i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl gap-0 p-0 sm:max-w-5xl">
        <div className="flex max-h-[90vh] flex-col">
          <div className="flex shrink-0 items-center gap-3 border-b border-border bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 px-6 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-foreground">{fileName}</h2>
              <p className="truncate text-xs text-muted-foreground">Preview</p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center bg-muted p-6">
            {loading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Loading preview…</p>
              </div>
            ) : error ? (
              <div className="text-sm text-rose-600">{error}</div>
            ) : previewUrl ? (
              <div className="flex w-full items-center justify-center">
                {isImage ? (
                  <img
                    src={previewUrl}
                    alt={fileName}
                    className="max-h-[70vh] max-w-full rounded-lg shadow-lg"
                  />
                ) : isPdf ? (
                  <iframe
                    src={previewUrl}
                    className="h-[70vh] w-full rounded-lg border"
                    title={fileName}
                  />
                ) : (
                  <div className="rounded-lg border bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// eslint-enable @next/next/no-img-element
