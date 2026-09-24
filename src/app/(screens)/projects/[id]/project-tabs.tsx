"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MilestoneList } from "./milestone-list";
import { TaskList } from "./task-list";
import { TeamList } from "./team-list";
import { ReportList } from "./report-list";
import { ProjectSummary } from "./project-summary";

import type { ProjectWithRelations, EmployeeSummary } from "@/lib/types/projects";

export function ProjectTabs({ project, employees }: { project: ProjectWithRelations; employees: EmployeeSummary[] }) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="milestones">Milestones ({project.milestones.length})</TabsTrigger>
        <TabsTrigger value="tasks">Tasks ({project.tasks.length})</TabsTrigger>
        <TabsTrigger value="team">Team ({project.teamMembers.length})</TabsTrigger>
        <TabsTrigger value="reports">Reports ({project.reports.length})</TabsTrigger>
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