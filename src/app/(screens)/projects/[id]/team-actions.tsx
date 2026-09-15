"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { addTeamMember, removeTeamMember } from "@/lib/actions/projects";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation: string | null;
}

export function TeamActions({ projectId, member, employees, onSuccess }: { projectId: string; member?: any; employees: Employee[]; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) return;
    setLoading(true);
    try {
      await addTeamMember(projectId, employeeId, role);
      setOpen(false);
      setEmployeeId("");
      setRole("");
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (!member) return;
    try {
      await removeTeamMember(member.id, projectId);
      onSuccess?.();
    } catch (err) {
      console.error(err);
    }
  }

  if (member) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600" onClick={handleRemove}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>Add an employee to this project team.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="employeeId">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger id="employeeId"><SelectValue placeholder="Select an employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    {emp.designation ? ` - ${emp.designation}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Site Engineer" />
          </div>
          <DialogFooter>
            <Button type="button" size="sm" className="h-11 rounded-md bg-muted text-muted-foreground shadow-sm hover:bg-muted/80" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="h-11 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}