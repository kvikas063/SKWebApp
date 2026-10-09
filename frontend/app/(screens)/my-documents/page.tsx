import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuth } from "@/server/lib/rbac";
import { getEmployeeDocumentsPage } from "@/server/actions/documents";
import { FileText } from "lucide-react";
import { DocumentsList } from "./documents-list";
import { UploadDocumentButton } from "./upload-document-button";

type SearchParams = Promise<{ page?: string }>;

export default async function MyDocumentsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireAuth();
  if (user.role !== "EMPLOYEE") {
    redirect("/dashboard");
  }
  const employeeId = user.employeeId;
  if (!employeeId) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const { data: documents, page, limit, total, totalPages } = await getEmployeeDocumentsPage(employeeId, {
    page: params.page,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Documents"
        description={`${total} document${total === 1 ? "" : "s"} shared by the company`}
        icon={FileText}
        actions={<UploadDocumentButton />}
      />

      <DocumentsList
        documents={documents}
        total={total}
        page={page}
        pageSize={limit}
        totalPages={totalPages}
      />
    </div>
  );
}
