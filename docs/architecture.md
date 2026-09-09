# Architecture

See the main [README](../README.md) for setup instructions.

## Data Flow

```mermaid
flowchart TB
  subgraph UI[Next.js App Router]
    Dashboard
    Employees
    Attendance
    Leave
    Payroll
    Reports
    Settings
  end

  UI --> SA[Server Actions / Route Handlers]
  SA --> AUTH(NextAuth Session + Role Guard)
  SA --> SVC[Domain Services]
  SA --> AUDIT[Audit Logger]

  SVC --> PRISMA[(PostgreSQL / Prisma)]
  PRISMA --> EMP[Employee]
  PRISMA --> ATD[Attendance]
  PRISMA --> LV[Leave + Policy + Balance]
  PRISMA --> SAL[Salary Components]
  PRISMA --> PR[PayRun + PaySlip]
  PRISMA --> ST[Statutory Config]

  PR --> ENG[Payroll Engine]
  ATD --> ENG
  LV --> ENG
  SAL --> ENG
  ST --> ENG
  ENG --> PAYRUN[PayRun Creation]
  PAYRUN --> REVIEW[Review / Edit]
  REVIEW --> LOCK[Lock + Verify]
  LOCK --> FINALIZE[Finalize + Email]
  FINALIZE --> PAYSLIP[Payslip PDF]
  FINALIZE --> BANK[Bank CSV / SFMS]
  FINALIZE --> STAT[Statutory Reports]
  FINALIZE --> AUDIT

  ATTEND[Punch In/Out] --> ATD
  LEAVE_REQ[Leave Request] --> LV
  LV --> APPROVE[Approve / Reject]
  APPROVE --> AUDIT
```

## Pay Run State Machine

```
DRAFT → REVIEWING → LOCKED → FINALIZED
  ↓         ↓
CANCELLED  DRAFT (reopen)
```

## Money Handling

All monetary values are stored as **integer paise** (1 INR = 100 paise).
Rounding follows half-up to the nearest rupee at display time only.
