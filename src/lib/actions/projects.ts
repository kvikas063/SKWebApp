"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, requireManager } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  location: z.string().optional(),
  budgetPaise: z.coerce.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  managerId: z.string().optional(),
});

export async function getProjects(filters?: { status?: string }) {
  const company = await prisma.company.findFirst();
  if (!company) return [];
  return prisma.project.findMany({
    where: {
      companyId: company.id,
      ...(filters?.status ? { status: filters.status as any } : {}),
    },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true } },
      _count: { select: { tasks: true, teamMembers: true, milestones: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getProjectById(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true, department: true } },
      milestones: { orderBy: { createdAt: "asc" }, include: { _count: { select: { tasks: true } } } },
      tasks: { include: { assignee: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" } },
      teamMembers: { include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true, department: true } } } },

      reports: { include: { author: { select: { id: true, name: true } } }, orderBy: { reportDate: "desc" } },
    },
  });
}

export async function getProjectEmployees() {
  const company = await prisma.company.findFirst();
  if (!company) return [];
  return prisma.employee.findMany({
    where: { companyId: company.id, isActive: true },
    select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}

export async function createProject(data: z.infer<typeof ProjectSchema>) {
  await requireAdmin();
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company configured");

  const parsed = ProjectSchema.parse(data);
  const year = new Date().getFullYear();
  const count = await prisma.project.count({ where: { companyId: company.id } });
  const projectId = `PRJ-${year}-${String(count + 1).padStart(3, "0")}`;

  const project = await prisma.project.create({
    data: {
      projectId,
      name: parsed.name,
      description: parsed.description,
      status: parsed.status as any,
      priority: parsed.priority as any,
      location: parsed.location,
      budgetPaise: parsed.budgetPaise ?? 0,
      startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
      endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
      managerId: parsed.managerId,
      companyId: company.id,
    },
  });

  revalidatePath("/projects");
  return project;
}

export async function updateProject(projectId: string, data: Partial<z.infer<typeof ProjectSchema>>) {
  await requireManager();
  const parsed = ProjectSchema.partial().parse(data);
  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...parsed,
      startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
      endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return project;
}

export async function deleteProject(projectId: string) {
  await requireAdmin();
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/projects");
}

export async function createMilestone(projectId: string, data: { name: string; description?: string; dueDate?: string }) {
  await requireManager();
  const milestone = await prisma.milestone.create({
    data: {
      name: data.name,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      projectId,
    },
  });
  revalidatePath(`/projects/${projectId}`);
  return milestone;
}

export async function updateMilestone(milestoneId: string, data: { status?: string; progress?: number; completedAt?: string | null }) {
  await requireManager();
  const milestone = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      status: data.status as any,
      completedAt: data.completedAt ? new Date(data.completedAt) : data.completedAt === null ? null : undefined,
    },
  });
  revalidatePath("/projects");
  return milestone;
}

export async function createTask(projectId: string, data: { title: string; description?: string; milestoneId?: string; assigneeId?: string; priority?: string; dueDate?: string; estimatedHours?: number }) {
  await requireManager();
  const task = await prisma.projectTask.create({
    data: {
      title: data.title,
      description: data.description,
      milestoneId: data.milestoneId,
      assigneeId: data.assigneeId,
      priority: (data.priority as any) ?? "MEDIUM",
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      estimatedHours: data.estimatedHours ?? 0,
      projectId,
    },
  });
  revalidatePath(`/projects/`);
  return task;
}

export async function updateTask(taskId: string, data: { status?: string; actualHours?: number; completedAt?: string | null }) {
  await requireManager();
  const task = await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      status: data.status as any,
      actualHours: data.actualHours,
      completedAt: data.completedAt ? new Date(data.completedAt) : data.completedAt === null ? null : undefined,
    },
  });
  revalidatePath("/projects");
  return task;
}

export async function addTeamMember(projectId: string, employeeId: string, role?: string) {
  await requireManager();
  const member = await prisma.projectTeamMember.create({
    data: { projectId, employeeId, role },
  });
  revalidatePath(`/projects/${projectId}`);
  return member;
}

export async function removeTeamMember(memberId: string, projectId: string) {
  await requireManager();
  await prisma.projectTeamMember.delete({ where: { id: memberId } });
  revalidatePath(`/projects/${projectId}`);
}

export async function createProjectReport(projectId: string, data: { title: string; type: string; content: string }) {
  await requireManager();
  const user = await requireAuth();
  const employee = await prisma.employee.findFirst({ where: { userId: user.id } });
  if (!employee) throw new Error("No employee profile");

  const report = await prisma.projectReport.create({
    data: {
      title: data.title,
      type: data.type,
      content: data.content,
      reportDate: new Date(),
      projectId,
      authorId: employee.id,
    },
  });
  revalidatePath(`/projects/${projectId}`);
  return report;
}