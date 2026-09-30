"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { deleteFile } from "@/lib/storage";
import { buildPageMeta, resolvePaging, settlePage } from "@/lib/services/pagination";
import { revalidatePath } from "next/cache";

async function assertCanReadEmployeeDocuments(employeeId: string) {
  const user = await requireAuth();
  if (user.role === "MANAGER") {
    const me = await prisma.employee.findFirst({ where: { userId: user.id } });
    if (!me || me.id !== employeeId) {
      throw new Error("Forbidden");
    }
  }
  return user;
}

/** One page of an employee's documents. */
export async function getEmployeeDocumentsPage(
  employeeId: string,
  params: { page?: number | string; limit?: number | string; offset?: number | string } = {}
) {
  await assertCanReadEmployeeDocuments(employeeId);
  const paging = resolvePaging(params);

  const findPage = (p: typeof paging) =>
    prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { uploadedAt: "desc" },
      take: p.take,
      skip: p.skip,
    });

  const [data, total] = await Promise.all([
    findPage(paging),
    prisma.employeeDocument.count({ where: { employeeId } }),
  ]);

  const settled = await settlePage({ data, paging, total, refetch: findPage });
  return { data: settled.data, ...buildPageMeta({ ...paging, page: settled.page }, total) };
}

export async function deleteEmployeeDocument(documentId: string) {
  const user = await requireAuth();
  if (user.role !== "EMPLOYEE" || !user.employeeId) {
    throw new Error("Forbidden");
  }

  const doc = await prisma.employeeDocument.findUnique({
    where: { id: documentId },
    select: { id: true, employeeId: true, filePath: true },
  });

  if (!doc || doc.employeeId !== user.employeeId) {
    throw new Error("Document not found or access denied");
  }

  await deleteFile(doc.filePath);

  await prisma.employeeDocument.delete({
    where: { id: documentId },
  });


  revalidatePath("/my-documents");
  return { success: true };
}
