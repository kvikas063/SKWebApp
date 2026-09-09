"use server";

import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { createElement } from "react";
import { prisma } from "@/lib/prisma";
import { paiseToRupees } from "@/lib/money";
import { getMonthName } from "@/lib/utils";

type PaySlipForPdf = {
  id: string;
  grossPaise: number;
  netPaise: number;
  totalDeductionsPaise: number;
  daysPresent: number;
  daysAbsent: number;
  lopDays: number;
  paidDays: number;
  earningsJson: unknown;
  deductionsJson: unknown;
  statutoryJson: unknown;
  employee: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    designation: string | null;
    department: string | null;
    pan: string | null;
    uan: string | null;
    bankName: string | null;
    bankAccountNo: string | null;
    bankIfsc: string | null;
  };
};

type Company = {
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  pan: string | null;
  tan: string | null;
  pfNumber: string | null;
  esiNumber: string | null;
};

// Classic widely-used payslip template:
// - Top dark header bar (company name + payslip period)
// - Employee details table (5-column grid)
// - Earnings & Deductions side-by-side tables with totals
// - Net pay row
// - Statutory + Bank details two-column at bottom
// - Signature footer
const s = StyleSheet.create({
  page: { padding: 0, fontSize: 9, fontFamily: "Helvetica", color: "#111827" },

  // Header
  header: { backgroundColor: "#1e3a8a", color: "#ffffff", paddingTop: 14, paddingBottom: 14, paddingHorizontal: 24 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  company: { fontSize: 16, fontWeight: 700, color: "#ffffff" },
  companySub: { fontSize: 8, color: "#bfdbfe", marginTop: 2 },
  title: { fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#ffffff" },
  titleSub: { fontSize: 9, color: "#bfdbfe", marginTop: 2, textAlign: "right" },

  // Body container
  body: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 14 },

  // Employee section
  empSection: { marginBottom: 10 },
  empHeader: { backgroundColor: "#f1f5f9", paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#1e3a8a", borderBottomStyle: "solid" },
  empHeaderText: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#1e3a8a", letterSpacing: 0.5 },
  empTable: { flexDirection: "row", flexWrap: "wrap", borderWidth: 0.5, borderColor: "#cbd5e1", borderStyle: "solid", borderTopWidth: 0 },
  empCell: { width: "25%", padding: 5, borderRightWidth: 0.5, borderRightColor: "#e2e8f0", borderRightStyle: "solid", borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", borderBottomStyle: "solid" },
  empCellLast: { borderRightWidth: 0 },
  empLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 },
  empValue: { fontSize: 9, color: "#111827", fontWeight: 700 },

  // Attendance row
  attRow: { flexDirection: "row", marginTop: 8, marginBottom: 10, gap: 4 },
  attCell: { flex: 1, padding: 6, borderWidth: 0.5, borderColor: "#cbd5e1", borderStyle: "solid", backgroundColor: "#f8fafc" },
  attLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 },
  attValue: { fontSize: 14, fontWeight: 700, color: "#1e3a8a", marginTop: 2 },

  // Section header
  sectionHeader: { paddingVertical: 4, paddingHorizontal: 8, marginBottom: 0, borderWidth: 0.5, borderColor: "#1e3a8a", borderStyle: "solid" },
  sectionHeaderText: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#ffffff", letterSpacing: 0.5 },
  sectionHeaderEarnings: { backgroundColor: "#15803d" },
  sectionHeaderDeductions: { backgroundColor: "#b91c1c" },

  // Tables
  table: { borderWidth: 0.5, borderColor: "#1e3a8a", borderStyle: "solid", borderTopWidth: 0 },
  tableCol: { flex: 1 },
  tableColLeft: { flex: 1, marginRight: 4 },
  tableColRight: { flex: 1, marginLeft: 4 },

  tr: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", borderBottomStyle: "solid" },
  trAlt: { backgroundColor: "#f9fafb" },
  trHead: { backgroundColor: "#e5e7eb", paddingVertical: 5 },
  thText: { fontSize: 8, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 },
  tdText: { fontSize: 9, color: "#111827" },
  tdAmount: { fontSize: 9, color: "#111827", textAlign: "right" },
  trTotal: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, backgroundColor: "#fef3c7", borderTopWidth: 1, borderTopColor: "#92400e", borderTopStyle: "solid" },
  tdTotal: { fontSize: 10, fontWeight: 700, color: "#78350f" },
  tdTotalAmt: { fontSize: 10, fontWeight: 700, color: "#78350f", textAlign: "right" },

  // Net pay
  netBar: { flexDirection: "row", marginTop: 10, borderWidth: 1, borderColor: "#1e3a8a", borderStyle: "solid" },
  netLabelBox: { flex: 1, backgroundColor: "#1e3a8a", color: "#ffffff", padding: 8, justifyContent: "center" },
  netLabel: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#ffffff" },
  netWords: { fontSize: 8, color: "#bfdbfe", marginTop: 2, fontStyle: "italic" },
  netValueBox: { width: 180, padding: 8, justifyContent: "center", alignItems: "flex-end" },
  netValue: { fontSize: 18, fontWeight: 700, color: "#1e3a8a" },

  // Bottom grid
  bottomGrid: { flexDirection: "row", marginTop: 14, gap: 12 },
  bottomCol: { flex: 1 },
  bottomHeader: { backgroundColor: "#374151", paddingVertical: 4, paddingHorizontal: 8, marginBottom: 0 },
  bottomHeaderText: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#ffffff", letterSpacing: 0.5 },
  bottomTable: { borderWidth: 0.5, borderColor: "#374151", borderStyle: "solid", borderTopWidth: 0 },
  bottomTr: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", borderBottomStyle: "solid" },
  bottomTrLast: { borderBottomWidth: 0 },
  bottomKey: { flex: 1, fontSize: 8, color: "#6b7280" },
  bottomVal: { flex: 1, fontSize: 8, color: "#111827", textAlign: "right", fontWeight: 700 },

  // Footer
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingVertical: 8, paddingHorizontal: 24, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#1e3a8a", borderTopStyle: "solid" },
  footerText: { fontSize: 7.5, color: "#6b7280", fontStyle: "italic" },
  footerRight: { fontSize: 7.5, color: "#6b7280" },

  // Signature
  sigRow: { flexDirection: "row", marginTop: 22, paddingHorizontal: 24, gap: 24 },
  sigBox: { flex: 1, alignItems: "center" },
  sigLine: { width: "100%", borderTopWidth: 1, borderTopColor: "#111827", borderTopStyle: "solid", paddingTop: 4 },
  sigLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
});

function inr(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function chunk(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + chunk(n % 100) : "");
  }
  let result = "";
  let n = num;
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  const rest = n;
  if (crore) result += chunk(crore) + " Crore ";
  if (lakh) result += chunk(lakh) + " Lakh ";
  if (thousand) result += chunk(thousand) + " Thousand ";
  if (rest) result += chunk(rest);
  return result.trim() + " Rupees Only";
}

function PayslipDoc({
  company,
  payRun,
  slip,
}: {
  company: Company;
  payRun: { year: number; month: number; status: string };
  slip: PaySlipForPdf;
}) {
  const earnings = (slip.earningsJson as Array<{ name: string; amountPaise: number }>) ?? [];
  const deductions = (slip.deductionsJson as Array<{ name: string; amountPaise: number }>) ?? [];
  const stat = (slip.statutoryJson as {
    pfEmployeePaise: number;
    pfEmployerPaise: number;
    esiEmployeePaise: number;
    esiEmployerPaise: number;
    ptPaise: number;
    tdsPaise: number;
  } | null) ?? null;

  const fullName = `${slip.employee.firstName ?? ""} ${slip.employee.lastName ?? ""}`.trim();
  const companyAddr = [company.address, company.city, company.state, company.pincode]
    .filter(Boolean)
    .join(", ");
  const monthName = getMonthName(payRun.month);
  const lastDay = new Date(payRun.year, payRun.month, 0).getDate();
  const netRupees = paiseToRupees(slip.netPaise);

  return createElement(
    Document as unknown as import("react").ElementType,
    null,
    createElement(
      Page as unknown as import("react").ElementType,
      { size: "A4", style: s.page },
      // ===== HEADER =====
      createElement(
        View,
        { style: s.header },
        createElement(
          View,
          { style: s.headerRow },
          createElement(
            View,
            null,
            createElement(Text, { style: s.company }, company.name),
            companyAddr
              ? createElement(Text, { style: s.companySub }, companyAddr)
              : null,
            company.pan
              ? createElement(Text, { style: s.companySub }, `PAN: ${company.pan}  ·  TAN: ${company.tan ?? "—"}`)
              : null
          ),
          createElement(
            View,
            null,
            createElement(Text, { style: s.title }, "Payslip"),
            createElement(Text, { style: s.titleSub }, monthName + " " + payRun.year)
          )
        )
      ),

      createElement(
        View,
        { style: s.body },
        // ===== EMPLOYEE DETAILS =====
        createElement(
          View,
          { style: s.empSection },
          createElement(
            View,
            { style: s.empHeader },
            createElement(Text, { style: s.empHeaderText }, "Employee Details")
          ),
          createElement(
            View,
            { style: s.empTable },
            empCell("Employee Name", fullName || "—"),
            empCell("Employee ID", slip.employee.employeeCode),
            empCell("Designation", slip.employee.designation ?? "—"),
            empCell("Department", slip.employee.department ?? "—"),
            empCell("Email", slip.employee.email),
            empCell("PAN", slip.employee.pan ?? "—"),
            empCell("UAN / PF No.", slip.employee.uan ?? "—"),
            empCell("Pay Date", `${monthName} ${lastDay}, ${payRun.year}`),
            empCell("Bank Name", slip.employee.bankName ?? "—"),
            empCell("Account No.", slip.employee.bankAccountNo ?? "—"),
            empCell("IFSC", slip.employee.bankIfsc ?? "—")
          )
        ),

        // ===== ATTENDANCE =====
        createElement(
          View,
          { style: s.attRow },
          attCell("Paid Days", String(slip.paidDays)),
          attCell("LOP Days", String(slip.lopDays)),
          attCell("Days Present", String(slip.daysPresent)),
          attCell("Days Absent", String(slip.daysAbsent))
        ),

        // ===== EARNINGS & DEDUCTIONS =====
        createElement(
          View,
          { style: { flexDirection: "row", gap: 8 } },
          // Earnings
          createElement(
            View,
            { style: s.tableColLeft },
            createElement(
              View,
              { style: { ...s.sectionHeader, ...s.sectionHeaderEarnings } },
              createElement(Text, { style: s.sectionHeaderText }, "Earnings")
            ),
            createElement(
              View,
              { style: s.table },
              createElement(
                View,
                { style: s.trHead },
                createElement(Text, { style: { ...s.thText, flex: 1 } }, "Component"),
                createElement(Text, { style: { ...s.thText, width: 80, textAlign: "right" } }, "Amount (₹)")
              ),
              ...earnings.map((e, i) =>
                createElement(
                  View,
                  { key: e.name, style: i % 2 === 1 ? { ...s.tr, ...s.trAlt } : s.tr },
                  createElement(Text, { style: { ...s.tdText, flex: 1 } }, e.name),
                  createElement(Text, { style: { ...s.tdAmount, width: 80 } }, inr(paiseToRupees(e.amountPaise)))
                )
              ),
              createElement(
                View,
                { style: s.trTotal },
                createElement(Text, { style: { ...s.tdTotal, flex: 1 } }, "Gross Earnings (A)"),
                createElement(Text, { style: { ...s.tdTotalAmt, width: 80 } }, inr(paiseToRupees(slip.grossPaise)))
              )
            )
          ),
          // Deductions
          createElement(
            View,
            { style: s.tableColRight },
            createElement(
              View,
              { style: { ...s.sectionHeader, ...s.sectionHeaderDeductions } },
              createElement(Text, { style: s.sectionHeaderText }, "Deductions")
            ),
            createElement(
              View,
              { style: s.table },
              createElement(
                View,
                { style: s.trHead },
                createElement(Text, { style: { ...s.thText, flex: 1 } }, "Component"),
                createElement(Text, { style: { ...s.thText, width: 80, textAlign: "right" } }, "Amount (₹)")
              ),
              ...(deductions.length === 0
                ? [createElement(
                    View,
                    { style: s.tr },
                    createElement(Text, { style: { ...s.tdText, flex: 1, color: "#9ca3af", fontStyle: "italic" } }, "— No deductions —")
                  )]
                : deductions.map((d, i) =>
                    createElement(
                      View,
                      { key: d.name, style: i % 2 === 1 ? { ...s.tr, ...s.trAlt } : s.tr },
                      createElement(Text, { style: { ...s.tdText, flex: 1 } }, d.name),
                      createElement(Text, { style: { ...s.tdAmount, width: 80 } }, inr(paiseToRupees(d.amountPaise)))
                    )
                  )),
              createElement(
                View,
                { style: s.trTotal },
                createElement(Text, { style: { ...s.tdTotal, flex: 1 } }, "Total Deductions (B)"),
                createElement(Text, { style: { ...s.tdTotalAmt, width: 80 } }, inr(paiseToRupees(slip.totalDeductionsPaise)))
              )
            )
          )
        ),

        // ===== NET PAY =====
        createElement(
          View,
          { style: s.netBar },
          createElement(
            View,
            { style: s.netLabelBox },
            createElement(Text, { style: s.netLabel }, "Net Pay (A − B)"),
            createElement(Text, { style: s.netWords }, numberToWords(Math.round(netRupees)))
          ),
          createElement(
            View,
            { style: s.netValueBox },
            createElement(Text, { style: s.netValue }, `₹ ${inr(netRupees)}`)
          )
        ),

        // ===== BOTTOM: STATUTORY + BANK =====
        createElement(
          View,
          { style: s.bottomGrid },
          stat
            ? createElement(
                View,
                { style: s.bottomCol },
                createElement(
                  View,
                  { style: s.bottomHeader },
                  createElement(Text, { style: s.bottomHeaderText }, "Statutory Contributions (Employee)")
                ),
                createElement(
                  View,
                  { style: s.bottomTable },
                  bottomRow("PF (Provident Fund)", inr(paiseToRupees(stat.pfEmployeePaise)), false),
                  bottomRow("ESI (State Insurance)", inr(paiseToRupees(stat.esiEmployeePaise)), false),
                  bottomRow("PT (Professional Tax)", inr(paiseToRupees(stat.ptPaise)), false),
                  bottomRow("TDS (Income Tax)", inr(paiseToRupees(stat.tdsPaise)), true)
                )
              )
            : null,
          createElement(
            View,
            { style: s.bottomCol },
            createElement(
              View,
              { style: s.bottomHeader },
              createElement(Text, { style: s.bottomHeaderText }, "Bank Details")
            ),
            createElement(
              View,
              { style: s.bottomTable },
              bottomRow("Bank Name", slip.employee.bankName ?? "—", false),
              bottomRow("Account Number", slip.employee.bankAccountNo ?? "—", false),
              bottomRow("IFSC Code", slip.employee.bankIfsc ?? "—", false),
              bottomRow("Payment Mode", "Bank Transfer", true)
            )
          )
        )
      ),

      // ===== FOOTER =====
      createElement(
        View,
        { style: s.footer, fixed: true },
        createElement(
          Text,
          { style: s.footerText },
          "This is a system-generated payslip and does not require a physical signature."
        ),
        createElement(
          Text,
          { style: s.footerRight },
          `Generated on ${new Date().toLocaleDateString("en-IN")}  ·  Slip #${slip.id.slice(-8).toUpperCase()}`
        )
      )
    )
  );
}

function empCell(label: string, value: string) {
  return createElement(
    View,
    { style: s.empCell },
    createElement(Text, { style: s.empLabel }, label),
    createElement(Text, { style: s.empValue }, value)
  );
}

function attCell(label: string, value: string) {
  return createElement(
    View,
    { style: s.attCell },
    createElement(Text, { style: s.attLabel }, label),
    createElement(Text, { style: s.attValue }, value)
  );
}

function bottomRow(key: string, val: string, last: boolean) {
  return createElement(
    View,
    { style: last ? { ...s.bottomTr, ...s.bottomTrLast } : s.bottomTr },
    createElement(Text, { style: s.bottomKey }, key),
    createElement(Text, { style: s.bottomVal }, val)
  );
}

export async function generatePayslipPdf(slipId: string): Promise<Buffer> {
  const slip = await prisma.paySlip.findUnique({
    where: { id: slipId },
    include: {
      employee: true,
      payRun: { include: { company: true } },
    },
  });
  if (!slip) throw new Error("Payslip not found");
  if (!slip.payRun.company) throw new Error("Company not found");

  const doc = PayslipDoc({
    company: slip.payRun.company,
    payRun: slip.payRun,
    slip: {
      ...slip,
      earningsJson: slip.earningsJson,
      deductionsJson: slip.deductionsJson,
      statutoryJson: slip.statutoryJson,
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(doc as any);
}
