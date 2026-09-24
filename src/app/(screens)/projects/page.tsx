import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getProjects, getProjectEmployees } from "@/lib/actions/projects";
import { requireAuth } from "@/lib/rbac";
import { Building2, Calendar, TrendingUp, FolderKanban, Wallet } from "lucide-react";
import { ProjectCard } from "./project-card";
import { ProjectFilter } from "./project-filter";
import { NewProjectPopup } from "./new-project-popup";
import { formatBudget } from "./budget-utils";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAuth();
  const params = await searchParams;
  const projects = await getProjects({ status: params.status });
  const employees = await getProjectEmployees();

  const total = projects.length;
  const inProgress = projects.filter((p) => p.status === "IN_PROGRESS").length;
  const completed = projects.filter((p) => p.status === "COMPLETED").length;
  const planning = projects.filter((p) => p.status === "PLANNING").length;
  const totalBudget = projects.reduce((s, p) => s + Number(p.budgetPaise ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage construction projects, track progress, and coordinate teams"
        icon={FolderKanban}
        actions={<NewProjectPopup employees={employees} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total" value={total} icon={<FolderKanban className="h-5 w-5" />} />
        <StatCard title="Planning" value={planning} icon={<Calendar className="h-5 w-5" />} />
        <StatCard title="In Progress" value={inProgress} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Completed" value={completed} icon={<Building2 className="h-5 w-5" />} />
        <StatCard title="Total Budget" value={formatBudget(totalBudget)} icon={<Wallet className="h-5 w-5" />} />
      </div>

      <ProjectFilter />

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No projects found</p>
            <p className="text-sm text-muted-foreground">Create your first construction project to get started.</p>
            <NewProjectPopup employees={employees} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}