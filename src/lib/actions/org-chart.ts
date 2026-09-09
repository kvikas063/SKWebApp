"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

export type OrgNode = {
  id: string;
  name: string;
  designation: string | null;
  department: string | null;
  employeeCode: string;
  managerId: string | null;
  profilePhoto: string | null;
  isActive: boolean;
  reports: OrgNode[];
};

export async function getOrgChart(companyId: string): Promise<OrgNode[]> {
  await requireAuth();
  const employees = await prisma.employee.findMany({
    where: { companyId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
      employeeCode: true,
      managerId: true,
      profilePhoto: true,
      isActive: true,
    },
  });

  const map = new Map<string, OrgNode>();
  for (const e of employees) {
    map.set(e.id, {
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      designation: e.designation,
      department: e.department,
      employeeCode: e.employeeCode,
      managerId: e.managerId,
      profilePhoto: e.profilePhoto,
      isActive: e.isActive,
      reports: [],
    });
  }

  const roots: OrgNode[] = [];
  for (const node of map.values()) {
    if (node.managerId && map.has(node.managerId)) {
      map.get(node.managerId)!.reports.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort: managers first then alphabetically
  function sortTree(nodes: OrgNode[]) {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const n of nodes) sortTree(n.reports);
  }
  sortTree(roots);
  return roots;
}

export async function getManagerChain(employeeId: string) {
  await requireAuth();
  const chain: { id: string; name: string; designation: string | null }[] = [];
  let current = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { manager: true },
  });
  let depth = 0;
  while (current?.managerId && depth < 10) {
    const mgr = await prisma.employee.findUnique({
      where: { id: current.managerId },
      include: { manager: true },
    });
    if (!mgr) break;
    chain.push({ id: mgr.id, name: `${mgr.firstName} ${mgr.lastName}`, designation: mgr.designation });
    current = mgr;
    depth++;
  }
  return chain;
}
