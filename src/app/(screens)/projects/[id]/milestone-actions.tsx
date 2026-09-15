"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createMilestone, updateMilestone } from "@/lib/actions/projects";

interface MilestoneFormProps {
  projectId: string;
  milestone?: any;
  onSuccess: () => void;
  trigger: React.ReactNode;
}

export function MilestoneActions({ projectId, milestone, onSuccess }: { projectId: string; milestone?: any; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(milestone?.name || "");
  const [description, setDescription] = useState(milestone?.description || "");
  const [dueDate, setDueDate] = useState(milestone?.dueDate ? new Date(milestone.dueDate).toISOString().split("T")[0] : "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (milestone) {
        await updateMilestone(milestone.id, { progress: milestone.progress, status: milestone.status });
      } else {
        await createMilestone(projectId, { name, description, dueDate });
      }
      setOpen(false);
      setName("");
      setDescription("");
      setDueDate("");
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {milestone ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" />
            Add Milestone
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{milestone ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
          <DialogDescription>
            {milestone ? "Update milestone details." : "Create a new project milestone."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" size="sm" className="h-11 rounded-md bg-muted text-muted-foreground shadow-sm hover:bg-muted/80" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="h-11 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
              {milestone ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}