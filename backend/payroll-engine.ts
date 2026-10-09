import type { Employee, SalaryComponent, StatutoryConfig, TaxRegime } from "@prisma/client";
import { applyPercent } from "@/lib/money";

export type PayrollLineItem = { name: string; amountPaise: number };

export type StatutoryBreakdown = {
  pfEmployeePaise: number;
  pfEmployerPaise: number;
  esiEmployeePaise: number;
  esiEmployerPaise: number;
  ptPaise: number;
  tdsPaise: number;
};

export type PayrollResult = {
  earnings: PayrollLineItem[];
  deductions: PayrollLineItem[];
  grossPaise: number;
  totalDeductionsPaise: number;
  netPaise: number;
  statutory: StatutoryBreakdown;
  daysPresent: number;
  daysAbsent: number;
  lopDays: number;
  paidDays: number;
};

type PTSlab = { fromPaise: number; toPaise: number; amountPaise: number };
type TDSSlab = { fromPaise: number; toPaise: number; rate: number };

const DEFAULT_PT_SLABS: PTSlab[] = [
  { fromPaise: 0, toPaise: 750000, amountPaise: 0 },
  { fromPaise: 750001, toPaise: 1000000, amountPaise: 17500 },
  { fromPaise: 1000001, toPaise: 1250000, amountPaise: 20000 },
  { fromPaise: 1250001, toPaise: Infinity, amountPaise: 25000 },
];

const DEFAULT_TDS_SLABS_NEW: TDSSlab[] = [
  { fromPaise: 0, toPaise: 30000000, rate: 0 },
  { fromPaise: 30000000, toPaise: 60000000, rate: 5 },
  { fromPaise: 60000000, toPaise: 90000000, rate: 10 },
  { fromPaise: 90000000, toPaise: 120000000, rate: 15 },
  { fromPaise: 120000000, toPaise: 150000000, rate: 20 },
  { fromPaise: 150000000, toPaise: Infinity, rate: 30 },
];

const DEFAULT_TDS_SLABS_OLD: TDSSlab[] = [
  { fromPaise: 0, toPaise: 25000000, rate: 0 },
  { fromPaise: 25000000, toPaise: 50000000, rate: 5 },
  { fromPaise: 50000000, toPaise: 100000000, rate: 20 },
  { fromPaise: 100000000, toPaise: Infinity, rate: 30 },
];

export function getBasicPaise(components: SalaryComponent[]): number {
  const basic = components.find(
    (c) => c.isActive && c.type === "EARNING" && c.name.toLowerCase().includes("basic")
  );
  return basic?.amountPaise ?? 0;
}

export function getGrossPaise(components: SalaryComponent[]): number {
  return components
    .filter((c) => c.isActive && c.type === "EARNING")
    .reduce((sum, c) => sum + c.amountPaise, 0);
}

export function applyProRata(amountPaise: number, paidDays: number, totalDays: number): number {
  if (totalDays === 0) return 0;
  return Math.round((amountPaise * paidDays) / totalDays);
}

export function computePF(
  basicPaise: number,
  config: StatutoryConfig,
  employeeType: string
): { employee: number; employer: number } {
  if (employeeType === "PROBATION") return { employee: 0, employer: 0 };
  const pfWage = Math.min(basicPaise, config.pfWageCeilingPaise);
  return {
    employee: applyPercent(pfWage, config.pfEmployeeRate),
    employer: applyPercent(pfWage, config.pfEmployerRate),
  };
}

export function computeESI(
  grossPaise: number,
  config: StatutoryConfig
): { employee: number; employer: number } {
  if (grossPaise > config.esiWageThresholdPaise) {
    return { employee: 0, employer: 0 };
  }
  return {
    employee: applyPercent(grossPaise, config.esiEmployeeRate),
    employer: applyPercent(grossPaise, config.esiEmployerRate),
  };
}

export function computePT(grossPaise: number, slabsJson: unknown): number {
  const slabs: PTSlab[] = Array.isArray(slabsJson) && slabsJson.length > 0
    ? (slabsJson as PTSlab[])
    : DEFAULT_PT_SLABS;

  for (const slab of slabs) {
    if (grossPaise >= slab.fromPaise && grossPaise <= slab.toPaise) {
      return slab.amountPaise;
    }
  }
  return 0;
}

export function computeTDS(
  annualGrossPaise: number,
  regime: TaxRegime,
  config: StatutoryConfig
): number {
  const stdDeduction =
    regime === "OLD"
      ? config.oldRegimeStdDeductionPaise
      : config.newRegimeStdDeductionPaise;

  const taxable = Math.max(0, annualGrossPaise - stdDeduction);
  const slabs: TDSSlab[] =
    regime === "OLD"
      ? (Array.isArray(config.tdsSlabsOldJson) && (config.tdsSlabsOldJson as TDSSlab[]).length > 0
          ? (config.tdsSlabsOldJson as TDSSlab[])
          : DEFAULT_TDS_SLABS_OLD)
      : (Array.isArray(config.tdsSlabsNewJson) && (config.tdsSlabsNewJson as TDSSlab[]).length > 0
          ? (config.tdsSlabsNewJson as TDSSlab[])
          : DEFAULT_TDS_SLABS_NEW);

  let tax = 0;
  for (const slab of slabs) {
    if (taxable <= slab.fromPaise) break;
    const taxableInSlab = Math.min(taxable, slab.toPaise) - slab.fromPaise;
    if (taxableInSlab > 0) {
      tax += applyPercent(taxableInSlab, slab.rate);
    }
  }

  return Math.round(tax / 12);
}

export function computePayroll(params: {
  employee: Employee;
  components: SalaryComponent[];
  config: StatutoryConfig;
  paidDays: number;
  totalDays: number;
  lopDays: number;
  daysPresent: number;
  daysAbsent: number;
}): PayrollResult {
  const { employee, components, config, paidDays, totalDays, lopDays, daysPresent, daysAbsent } =
    params;

  const earnings: PayrollLineItem[] = components
    .filter((c) => c.isActive && c.type === "EARNING")
    .map((c) => ({
      name: c.name,
      amountPaise: applyProRata(c.amountPaise, paidDays, totalDays),
    }));

  const grossPaise = earnings.reduce((s, e) => s + e.amountPaise, 0);
  const basicPaise = earnings.find((e) => e.name.toLowerCase().includes("basic"))?.amountPaise ?? 0;

  const pf = computePF(basicPaise, config, employee.employeeType);
  const esi = computeESI(grossPaise, config);
  const pt = computePT(grossPaise, config.ptSlabsJson);
  const annualGross = grossPaise * 12;
  const tds = computeTDS(annualGross, employee.taxRegime, config);

  const deductions: PayrollLineItem[] = [];
  if (pf.employee > 0) deductions.push({ name: "PF (Employee)", amountPaise: pf.employee });
  if (esi.employee > 0) deductions.push({ name: "ESI (Employee)", amountPaise: esi.employee });
  if (pt > 0) deductions.push({ name: "Professional Tax", amountPaise: pt });
  if (tds > 0) deductions.push({ name: "TDS", amountPaise: tds });

  const customDeductions = components
    .filter((c) => c.isActive && c.type === "DEDUCTION")
    .map((c) => ({
      name: c.name,
      amountPaise: applyProRata(c.amountPaise, paidDays, totalDays),
    }));
  deductions.push(...customDeductions);

  const totalDeductionsPaise = deductions.reduce((s, d) => s + d.amountPaise, 0);

  return {
    earnings,
    deductions,
    grossPaise,
    totalDeductionsPaise,
    netPaise: grossPaise - totalDeductionsPaise,
    statutory: {
      pfEmployeePaise: pf.employee,
      pfEmployerPaise: pf.employer,
      esiEmployeePaise: esi.employee,
      esiEmployerPaise: esi.employer,
      ptPaise: pt,
      tdsPaise: tds,
    },
    daysPresent,
    daysAbsent,
    lopDays,
    paidDays,
  };
}
