# HRMS Suite — Employee, Payroll, Leave & Project Management

A single-company web application for **employee records**, **attendance**, **leave management**, and **Indian payroll** with statutory deductions (PF, ESI, PT, TDS).

Alongside the HR core it ships a complete **project management** module (projects, milestones, tasks, teams, and reports), plus an org chart, announcements, and document storage.

Built as a Next.js 16 full-stack app on PostgreSQL.

📘 **[Architecture →](docs/architecture.md)** · 🔒 **[Security →](docs/security.md)**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.3 (App Router, RSC, Server Actions, Edge Middleware) |
| **Language** | TypeScript 5.x — pinned `^5` (TS 7 breaks the bundled `typescript-eslint`) |
| **UI** | React 19.3, Tailwind CSS v4, Radix UI primitives, shadcn/ui-style `src/components/ui/` |
| **Icons / Charts** | lucide-react 1.x |
| **Theme** | next-themes (light/dark, toggle in the sidebar user menu) |
| **Toasts** | sonner |
| **Forms / Validation** | react-hook-form + zod 4 + `@hookform/resolvers` |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma 7 via `@prisma/adapter-pg` — connection URL lives in `prisma.config.ts`, not `schema.prisma` |
| **Auth** | NextAuth v5 (Credentials), bcryptjs, custom RBAC (`ADMIN` / `MANAGER` / `EMPLOYEE`) |
| **Email** | Resend (transactional, queued + logged) |
| **File storage** | Vercel Blob (prod) with local disk fallback (dev) |
| **PDF** | `@react-pdf/renderer` (payslips, project reports) |
| **Lint / Test** | ESLint 9 (`eslint-config-next`), Vitest 3 |

---

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Configure environment

```bash
cp .env.example .env
```

The defaults in `.env.example` match `docker-compose.yml`, so no edits are needed for local dev. Required for a real deployment: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `RESEND_API_KEY`, and `BLOB_READ_WRITE_TOKEN` (or `UPLOAD_DIR`).

### 3. Install, migrate & seed

```bash
npm install
npm run db:migrate     # applies migrations
npm run db:seed        # demo data: 1 company, admin + manager logins, 15 employees, payroll history
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Role     | Email              | Password      |
|----------|--------------------|---------------|
| Admin    | `admin@demo.com`   | `admin123`    |
| Manager  | `manager@demo.com` | `manager123`  |
| Employee | `rahul@demo.com`   | `employee123` |

All other seeded employees (`priya@`, `amit@`, `sneha@`, …) also use `employee123`. The manager account is scoped to their own direct reports.

---

## Features

### Workforce
- Employee CRUD with bank, PAN/UAN and other statutory fields
- Salary component management per employee
- Manager hierarchy + org chart (card, tree, and directory views)
- Self-service profile view/edit and password change

### Attendance
- Employee punch in/out with status and worked minutes
- Admin attendance table with month + status filters
- Month-end closing: LOP derivation from absences, weekends, and holidays

### Leave
- Leave policies per employee type with carryover rules
- Yearly balance initialization
- Employee self-service requests; admin/manager approve–reject workflow
- Company holiday calendar

### Payroll
- Monthly gross from salary components (pro-rata by paid days)
- **PF** (12%, wage-ceiling capped, skipped during probation)
- **ESI** (threshold-based), **PT** (state-wise slabs), **TDS** (old/new regime)
- Pay-run state machine: `DRAFT → REVIEWING → LOCKED → FINALIZED`, plus cancel/delete
- Bank payment CSV and PF challan (SFMS) export
- Printable pay-run summary and per-employee payslip PDFs
- **Rates are data, not code** — all statutory config lives in `StatutoryConfig`

### Project Management
A full project module built on its own set of Prisma models and server actions.

**Projects**
- Create, edit, and delete projects with name, description, location, start/end dates, and budget
- **Status**: `PLANNING` → `IN_PROGRESS` → `ON_HOLD` / `COMPLETED` / `CANCELLED`
- **Priority**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- Budget stored in **paise** (`budgetPaise`) and formatted with `lib/money.ts`
- Assign a project manager from the employee list
- Card grid with per-project task, milestone, and team-member counts
- Filter by status from the URL (`?status=IN_PROGRESS`), so filters are shareable and survive a refresh
- Overview summary with charts and a budget indicator

**Project detail** — a tabbed workspace (`overview` / `milestones` / `tasks` / `team` / `reports`):

- **Milestones** — name, description, due date, and an editable **progress percentage**. Statuses: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `DELAYED`. Each milestone reports its task count and completion timestamp.
- **Tasks** — title, description, assignee, due date, and **estimated vs. actual hours**. Statuses: `TODO`, `IN_PROGRESS`, `REVIEW`, `COMPLETED`, `BLOCKED`. Priorities: `LOW`, `MEDIUM`, `HIGH`, `URGENT`. Tasks can be linked to a milestone.
- **Team** — add and remove members from any employee, with a per-project role.
- **Reports** — structured report entries with a title, date, and author, typed as `PROGRESS`, `INCIDENT`, `FINANCIAL`, or `SAFETY`. Viewable in a preview dialog and exportable as PDF via `/api/projects/[id]/report-pdf`.

Deleting a project cascades to its milestones, tasks, team members, and reports. Server actions live in `src/lib/actions/projects.ts`; shared shapes live in `src/lib/types/projects.ts`.

### Platform
- Dashboard with metrics and charts
- Reports dashboards with CSV/PDF export
- Announcements
- Email delivery log with failure retry
- In-app notifications with fanout
- **Server-side pagination** on the growable lists — attendance, payroll payslips, leave requests, documents, audit log, email logs, and employees — via a shared helper in `src/lib/services/pagination.ts`
- Compact INR formatting for aggregate cards; exact formatting preserved per person, per document, and in CSV/PDF/print output
- Append-only audit log of every mutation
- Docker Compose for local Postgres, Vercel + Procfile for deployment

---

## Architecture

Seven layers, requests flow top-to-bottom:

```
 ┌────────────────────────────────────────────────────┐
 │  1. Edge Proxy               (src/proxy.ts)         │
 │  2. Presentation / Routes    (src/app/)             │
 │  3. Components               (src/components/)      │
 │  4. Server Actions (data)    (src/lib/actions/)     │
 │  5. Domain Services          (src/lib/services/)    │
 │  6. Core Library             (src/lib/*.ts, auth.ts)│
 │  7. Data Layer               (prisma/schema.prisma)│
 └────────────────────────────────────────────────────┘
```

- **Server Actions are called in-process** by Server Components — there is no HTTP hop between the page and its data access.
- **RBAC is enforced at the action boundary** (`requireAuth` / `requireAdmin`), so bypassing the UI still cannot mutate unauthorized data.
- **The edge proxy only checks for the presence of a session cookie** — it never decodes the JWT, keeping the edge function tiny.

Full details, including request lifecycles and the payroll money flow, are in **[docs/architecture.md](docs/architecture.md)**.

---

## Project Structure

```
SKWebApp-GitRepo/
├── docker-compose.yml            # PostgreSQL 16 (local dev)
├── vercel.json                   # Build config, cache headers, function limits
├── Procfile                      # web: npm start (PaaS / self-hosted)
├── prisma.config.ts              # Prisma 7 CLI config: DB URL, schema, seed script
├── next.config.ts                # Image domains, security headers, optimizePackageImports
├── eslint.config.mjs             # ESLint 9 flat config
├── vitest.config.ts              # Vitest (node env, @/ alias)
│
├── prisma/
│   ├── schema.prisma             # Data model (source of truth)
│   ├── seed.ts                   # Demo data seeder
│   └── clean-db.ts               # Dev DB reset
│
├── docs/
│   ├── architecture.md           # Layering, data flow, design decisions
│   └── security.md               # Security configuration guide
│
└── src/
    ├── proxy.ts                  # Edge proxy (HTTPS redirect, auth guard)
    ├── auth.ts                   # NextAuth configuration
    │
    ├── app/
    │   ├── layout.tsx            # Root layout (fonts, providers, toaster)
    │   ├── login/ privacy/ terms/ support/   # Public routes
    │   ├── (screens)/            # Authenticated route group → AppShell
    │   │   ├── dashboard/  employees/  org-chart/
    │   │   ├── attendance/  my-attendance/
    │   │   ├── leave/  my-leave/  holidays/
    │   │   ├── payroll/  my-payslips/
    │   │   ├── projects/  reports/  announcements/
    │   │   ├── my-documents/  email-logs/  audit/  notifications/
    │   │   └── profile/  settings/  change-password/
    │   └── api/                  # Route handlers
    │       ├── auth/[...nextauth]/         # NextAuth
    │       ├── employees/                  # Paginated employee list API
    │       ├── documents/upload/ + [documentId]/
    │       ├── payslips/[slipId]/pdf/ + preview/
    │       └── projects/[id]/report-pdf/    # Project report PDF
    │
    ├── components/
    │   ├── ui/                   # Radix + Tailwind primitives
    │   ├── layout/               # app-shell, sidebar (nav + theme toggle), footer
    │   ├── dashboard/  documents/  payslip/
    │   └── auth-provider, theme-provider, page-loading-bar
    │
    └── lib/
        ├── actions/              # Server Actions (RBAC-guarded, "use server")
        ├── services/             # payroll-engine, pagination, audit, employees,
        │                         #   email, payroll-exports, PDF renderers
        ├── hooks/                # use-toast
        ├── types/                # Shared domain types
        ├── prisma.ts             # Prisma 7 client singleton (PrismaPg adapter)
        ├── rbac.ts  audit.ts  money.ts  storage.ts  utils.ts
        └── rate-limit.ts         # See note in docs/security.md
```

---

## Scripts

| Command                 | Description                              |
|-------------------------|------------------------------------------|
| `npm run dev`           | Start dev server (localhost:3000)        |
| `npm run build`         | Generate Prisma client + production build |
| `npm start`             | Run production server                    |
| `npm run lint`          | Run ESLint                               |
| `npm test`              | Run unit tests once                      |
| `npm run test:watch`    | Run tests in watch mode                  |
| `npm run db:generate`   | Generate Prisma client                   |
| `npm run db:migrate`    | Create + apply a migration               |
| `npm run db:push`       | Push schema directly (dev, no migration) |
| `npm run db:seed`       | Seed demo data                           |
| `npm run db:clean`      | Reset / truncate the database            |
| `npm run db:studio`     | Open Prisma Studio                       |

---

## Key Design Decisions

- **Integer paise storage** — all currency is stored as integer paise; `lib/money.ts` owns conversion and INR formatting. Compact formatting (`₹39.49 L`) is applied only to aggregate cards, never to per-person amounts or exported files.
- **App Router + Server Actions** — collapses the API surface and co-locates data fetching with the UI.
- **RBAC in every action** — server-side guards hold even if the UI is bypassed.
- **Immutable payslip snapshots** — finalized payslips store JSON snapshots of earnings, deductions, and statutory data, so later schema or config changes cannot rewrite history.
- **Configurable statutory rates** — PF/ESI/PT/TDS come from `StatutoryConfig`, never hard-coded.
- **Pay-run state machine** — an explicit `VALID_TRANSITIONS` table in `lib/actions/payroll.ts` guards the workflow.
- **Append-only audit log** — before/after JSON on every mutation; a logging failure is reported to stderr rather than silently swallowed.
- **Server-side pagination** — lists page in SQL via `resolvePaging` / `buildPageMeta` / `settlePage` (`lib/services/pagination.ts`) rather than slicing a fully-loaded array in the browser.
- **Prisma 7 driver adapter** — `PrismaPg` manages the connection pool; the client is reused on `globalThis` to survive dev hot-reload.
- **Edge proxy auth check** — cookie-presence only, no JWT decode.
- **Blob storage with disk fallback** — one codebase works in both prod and dev.

### Project data model

```
Project
 ├── Milestone            (status, due date, progress %, task count)
 │    └── ProjectTask     (status, priority, assignee, est. vs. actual hours)
 ├── ProjectTask          (optional milestoneId → Milestone)
 ├── ProjectTeamMember    (employee + per-project role)
 └── ProjectReport        (title, type, content, report date, author)
```

All four child relations use `onDelete: Cascade`, so deleting a project removes its milestones, tasks, team members, and reports in one operation. Budget is stored as `budgetPaise` (integer paise), consistent with the rest of the money model. Domain enums: `ProjectStatus`, `ProjectPriority`, `MilestoneStatus`, `TaskStatus`, `TaskPriority`.

---

## Testing

Vitest 3, Node environment. Run with `npm test`; lint with `npm run lint`.

| Suite | Covers |
|-------|--------|
| `lib/services/__tests__/payroll-engine.test.ts` | PF capping, ESI thresholds, PT slabs, pro-rata, full payroll computation |
| `lib/services/__tests__/pagination.test.ts` | Defaults, clamping, string inputs, offsets, out-of-range page settling |
| `lib/services/__tests__/employees-query.test.ts` | Employee list filtering, sorting, and paging |
| `lib/__tests__/money.test.ts` | Paise↔rupee conversion, exact and compact INR formatting |

---

## Deployment

- **Vercel** (primary) — `vercel.json` configures the build and output directory.
- **Self-hosted / PaaS** — `Procfile` defines `web: npm start`.
- **Required env vars** — `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN` (or `UPLOAD_DIR`).

On Vercel the local-disk upload fallback is intentionally disabled: the runtime filesystem is ephemeral and read-only, so document uploads require `BLOB_READ_WRITE_TOKEN`. See [docs/security.md](docs/security.md) for the full hardening checklist.
