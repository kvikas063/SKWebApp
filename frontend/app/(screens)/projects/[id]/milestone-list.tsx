import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { MilestoneActions } from "./milestone-actions";

import type { MilestoneWithProgress } from "@/lib/types/projects";

const statusVariant: Record<string, "default" | "secondary" | "warning" | "success" | "destructive"> = {
  PENDING: "secondary",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  DELAYED: "destructive",
};

export function MilestoneList({ projectId, milestones }: { projectId: string; milestones: MilestoneWithProgress[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Milestones</h3>
        <MilestoneActions projectId={projectId} />
      </div>
      {milestones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No milestones yet</p>
            <p className="text-sm text-muted-foreground">Break the project into phases with milestones.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{m.name}</h4>
                      <Badge variant={statusVariant[m.status]} className="text-[10px]">
                        {m.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {m.description && (
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {m.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due {formatDate(m.dueDate)}
                        </span>
                      )}
                      {m.completedAt && (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed {formatDate(m.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <MilestoneActions milestone={m} projectId={projectId} />
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Progress</span>
                    <span className="font-bold">{m.progress ?? 0}%</span>
                  </div>
                  <Progress value={m.progress ?? 0} className="mt-1 h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}