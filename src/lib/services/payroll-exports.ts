export function generateBankCSV(
  paySlips: Array<{
    employee: { firstName: string; lastName: string; bankAccountNo: string | null; bankIfsc: string | null };
    netPaise: number;
  }>
): string {
  const header = "Beneficiary Name,Account Number,IFSC,Amount (INR),Narration";
  const rows = paySlips
    .filter((p) => p.employee.bankAccountNo)
    .map((p) => {
      const name = `${p.employee.firstName} ${p.employee.lastName}`;
      const amount = (p.netPaise / 100).toFixed(2);
      return `"${name}",${p.employee.bankAccountNo},${p.employee.bankIfsc || ""},${amount},Salary`;
    });
  return [header, ...rows].join("\n");
}

export function generatePFChallan(
  paySlips: Array<{
    employee: { firstName: string; lastName: string; uan: string | null };
    statutoryJson: unknown;
    grossPaise: number;
  }>
): string {
  const header = "UAN,Employee Name,Employee PF,Employer PF,Total PF,Wages";
  const rows = paySlips.map((p) => {
    const stat = p.statutoryJson as { pfEmployeePaise?: number; pfEmployerPaise?: number } | null;
    const empPF = ((stat?.pfEmployeePaise ?? 0) / 100).toFixed(2);
    const erPF = ((stat?.pfEmployerPaise ?? 0) / 100).toFixed(2);
    const total = ((stat?.pfEmployeePaise ?? 0) + (stat?.pfEmployerPaise ?? 0)) / 100;
    const wages = (p.grossPaise / 100).toFixed(2);
    return `${p.employee.uan || ""},"${p.employee.firstName} ${p.employee.lastName}",${empPF},${erPF},${total.toFixed(2)},${wages}`;
  });
  return [header, ...rows].join("\n");
}
