import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuth } from "@/lib/rbac";
import { getEmployeeDocuments } from "@/lib/actions/documents";
import { FileText } from "lucide-react";
import { DocumentsList } from "./documents-list";
import { UploadDocumentButton } from "./upload-document-button";

export default async function MyDocumentsPage() {
  const user = await requireAuth();
  if (user.role !== "EMPLOYEE") {
    redirect("/dashboard");
  }
  const employeeId = user.employeeId;
  if (!employeeId) {
    redirect("/dashboard");
  }

  const documents = await getEmployeeDocuments(employeeId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Documents"
        description={`${documents.length} document${documents.length === 1 ? "" : "s"} shared by the company`}
        icon={FileText}
        actions={<UploadDocumentButton />}
      />

      <DocumentsList documents={documents} />
    </div>
  );
}
