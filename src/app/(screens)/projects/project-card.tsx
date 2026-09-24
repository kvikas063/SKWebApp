import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Clock, ArrowRight, Building2 } from "lucide-react";
import { formatBudget } from "./budget-utils";

import type { ProjectSummaryRow } from "@/lib/types/projects";

const statusVariant: Record<string, "default" | "secondary" | "warning" | "success" | "destructive"> = {
  PLANNING: "secondary",
  IN_PROGRESS: "warning",
  ON_HOLD: "destructive",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const priorityVariant: Record<string, "default" | "secondary" | "warning" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  CRITICAL: "destructive",
};

export function ProjectCard({ project }: { project: ProjectSummaryRow }) {
  const managerName = project.manager
    ? `${project.manager.firstName} ${project.manager.lastName}`
    : "Unassigned";
  const managerInitials = project.manager
    ? `${project.manager.firstName[0]}${project.manager.lastName[0]}`
    : "?";

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <div className="relative overflow-hidden rounded-md border bg-card p-5 shadow-sm transition-all duration-200 ease-out  hover:border-accent">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-muted-foreground">
                {project.projectId}
              </span>
              <Badge variant={priorityVariant[project.priority]} className="text-[10px]">
                {project.priority}
              </Badge>
            </div>
            <h3 className="text-lg font-bold leading-tight tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
              {project.name}
            </h3>
            {project.location && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {project.location}
              </p>
            )}
          </div>
          <Badge variant={statusVariant[project.status]} className="shrink-0">
            {project.status.replace("_", " ")}
          </Badge>
        </div>

        {project.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        )}

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Progress</span>
            <span className="font-bold">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="h-7 w-7 bg-primary text-[10px] font-bold text-primary-foreground">
                {managerInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{managerName}</p>
              <p className="text-[10px] text-muted-foreground">Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project._count.teamMembers}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {project._count.tasks}
            </span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
          </div>
        </div>

{Number(project.budgetPaise ?? 0) > 0 && (
             <div className="mt-3 flex items-center justify-between rounded-md bg-muted/60 px-3 py-2">
               <span className="text-xs text-muted-foreground">Budget</span>
               <span className="text-xs font-bold">{formatBudget(project.budgetPaise ?? 0)}</span>
             </div>
           )}
      </div>
    </Link>
  );
}