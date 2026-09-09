import { describe, it, expect } from "vitest";
import {
  computePF,
  computeESI,
  computePT,
  applyProRata,
  computePayroll,
} from "@/lib/services/payroll-engine";
import type { StatutoryConfig, Employee, SalaryComponent } from "@prisma/client";
import { rupeesToPaise } from "@/lib/money";

const mockConfig: StatutoryConfig = {
  id: "test",
  companyId: "test",
  pfEmployeeRate: 12,
  pfEmployerRate: 12,
  pfWageCeilingPaise: rupeesToPaise(15000),
  esiWageThresholdPaise: rupeesToPaise(21000),
  esiEmployeeRate: 0.75,
  esiEmployerRate: 3.25,
  ptSlabsJson: [],
  oldRegimeStdDeductionPaise: rupeesToPaise(50000),
  newRegimeStdDeductionPaise: rupeesToPaise(75000),
  tdsSlabsOldJson: [],
  tdsSlabsNewJson: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("payroll-engine", () => {
  it("computes PF at 12% capped at ceiling", () => {
    const pf = computePF(rupeesToPaise(20000), mockConfig, "REGULAR");
    expect(pf.employee).toBe(rupeesToPaise(1800)); // 12% of 15000
  });

  it("skips PF for probation employees", () => {
    const pf = computePF(rupeesToPaise(20000), mockConfig, "PROBATION");
    expect(pf.employee).toBe(0);
  });

  it("computes ESI below threshold", () => {
    const esi = computeESI(rupeesToPaise(18000), mockConfig);
    expect(esi.employee).toBe(Math.round(rupeesToPaise(18000) * 0.0075));
  });

  it("skips ESI above threshold", () => {
    const esi = computeESI(rupeesToPaise(25000), mockConfig);
    expect(esi.employee).toBe(0);
  });

  it("computes PT from slabs", () => {
    const pt = computePT(rupeesToPaise(8000), []);
    expect(pt).toBe(rupeesToPaise(175));
  });

  it("applies pro-rata correctly", () => {
    const result = applyProRata(rupeesToPaise(30000), 15, 30);
    expect(result).toBe(rupeesToPaise(15000));
  });

  it("computes full payroll for regular employee", () => {
    const employee = {
      employeeType: "REGULAR",
      taxRegime: "NEW",
    } as Employee;

    const components: SalaryComponent[] = [
      { id: "1", employeeId: "e1", name: "Basic", type: "EARNING", amountPaise: rupeesToPaise(25000), sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "2", employeeId: "e1", name: "HRA", type: "EARNING", amountPaise: rupeesToPaise(10000), sortOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ];

    const result = computePayroll({
      employee,
      components,
      config: mockConfig,
      paidDays: 30,
      totalDays: 30,
      lopDays: 0,
      daysPresent: 22,
      daysAbsent: 0,
    });

    expect(result.grossPaise).toBe(rupeesToPaise(35000));
    expect(result.netPaise).toBeLessThan(result.grossPaise);
    expect(result.statutory.pfEmployeePaise).toBeGreaterThan(0);
  });
});
