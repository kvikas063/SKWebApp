"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { MilestoneList } from "./milestone-list";
import { TaskList } from "./task-list";
import { TeamList } from "./team-list";
import { ReportList } from "./report-list";
import { ProjectSummary } from "./project-summary";

import type { ProjectWithRelations, EmployeeSummary } from "@/lib/types/projects";

/**
 * Count pill inside a tab. It reads from the trigger's `data-state` via the
 * `group` class on the trigger, so it inverts automatically when that tab is
 * selected and needs no per-tab styling.
 */
function TabCount({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground transition-colors",
        "group-data-[state=active]:bg-white/25 group-data-[state=active]:text-white"
      )}
    >
      {value}
    </span>
  );
}

export function ProjectTabs({ project, employees }: { project: ProjectWithRelations; employees: EmployeeSummary[] }) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="milestones">
          Milestones <TabCount value={project.milestones.length} />
        </TabsTrigger>
        <TabsTrigger value="tasks">
          Tasks <TabCount value={project.tasks.length} />
        </TabsTrigger>
        <TabsTrigger value="team">
          Team <TabCount value={project.teamMembers.length} />
        </TabsTrigger>
        <TabsTrigger value="reports">
          Reports <TabCount value={project.reports.length} />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <ProjectSummary project={project} />
      </TabsContent>

      <TabsContent value="milestones">
        <MilestoneList projectId={project.id} milestones={project.milestones} />
      </TabsContent>

      <TabsContent value="tasks">
        <TaskList projectId={project.id} tasks={project.tasks} />
      </TabsContent>

      <TabsContent value="team">
        <TeamList projectId={project.id} members={project.teamMembers} employees={employees} />
      </TabsContent>

      <TabsContent value="reports">
        <ReportList projectId={project.id} reports={project.reports} projectLabel={project.projectId} />
      </TabsContent>
    </Tabs>
  );
}