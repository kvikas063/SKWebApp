import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ReportActions } from "./report-actions";
import { ReportPreviewDialog } from "./report-preview-dialog";

const typeLabels: Record<string, string> = {
  PROGRESS: "Progress",
  INCIDENT: "Incident",
  FINANCIAL: "Financial",
  SAFETY: "Safety",
};

export function ReportList({ projectId, reports, projectLabel }: { projectId: string; reports: any[]; projectLabel?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Reports</h3>
        <div className="flex items-center gap-2">
          <ReportPreviewDialog projectId={projectId} projectLabel={projectLabel}>
            <Button size="sm" variant="outline" className="h-11 gap-1.5 rounded-md border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40">
              <FileText className="h-3.5 w-3.5" />
              Export PDF
            </Button>
          </ReportPreviewDialog>
          <ReportActions projectId={projectId} />
        </div>
      </div>
      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No reports yet</p>
            <p className="text-sm text-muted-foreground">Create progress, safety, or financial reports.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{r.title}</h4>
                      <Badge variant="secondary" className="text-[10px]">
                        {typeLabels[r.type] || r.type}
                      </Badge>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{r.content}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{r.author.firstName} {r.author.lastName}</span>
                      <span>·</span>
                      <span>{formatDate(r.reportDate)}</span>
                    </div>
                  </div>
                  <ReportActions projectId={projectId} report={r} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}