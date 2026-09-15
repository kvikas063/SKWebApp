import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, AlertCircle, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TaskActions } from "./task-actions";

const statusVariant: Record<string, "default" | "secondary" | "warning" | "success" | "destructive"> = {
  TODO: "secondary",
  IN_PROGRESS: "warning",
  BLOCKED: "destructive",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const priorityVariant: Record<string, "default" | "secondary" | "warning" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  CRITICAL: "destructive",
};

export function TaskList({ projectId, tasks }: { projectId: string; tasks: any[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <TaskActions projectId={projectId} />
      </div>
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No tasks yet</p>
            <p className="text-sm text-muted-foreground">Assign tasks to team members to track work.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => {
            const assigneeName = t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : "Unassigned";
            const assigneeInitials = t.assignee ? `${t.assignee.firstName[0]}${t.assignee.lastName[0]}` : "?";
            return (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{t.title}</h4>
                        <Badge variant={priorityVariant[t.priority]} className="text-[10px]">
                          {t.priority}
                        </Badge>
                      </div>
                      {t.description && (
                        <p className="text-sm text-muted-foreground">{t.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {t.dueDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due {formatDate(t.dueDate)}
                          </span>
                        )}
                        {t.estimatedHours > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t.actualHours.toFixed(0)}/{t.estimatedHours.toFixed(0)}h
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[t.status]}>{t.status.replace("_", " ")}</Badge>
                      <TaskActions task={t} projectId={projectId} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="h-6 w-6 bg-primary text-[10px] font-bold text-primary-foreground">
                        {assigneeInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{assigneeName}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}