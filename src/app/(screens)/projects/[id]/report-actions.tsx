"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText } from "lucide-react";
import { createProjectReport } from "@/lib/actions/projects";

export function ReportActions({ projectId, report, onSuccess }: { projectId: string; report?: any; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(report?.title || "");
  const [type, setType] = useState(report?.type || "PROGRESS");
  const [content, setContent] = useState(report?.content || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createProjectReport(projectId, { title, type, content });
      setOpen(false);
      setTitle("");
      setType("PROGRESS");
      setContent("");
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (report) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" />
          Add Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Report</DialogTitle>
          <DialogDescription>Log a progress, safety, financial, or incident report.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PROGRESS">Progress</SelectItem>
                <SelectItem value="INCIDENT">Incident</SelectItem>
                <SelectItem value="FINANCIAL">Financial</SelectItem>
                <SelectItem value="SAFETY">Safety</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={4} required />
          </div>
          <DialogFooter>
            <Button type="button" size="sm" className="h-11 rounded-md bg-muted text-muted-foreground shadow-sm hover:bg-muted/80" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="h-11 rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}