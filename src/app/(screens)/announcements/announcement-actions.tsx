"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Pin, Plus, Trash2, Loader2 } from "lucide-react";
import { createAnnouncement, deleteAnnouncement, togglePin } from "@/lib/actions/announcements";
import { useRouter } from "next/navigation";

export function AnnouncementActions({ mode, id, pinned }: { mode: "new" | "row" | "empty"; id?: string; pinned?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [pinnedState, setPinnedState] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createAnnouncement({ title, body, audience, pinned: pinnedState, sendEmail });
      setOpen(false);
      setTitle("");
      setBody("");
      setPinnedState(false);
      setSendEmail(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this announcement?")) return;
    await deleteAnnouncement(id);
    router.refresh();
  }

  async function handlePin() {
    if (!id) return;
    await togglePin(id);
    router.refresh();
  }

  if (mode === "row" && id) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" variant="ghost" onClick={handlePin} className="h-8 w-8 p-0" aria-label={pinned ? "Unpin" : "Pin"}>
          <Pin className={pinned ? "h-4 w-4 fill-amber-500 text-amber-500" : "h-4 w-4"} />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDelete} className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "empty" ? (
          <Button className="mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        ) : (
          <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Team outing on Friday" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Share the details with your team..."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="audience">Audience</Label>
              <select
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ALL">Everyone</option>
                <option value="ADMIN">Admins only</option>
                <option value="EMPLOYEES">Employees only</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex h-10 items-center gap-3 rounded-md border bg-muted/30 px-3">
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={pinnedState} onChange={(e) => setPinnedState(e.target.checked)} className="h-3.5 w-3.5" />
                  Pin
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="h-3.5 w-3.5" />
                  Email
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Publish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
