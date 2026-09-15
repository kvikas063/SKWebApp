"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createTask, updateTask } from "@/lib/actions/projects";

export function TaskActions({ projectId, task, onSuccess }: { projectId: string; task?: any; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "MEDIUM");
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
  const [estimatedHours, setEstimatedHours] = useState(String(task?.estimatedHours || 0));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (task) {
        await updateTask(task.id, { status: task.status, actualHours: task.actualHours });
      } else {
        await createTask(projectId, { title, description, priority, dueDate, estimatedHours: Number(estimatedHours) });
      }
      setOpen(false);
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
      setEstimatedHours("0");
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
        {task ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update task details." : "Create a new project task."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input id="estimatedHours" type="number" min="0" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" size="sm" className="h-11 rounded-md bg-muted text-muted-foreground shadow-sm hover:bg-muted/80" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="h-11 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
              {task ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}