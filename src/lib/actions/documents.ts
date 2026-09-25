"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";
import { deleteFile } from "@/lib/storage";

export async function getEmployeeDocuments(employeeId: string) {
  const user = await requireAuth();
  if (user.role === "MANAGER") {
    const me = await prisma.employee.findFirst({ where: { userId: user.id } });
    if (!me || me.id !== employeeId) {
      throw new Error("Forbidden");
    }
  }
  return prisma.employeeDocument.findMany({
    where: { employeeId },
    orderBy: { uploadedAt: "desc" },
  });
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

  return { success: true };
}
