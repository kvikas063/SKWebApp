import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Clock, MapPin, IndianRupee, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatBudget } from "../budget-utils";
import { ProjectActions } from "./project-actions";

import type { ProjectWithRelations, EmployeeSummary } from "@/lib/types/projects";

export function ProjectHeaderCard({ project, employees }: { project: ProjectWithRelations; employees: EmployeeSummary[] }) {
  const managerName = project.manager
    ? `${project.manager.firstName} ${project.manager.lastName}`
    : "Unassigned";
  const managerInitials = project.manager
    ? `${project.manager.firstName[0]}${project.manager.lastName[0]}`
    : "?";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 shrink-0">
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <ProjectActions project={project} employees={employees} />
      </div>
      <Card className="overflow-hidden">
      <div className="bg-primary p-6 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-white/80">
                {project.projectId}
              </span>
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                {project.priority}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            {project.location && (
              <p className="flex items-center gap-1 text-sm text-white/80">
                <MapPin className="h-4 w-4" />
                {project.location}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className="border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground backdrop-blur-sm"
          >
            {project.status.replace("_", " ")}
          </Badge>
        </div>

        {project.description && (
          <p className="mt-3 text-sm text-white/90">{project.description}</p>
        )}

<div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white/80">Overall Progress</span>
            <span className="font-bold">{project.progress ?? 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${project.progress ?? 0}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Manager</p>
            <div className="mt-1 flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="h-7 w-7 bg-primary-foreground/20 text-[10px] font-bold text-primary-foreground">
                  {managerInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold">{managerName}</span>
            </div>
          </div>
          <div className="rounded-md bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Team</p>
            <p className="mt-1 text-sm font-semibold">{project.teamMembers.length} members</p>
          </div>
          <div className="rounded-md bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Milestones</p>
            <p className="mt-1 text-sm font-semibold">{project.milestones.length}</p>
          </div>
          <div className="rounded-md bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Tasks</p>
            <p className="mt-1 text-sm font-semibold">{project.tasks.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-md border p-3">
          <Calendar className="h-5 w-5 text-indigo-500" />
          <div>
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="text-sm font-semibold">{project.startDate ? formatDate(project.startDate) : "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-md border p-3">
          <Clock className="h-5 w-5 text-rose-500" />
          <div>
            <p className="text-xs text-muted-foreground">End Date</p>
            <p className="text-sm font-semibold">{project.endDate ? formatDate(project.endDate) : "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-md border p-3">
          <IndianRupee className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="text-sm font-semibold">{formatBudget(project.budgetPaise ?? 0)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-md border p-3">
          <Users className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">Last Updated</p>
            <p className="text-sm font-semibold">{project.updatedAt ? formatDate(project.updatedAt) : "—"}</p>
          </div>
        </div>
      </div>
    </Card>
  </div>
);
}