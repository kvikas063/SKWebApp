"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Eye, FileText, FileSpreadsheet, FileArchive, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PreviewRow = Record<string, string | number | null | undefined>;
export type PreviewColumn = { key: string; label: string; align?: "left" | "right" | "center"; format?: (v: unknown, row: PreviewRow) => React.ReactNode };

export type PreviewData = {
  headers: PreviewColumn[];
  rows: PreviewRow[];
  summary?: { label: string; value: string }[];
  note?: string;
};

export type PreviewKind = "csv" | "zip" | "pdf";

export interface FilePreviewDialogProps {
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerClassName?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  kind?: PreviewKind;
  fetchPreview: () => Promise<PreviewData>;
  buildDownload: () => Promise<{ content: BlobPart; filename: string; mime: string }>;
  downloadLabel?: string;
  emptyText?: string;
}

function KindIcon({ kind }: { kind: PreviewKind }) {
  if (kind === "zip") return <FileArchive className="h-5 w-5" />;
  if (kind === "pdf") return <FileText className="h-5 w-5" />;
  return <FileSpreadsheet className="h-5 w-5" />;
}

export function FilePreviewDialog({
  triggerLabel = "Preview & Download",
  triggerVariant = "outline",
  triggerClassName,
  title,
  description,
  icon,
  kind = "csv",
  fetchPreview,
  buildDownload,
  downloadLabel,
  emptyText = "No data to preview.",
}: FilePreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<PreviewData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchPreview();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preview");
    } finally {
      setLoading(false);
    }
  }, [fetchPreview]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open && !data) load();
  }, [open, data, load]);

  useEffect(() => {
    if (!open) {
      setData(null);
      setError("");
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleDownload() {
    setDownloading(true);
    setError("");
    try {
      const { content, filename, mime } = await buildDownload();
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  const triggerClasses = cn(
    triggerClassName,
    triggerVariant === "outline" &&
      "border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant={triggerVariant} size="sm" onClick={() => setOpen(true)} className={triggerClasses}>
        {icon ?? <Eye className="h-3.5 w-3.5" />}
        {triggerLabel}
      </Button>
      <DialogContent className="max-w-5xl gap-0 p-0 sm:max-w-5xl">
        <div className="flex max-h-[90vh] flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 pl-6 pr-14 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                <KindIcon kind={kind} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-foreground">{title}</h2>
                {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                onClick={handleDownload}
                disabled={downloading || loading || !data}
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm hover:from-indigo-600 hover:to-violet-700"
              >
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {downloadLabel ?? "Download"}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-muted p-6">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Preparing preview…</p>
              </div>
            ) : error ? (
              <div className="flex h-64 items-center justify-center text-sm text-rose-600">{error}</div>
            ) : data && data.rows.length > 0 ? (
              <PreviewContent data={data} emptyText={emptyText} />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{emptyText}</div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-6 py-3 text-xs text-muted-foreground">
            <div>
              {data && data.rows.length > 0 ? (
                <>
                  <span className="font-semibold text-foreground">{data.rows.length}</span> row{data.rows.length === 1 ? "" : "s"} ·{" "}
                  <span className="font-semibold text-foreground">{data.headers.length}</span> column{data.headers.length === 1 ? "" : "s"}
                </>
              ) : (
                <span>Preview is empty</span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewContent({ data, emptyText }: { data: PreviewData; emptyText: string }) {
  return (
    <div className="space-y-4">
      {data.summary && data.summary.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.summary.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 text-base font-semibold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {data.note && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {data.note}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-purple-950/30">
                {data.headers.map((h) => (
                  <th
                    key={h.key}
                    className={cn(
                      "border-r border-border/60 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-foreground last:border-r-0",
                      h.align === "right" ? "text-right" : h.align === "center" ? "text-center" : "text-left"
                    )}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.rows.map((row, i) => (
                <tr key={i} className="transition-colors hover:bg-muted/40">
                  {data.headers.map((h) => {
                    const raw = row[h.key];
                    const rendered = h.format ? h.format(raw, row) : (raw ?? "—");
                    return (
                      <td
                        key={h.key}
                        className={cn(
                          "max-w-[260px] truncate border-r border-border/40 px-4 py-2 font-medium text-foreground last:border-r-0",
                          h.align === "right" ? "text-right tabular-nums" : h.align === "center" ? "text-center" : "text-left"
                        )}
                        title={typeof raw === "string" || typeof raw === "number" ? String(raw) : undefined}
                      >
                        {rendered}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.rows.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}
