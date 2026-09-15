import { notFound } from "next/navigation";
import { getProjectById, getProjectEmployees } from "@/lib/actions/projects";
import { requireAuth } from "@/lib/rbac";
import { ProjectHeaderCard } from "./project-header-card";
import { ProjectTabs } from "./project-tabs";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();
  const employees = await getProjectEmployees();

  return (
    <div className="space-y-6">
      <ProjectHeaderCard project={project} employees={employees} />
      <ProjectTabs project={project} employees={employees} />
    </div>
  );
}