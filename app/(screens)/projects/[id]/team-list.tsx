import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Briefcase } from "lucide-react";
import { TeamActions } from "./team-actions";
import type { ProjectTeamMemberWithRelations, EmployeeSummary } from "@/lib/types/projects";

export function TeamList({ projectId, members, employees }: { projectId: string; members: ProjectTeamMemberWithRelations[]; employees: EmployeeSummary[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Members</h3>
        <TeamActions projectId={projectId} employees={employees} />
      </div>
      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <User className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No team members yet</p>
            <p className="text-sm text-muted-foreground">Add employees to the project team.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => {
            const emp = m.employee;
            const initials = `${emp.firstName[0]}${emp.lastName[0]}`;
            return (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="h-10 w-10 bg-primary text-sm font-bold text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{emp.employeeCode}</p>
                        {m.role && <Badge variant="outline" className="mt-1 text-[10px]">{m.role}</Badge>}
                      </div>
                    </div>
                    <TeamActions projectId={projectId} member={m} employees={employees} />
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {emp.department || "Unassigned"}
                    </span>
                    {emp.designation && <span>{emp.designation}</span>}
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