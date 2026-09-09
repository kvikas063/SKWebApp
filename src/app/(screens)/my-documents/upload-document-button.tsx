"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { UploadDocumentDialog } from "./upload-document-dialog";

export function UploadDocumentButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700"
      >
        <Upload className="mr-1.5 h-3.5 w-3.5" />
        Upload Document
      </Button>

      <UploadDocumentDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
