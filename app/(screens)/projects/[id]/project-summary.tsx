import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, DonutChart, type DonutSlice } from "@/components/ui/charts";
import { Clock, TrendingUp, Calendar } from "lucide-react";
import type { ProjectTaskWithRelations, MilestoneWithProgress } from "@/lib/types/projects";

export function ProjectSummary({ project }: { project: { tasks: ProjectTaskWithRelations[]; milestones: MilestoneWithProgress[] } }) {
  const tasks = project.tasks;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;
  const todoTasks = tasks.filter((t) => t.status === "TODO").length;
  const totalEstimated = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const totalActual = tasks.reduce((s, t) => s + (t.actualHours || 0), 0);

  const taskStatusData: DonutSlice[] = [
    { label: "Completed", value: completedTasks, color: "#10b981" },
    { label: "In Progress", value: inProgressTasks, color: "#f59e0b" },
    { label: "Blocked", value: blockedTasks, color: "#ef4444" },
    { label: "Todo", value: todoTasks, color: "#64748b" },
  ].filter((d) => d.value > 0);

  const milestoneData = project.milestones.map((m, i) => ({
    label: m.name,
    value: m.progress ?? 0,
    color: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"][i % 6],
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Project Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border p-4">
              <p className="text-xs text-muted-foreground">Task Completion</p>
              <p className="mt-1 text-2xl font-bold">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</p>
              <Progress value={totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0} className="mt-2 h-2" />
            </div>
            <div className="rounded-md border p-4">
              <p className="text-xs text-muted-foreground">Milestone Progress</p>
              <p className="mt-1 text-2xl font-bold">
                {project.milestones.length > 0
                  ? Math.round(project.milestones.reduce((s, m) => s + (m.progress ?? 0), 0) / project.milestones.length)
                  : 0}%
              </p>
              <Progress
                value={project.milestones.length > 0 ? project.milestones.reduce((s, m) => s + (m.progress ?? 0), 0) / project.milestones.length : 0}
                className="mt-2 h-2"
              />
            </div>
            <div className="rounded-md border p-4">
              <p className="text-xs text-muted-foreground">Estimated Hours</p>
              <p className="mt-1 text-2xl font-bold">{totalEstimated.toFixed(0)}h</p>
              <p className="mt-1 text-xs text-muted-foreground">Actual: {totalActual.toFixed(0)}h</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-xs text-muted-foreground">Blocked Tasks</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: blockedTasks > 0 ? "#ef4444" : "#10b981" }}>
                {blockedTasks}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {blockedTasks > 0 ? "Requires attention" : "No blockers"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Task Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {taskStatusData.length > 0 ? (
              <DonutChart data={taskStatusData} size={180} centerLabel="Total" centerValue={String(totalTasks)} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No tasks yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-500" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {milestoneData.length > 0 ? (
              <BarChart data={milestoneData} height={180} color="#8b5cf6" />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No milestones yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}