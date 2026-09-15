"use server";

import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

type ReportForPdf = {
  id: string;
  title: string;
  type: string;
  content: string;
  reportDate: Date;
  author: { firstName: string; lastName: string };
};

type ProjectForPdf = {
  id: string;
  projectId: string;
  name: string;
  status: string;
  location: string | null;
  manager: { firstName: string; lastName: string } | null;
};

const typeLabels: Record<string, string> = {
  PROGRESS: "Progress",
  INCIDENT: "Incident",
  FINANCIAL: "Financial",
  SAFETY: "Safety",
};

const s = StyleSheet.create({
  page: { padding: 24, fontSize: 9, fontFamily: "Helvetica", color: "#111827" },
  header: { backgroundColor: "#1e3a8a", color: "#ffffff", paddingTop: 14, paddingBottom: 14, paddingHorizontal: 24, marginBottom: 14 },
  headerTitle: { fontSize: 16, fontWeight: "bold" },
  headerSub: { fontSize: 9, marginTop: 2, opacity: 0.9 },
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 6, color: "#1e3a8a", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 3 },
  reportCard: { border: "1px solid #e5e7eb", borderRadius: 4, padding: 10, marginBottom: 8 },
  reportTitle: { fontSize: 11, fontWeight: "bold" },
  reportMeta: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  reportContent: { fontSize: 8, marginTop: 4, color: "#374151" },
  footer: { position: "absolute", bottom: 16, left: 24, right: 24, fontSize: 7, color: "#9ca3af", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 4, flexDirection: "row", justifyContent: "space-between" },
  statRow: { flexDirection: "row", marginBottom: 6 },
  statBox: { flex: 1, border: "1px solid #e5e7eb", padding: 6, marginRight: 4, alignItems: "center" },
  statBoxLast: { flex: 1, border: "1px solid #e5e7eb", padding: 6, alignItems: "center" },
  statValue: { fontSize: 14, fontWeight: "bold" },
  statLabel: { fontSize: 7, color: "#6b7280" },
});

export async function generateProjectReportPdf(projectId: string): Promise<Buffer> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true } },
      reports: { include: { author: { select: { id: true, name: true } } }, orderBy: { reportDate: "desc" } },
      _count: { select: { tasks: true, milestones: true, teamMembers: true } },
    },
  });
  if (!project) throw new Error("Project not found");

  const reports: ReportForPdf[] = project.reports.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    content: r.content,
    reportDate: r.reportDate,
    author: { firstName: r.author.name, lastName: "" },
  }));

  const proj: ProjectForPdf = {
    id: project.id,
    projectId: project.projectId,
    name: project.name,
    status: project.status,
    location: project.location,
    manager: project.manager ? { firstName: project.manager.firstName, lastName: project.manager.lastName } : null,
  };

  const totalReports = reports.length;
  const progressCount = reports.filter((r) => r.type === "PROGRESS").length;
  const safetyCount = reports.filter((r) => r.type === "SAFETY").length;
  const financialCount = reports.filter((r) => r.type === "FINANCIAL").length;
  const incidentCount = reports.filter((r) => r.type === "INCIDENT").length;

  const doc = (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Project Report History</Text>
          <Text style={s.headerSub}>
            {proj.name} ({proj.projectId}) · Status: {proj.status.replace("_", " ")}
            {proj.location ? ` · ${proj.location}` : ""}
            {proj.manager ? ` · Manager: ${proj.manager.firstName} ${proj.manager.lastName}` : ""}
          </Text>
        </View>

        <View style={[s.statRow, { marginBottom: 14 }]}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{totalReports}</Text>
            <Text style={s.statLabel}>Total Reports</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{progressCount}</Text>
            <Text style={s.statLabel}>Progress</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{safetyCount}</Text>
            <Text style={s.statLabel}>Safety</Text>
          </View>
          <View style={s.statBoxLast}>
            <Text style={s.statValue}>{financialCount + incidentCount}</Text>
            <Text style={s.statLabel}>Financial / Incident</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Report History</Text>
          {reports.length === 0 ? (
            <Text style={{ color: "#6b7280" }}>No reports have been recorded for this project.</Text>
          ) : (
            reports.map((r, i) => (
              <View key={r.id} style={s.reportCard}>
                <Text style={s.reportTitle}>
                  {i + 1}. {r.title}
                </Text>
                <Text style={s.reportMeta}>
                  Type: {typeLabels[r.type] || r.type} · Date: {formatDate(r.reportDate)} · Author: {r.author.firstName} {r.author.lastName}
                </Text>
                <Text style={s.reportContent}>{r.content}</Text>
              </View>
            ))
          )}
        </View>

        <View style={s.footer}>
          <Text>Generated on {formatDate(new Date())}</Text>
          <Text>HRMS Suite · Project Report Archive</Text>
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}