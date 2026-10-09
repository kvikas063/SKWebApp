import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";

interface ReportPreviewDialogProps {
  projectId: string;
  projectLabel?: string;
  children: React.ReactNode;
}

export function ReportPreviewDialog({ projectId, projectLabel, children }: ReportPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  async function loadPdf() {
    if (pdfUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/report-pdf`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) loadPdf();
  }

  function handleDownload() {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `project-report-${projectLabel || projectId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent
        className="max-w-3xl gap-0 p-0 sm:max-w-3xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex max-h-[90vh] flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Project Report Preview</h2>
                <p className="text-xs text-muted-foreground">Preview and download the project report archive</p>
              </div>
            </div>
            <Button
              onClick={handleDownload}
              disabled={!pdfUrl || loading}
              size="sm"
              className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download PDF
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto bg-muted p-6">
            {loading ? (
              <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="h-[70vh] w-full rounded-lg border border-border bg-white"
                title="Report Preview"
              />
            ) : (
              <div className="flex h-[70vh] items-center justify-center text-muted-foreground">
                Failed to load preview
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}