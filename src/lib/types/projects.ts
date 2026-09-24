import type { Project, Milestone, ProjectTask, ProjectTeamMember, ProjectReport, Employee, User } from "@prisma/client";
import type { ProjectStatus, ProjectPriority, TaskPriority } from "@prisma/client";

// Re-export the Prisma enums so consumers can import them from a single
// location alongside the domain types defined below.
export type { ProjectStatus, ProjectPriority, TaskPriority };

// A minimal employee shape used across project UI components.
export interface EmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation: string | null;
}

// Milestone with an optional `progress` field used by the UI. The Prisma
// schema does not store progress, so it may be undefined at runtime.
// The UI also includes the task count via the Prisma `_count` relation.
export interface MilestoneWithProgress extends Milestone {
  progress?: number;
  _count?: { tasks: number };
}

// Task as rendered in the project UI.
export interface ProjectTaskWithRelations extends ProjectTask {
  assignee?: Employee | null;
  milestone?: Milestone | null;
}

// Team member as rendered in the project UI.
export interface ProjectTeamMemberWithRelations extends ProjectTeamMember {
  employee: Employee;
}

// Report as rendered in the project UI. The Prisma `User` model has a single
// `name` field, so we expose it under that name.
export interface ProjectReportWithRelations extends ProjectReport {
  author: User;
}

// Manager as rendered in the project UI.
export interface EmployeeWithManager extends Employee {
  manager?: Employee | null;
}

// Full project shape used by the project detail page and its children.
// `progress` is not stored in the Prisma schema; it is computed by the UI
// and therefore optional.
export interface ProjectWithRelations extends Project {
  manager?: EmployeeWithManager | null;
  milestones: MilestoneWithProgress[];
  tasks: ProjectTaskWithRelations[];
  teamMembers: ProjectTeamMemberWithRelations[];
  reports: ProjectReportWithRelations[];
  progress?: number;
}

// A project row as returned by `getProjects` (list view).
export interface ProjectSummaryRow extends Project {
  manager?: EmployeeWithManager | null;
  _count: {
    tasks: number;
    teamMembers: number;
    milestones: number;
  };
  // Computed progress percentage (0-100) used by the project card.
  progress?: number;
}