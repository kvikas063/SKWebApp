"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X } from "lucide-react";

const DOCUMENT_TYPES = [
  { value: "ID_PROOF", label: "ID Proof", sublabels: ["Aadhaar", "PAN", "Voter Card", "Passport"] },
  { value: "PAN", label: "PAN Card", sublabels: [] },
  { value: "BANK", label: "Bank Details", sublabels: ["Canceled Cheque", "Bank Statement"] },
  { value: "OTHER", label: "Other", sublabels: [] },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function UploadDocumentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<string>("OTHER");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 5MB limit. Selected: ${(selected.size / (1024 * 1024)).toFixed(1)}MB`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError(null);
    setFile(selected);
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Upload failed");
      }

      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload");
    } finally {
      setUploading(false);
      setFile(null);
      setType("OTHER");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleClose() {
    onOpenChange(false);
    setFile(null);
    setType("OTHER");
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const selectedType = DOCUMENT_TYPES.find((t) => t.value === type);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>Upload a new document to your personal records.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Document Type</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {DOCUMENT_TYPES.map((docType) => (
                <option key={docType.value} value={docType.value}>
                  {docType.label}
                </option>
              ))}
            </select>
            {selectedType?.sublabels.length ? (
              <p className="text-xs text-muted-foreground">Examples: {selectedType.sublabels.join(", ")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>File</Label>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            {!file ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            ) : (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Maximum file size: 5MB. Supported: PDF, DOC, DOCX, JPG, PNG</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
