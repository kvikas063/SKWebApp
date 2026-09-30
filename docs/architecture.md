# Architecture — HRMS Suite

**HRMS Suite** is a single-company web application for employee records, attendance, leave management, and Indian payroll (PF, ESI, PT, TDS). It is a Next.js 16 full-stack application with a PostgreSQL database.

This document explains the **tech stack**, the **layered code structure**, the **data flow**, and the **request lifecycle**. For setup and credentials see the [README](../README.md). For security hardening see [security.md](./security.md).

---

## 1. Tech Stack

### Runtime & Framework
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Web framework** | Next.js 16.3 (App Router) | SSR, ISR, RSC, Server Actions, Middleware |
| **Language** | TypeScript 5.x (pinned `^5`) — TS 7 is incompatible with the bundled `typescript-eslint` in `eslint-config-next` |
| **Runtime** | Node.js | Server-side execution |
| **Deployment target** | Vercel (Node.js server, Edge Middleware) | Primary platform; also supports self-host (Procfile/`npm start`) |

### Database & ORM
| Technology | Purpose |
|-----------|---------|
| **PostgreSQL 16** | Primary relational database (via Docker Compose for local dev) |
| **Prisma 7** | ORM + schema-first data modeling + migration tooling |
| **`@prisma/adapter-pg`** | PostgreSQL driver adapter (`PrismaPg`) — required by Prisma 7's `PrismaClient({ adapter })` |
| **`prisma.config.ts`** | Prisma 7 CLI config: database URL, schema path, migration/seed script |

> **Prisma 7 migration**: The `datasource.url` property was removed from `schema.prisma`. Connection URLs now live in `prisma.config.ts`. The `PrismaClient` constructor no longer accepts `datasourceUrl`/`datasources` — it requires a driver adapter (`@prisma/adapter-pg` for Postgres) or `accelerateUrl`. The schema generator is `prisma-client-js` (client generated into `node_modules/@prisma/client`).

### Authentication & Authorization
| Technology | Purpose |
|-----------|---------|
| **NextAuth v5** (`next-auth`) | Authentication framework, Credentials provider |
| **bcryptjs** | Password hashing |
| **Custom RBAC** | `UserRole` enums (`ADMIN`, `MANAGER`, `EMPLOYEE`) enforced via `requireAuth` / `requireAdmin` guards |

### UI / Styling
| Technology | Purpose |
|-----------|---------|
| **React 19.3** (server + client components) | Component model |
| **Tailwind CSS v4** | Utility-first styling |
| **Radix UI primitives** (`@radix-ui/react-*`) | Unstyled, accessible building blocks |
| **shadcn/ui-style** `src/components/ui/` | Component library built on Radix + Tailwind |
| **lucide-react 1.x** | Icon library (tree-shaken via `optimizePackageImports`) — 72 icons used |
| **next-themes** | Light/dark theme switching |
| **sonner** | Toast notifications |
| **react-hook-form** + **zod 4** + **@hookform/resolvers** | Type-safe form handling & validation |

### Email & File Storage
| Technology | Purpose |
|-----------|---------|
| **Resend** | Transactional email delivery |
| **@vercel/blob** | Cloud object storage for uploaded documents (prod); local disk fallback |
| **bcryptjs** `passwordHash` | User password hashing |

### Build, Lint & Test
| Tool | Purpose |
|------|---------|
| **ESLint 9** (`eslint-config-next`) | Linting (flat config). Pinned to `^9` — ESLint 10 is incompatible with the bundled `eslint-plugin-react` (which only supports ESLint `^3..^9.7`) |
| **PostCSS** (`@tailwindcss/postcss`) | Tailwind processing |
| **Vitest 3** | Unit testing (payroll engine) |
| **tsx** | TypeScript execution for seed/migration scripts |

> **Toolchain pinning**: `typescript` is pinned to `^5` because `eslint-config-next@16.3.7`'s bundled `typescript-eslint` does not yet support TypeScript 7. The Next.js build itself compiles fine with TS 7; only the lint step is blocked.

### Infrastructure
| File | Purpose |
|------|---------|
| `docker-compose.yml` | PostgreSQL 16 container (local dev) |
| `vercel.json` | Build/output config, long-cache static headers, function duration limits |
| `Procfile` | `web: npm start` for self-hosted / PaaS deployments |
| `.env.example` | Environment variable template |

---

## 2. Layered Architecture

The codebase follows a **layered (onion) architecture** with clear separation of concerns. Requests flow through these layers top-to-bottom:

```
 ┌────────────────────────────────────────────────────┐
 │  1. Edge Middleware          (src/middleware.ts)    │
 │  2. Presentation / Routes    (src/app/)             │
 │  3. Components               (src/components/)      │
 │  4. Server Actions (data)    (src/lib/actions/)     │
 │  5. Domain Services          (src/lib/services/)    │
 │  6. Core Library             (src/lib/*.ts, auth.ts)│
 │  7. Data Layer               (prisma/schema.prisma)│
 └────────────────────────────────────────────────────┘
```

### Layer 1 — Edge Middleware (`src/middleware.ts`)
Runs on the **Vercel Edge Runtime** before every request. Responsibilities:
- **HTTPS enforcement**: redirects `http://` → `https://` (308) in production.
- **Public-path allowlist**: `/login`, `/api/auth`, `/privacy`, `/terms`, `/support` are accessible without a session.
- **Auth gating**: inspects the `authjs.session-token` cookie; redirects unauthenticated users to `/login?callbackUrl=...`; redirects authenticated users away from `/login`.
- **No JWT decoding** in the middleware (keeps it lightweight and avoids needing `AUTH_SECRET` at the edge).

### Layer 2 — Presentation & Routing (`src/app/`)
Built on the **Next.js App Router**. Server Components render pages by default; client components are opt-in via `"use client"`.

```
src/app/
├── (auth routes)
│   ├── layout.tsx              # Root layout: fonts, providers, global CSS
│   ├── page.tsx                # Public landing (redirects to dashboard)
│   ├── login/page.tsx          # Credentials login form (client)
│   ├── privacy/page.tsx        # Static public page
│   ├── terms/page.tsx          # Static public page
│   └── support/page.tsx        # Support form → Server Action
│
├── (screens)/                  # Authenticated route group
│   ├── layout.tsx              # Wraps screens in <AppShell> (sidebar + footer)
│   ├── dashboard/page.tsx      # Metrics + charts
│   ├── employees/...           # Employee CRUD (admin)
│   ├── attendance/...          # Attendance table (admin)
│   ├── my-attendance/...       # Punch in/out (employee)
│   ├── leave/...               # Leave review (admin/manager)
│   ├── my-leave/...            # Leave request form (employee)
│   ├── payroll/...             # Pay-run management + state machine
│   ├── my-payslips/...         # Payslip list + PDF download
│   ├── projects/...            # Project/task/milestone management
│   ├── org-chart/...           # Org hierarchy visualization
│   ├── reports/...             # Reporting dashboards
│   ├── announcements/...       # Announcement CRUD
│   ├── email-logs/...          # Email delivery log viewer
│   ├── audit/...               # Audit log viewer
│   ├── notifications/...       # In-app notifications
│   └── profile/...             # Profile view/edit, change password
│
├── (API routes)
│   ├── api/auth/[...nextauth]/route.ts   # NextAuth handlers (GET/POST)
│   ├── api/documents/upload/route.ts     # File upload → Vercel Blob
│   ├── api/documents/[documentId]/route.ts  # File download/delete
│   ├── api/payslips/[slipId]/pdf/route.ts   # Payslip PDF generation
│   ├── api/payslips/[slipId]/preview/route.ts
│   └── api/projects/[id]/report-pdf/route.ts  # Project report PDF
│
├── favicon.ico
├── globals.css                 # Tailwind base styles
└── not-found.tsx
```

**Routing conventions:**
- `(screens)` is a **route group** — the parentheses mean it does not appear in the URL path. It groups all authenticated routes and applies the `AppShell` layout (sidebar + footer) via its own `layout.tsx`.
- `[id]`, `[slipId]`, `[documentId]`, `[employeeCode]` are **dynamic segments** for detail pages.
- API routes live under `app/api/` (Route Handlers per App Router conventions).

### Layer 3 — Components (`src/components/`)
Reusable UI split into two tiers:

```
src/components/
├── ui/                     # Foundational UI primitives (button, input, table, dialog, etc.)
│   ├── button.tsx, input.tsx, label.tsx, select.tsx, dialog.tsx
│   ├── table.tsx, pagination.tsx, badge.tsx, avatar.tsx
│   ├── charts.tsx, stat-card.tsx, page-header.tsx
│   ├── date-input.tsx, phone-input.tsx, file-preview-dialog.tsx
│   ├── toaster.tsx, progress.tsx, separator.tsx, tabs.tsx, textarea.tsx
│   └── index.ts (barrel, if present)
├── layout/                  # App-level layout components (client)
│   ├── app-shell.tsx        # Main layout shell (server: requires auth, fetches user/company)
│   ├── sidebar.tsx          # Role-based navigation + theme toggle + user menu (client)
│   ├── footer.tsx           # Company footer
│   └── notification-bell.tsx # Real-time-ish notification dropdown (client)
├── dashboard/               # Dashboard-specific widgets (apply-leave-card, holidays-widget, quick-punch)
├── documents/               # Document preview dialog
├── payslip/                 # Payslip download button
├── theme-provider.tsx       # next-themes provider wrapper
├── theme-toggle.tsx         # Light/dark toggle
├── auth-provider.tsx        # next-auth SessionProvider wrapper
├── page-loading-bar.tsx     # Top loading bar (client)
└── hydration-reporter.tsx   # Hydration error reporter (dev)
```

### Layer 4 — Server Actions (`src/lib/actions/`)
The **data-access layer**. Every file uses `"use server"` and contains business-logic functions that:
1. Call `requireAuth()` / `requireAdmin()` / `requireManager()` to enforce RBAC at the server boundary.
2. Interact with the database via Prisma.
3. Write audit entries via `logAudit()`.
4. Trigger side-effects (emails, notifications).

Actions are organized by domain:

```
src/lib/actions/
├── announcements.ts       # CRUD announcements
├── attendance.ts          # Punch in/out, attendance records, month-end closing, LOP derivation
├── company.ts             # Company + statutory config CRUD
├── dashboard.ts           # Dashboard metrics (payroll summary, leave stats, etc.)
├── documents.ts          # Employee document CRUD
├── email-logs.ts          # Email log queries + retry
├── employees.ts          # Employee CRUD, salary components, manager hierarchy
├── leave.ts              # Leave policies, balances, requests, approve/reject
├── notifications.ts      # In-app notifications + fanout
├── org-chart.ts          # Org hierarchy queries
├── password.ts           # Password change (bcrypt)
├── payroll.ts            # Pay-run state machine (open/review/lock/finalize/cancel/delete)
├── profile.ts            # Profile view/edit
└── projects.ts            # Projects, milestones, tasks, team, reports, budget utils
```

**Key pattern:** Actions call into domain services for pure logic (e.g. `computePayroll`) and into the `prisma` client for persistence. Actions are imported directly into Server Components/pages (no HTTP layer — in-process function calls).

### Layer 5 — Domain Services (`src/lib/services/`)
Pure business-logic modules with no UI or direct user input. These are the **core domain** of the application.

```
src/lib/services/
├── payroll-engine.ts     # Core payroll calculation engine: PF, ESI, PT, TDS, pro-rata
├── payroll-exports.ts    # Bank CSV + PF Challan (SFMS) export generators
├── payslip-pdf.tsx       # @react-pdf/renderer: payslip PDF document
├── project-report-pdf.tsx # @react-pdf/renderer: project report PDF
├── email.ts              # Email service: templates, Resend integration, queue logging
└── __tests__/
    └── payroll-engine.test.ts  # Vitest: PF/ESI/PT/pro-rata/payroll assertions
```

**Payroll Engine** (`payroll-engine.ts`) — the heart of the domain:
- Accepts an `Employee` + `SalaryComponent[]` + `StatutoryConfig` + attendance summary.
- Computes gross (pro-rata by paid days), then applies:
  - **PF**: 12% employee / 12% employer on basic, capped at wage ceiling; skipped for probation.
  - **ESI**: threshold-based rates; skipped above threshold.
  - **PT**: slab-based (state-wise configurable).
  - **TDS**: progressive slab tax for old/new regime, annualized then /12.
- Returns a fully itemized `PayrollResult` (earnings, deductions, net, statutory breakdown, attendance days).

### Layer 6 — Core Library (`src/lib/`)
Cross-cutting utilities shared across the app:

| File | Responsibility |
|------|----------------|
| `src/lib/prisma.ts` | Prisma 7 client singleton — uses `PrismaPg` adapter (`@prisma/adapter-pg`); handles pooled vs. local pool config; global reuse in dev |
| `src/auth.ts` | NextAuth config (Credentials provider, JWT session with role claims, `__Secure-` cookie in prod) |
| `src/lib/rbac.ts` | `getSessionUser`, `requireAuth`, `requireAdmin`, `requireManager`, `isAdmin`, `isManager` |
| `src/lib/audit.ts` | `logAudit()` — append-only audit trail writer (never throws to caller) |
| `src/lib/money.ts` | Paise↔rupee conversion, INR formatting, percentage application |
| `src/lib/storage.ts` | File abstraction: **Vercel Blob (prod)** / local disk (`/tmp`) fallback. On Vercel, disk fallback is intentionally disabled — the runtime filesystem is ephemeral and `/var/task` is read-only, so uploads require `BLOB_READ_WRITE_TOKEN` |
| `src/lib/rate-limit.ts` | In-memory sliding-window rate limiter (login brute-force protection) |
| `src/lib/utils.ts` | `cn()` (clsx + tailwind-merge), date/month formatters (India locale) |
| `src/lib/types/projects.ts` | Shared TypeScript types for project domain |
| `prisma.config.ts` | Prisma 7 CLI config — database URL, schema path, migration/seed script |

### Layer 7 — Data Layer (`prisma/schema.prisma`)
The **source of truth** for the data model. Prisma Client is generated from it (`prisma generate`).

> **Prisma 7 change**: The `datasource` block no longer contains `url` (or `directUrl`/`shadowDatabaseUrl`). The connection URL is configured in `prisma.config.ts`. The client is created with a driver adapter (`PrismaPg`) rather than a `datasourceUrl` override.

**Domain entities** (see schema for full field list):
- `Company` — single company with PAN/TAN/PF/ESI, timezone, financial-year settings.
- `User` / `Account` / `Session` / `VerificationToken` — NextAuth + `@auth/prisma-adapter`.
- `Employee` — personal, bank, statutory details; links to `User`.
- `SalaryComponent` — earnings/deductions in **paise**.
- `LeavePolicy`, `LeaveBalance`, `LeaveRequest` — leave lifecycle.
- `Attendance` — daily punch records + status.
- `Holiday` — company holiday calendar.
- `PayRun`, `PaySlip` — payroll workflow + immutable payslip snapshots.
- `StatutoryConfig` — PF/ESI/PT/TDS rates & slabs (configurable, not hardcoded).
- `EmployeeDocument` — uploaded document metadata.
- `AuditLog` — append-only audit trail (JSON before/after).
- `Notification` — in-app notifications.
- `Announcement` — company announcements.
- `EmailLog`, `EmailTemplate` — email delivery tracking.
- `Project`, `Milestone`, `ProjectTask`, `ProjectTeamMember`, `ProjectReport` — project management.
- Enums: `UserRole`, `EmployeeType`, `TaxRegime`, `PayRunStatus`, etc.

**Seeding**: `prisma/seed.ts` (demo data) and `prisma/clean-db.ts` (truncated reset). Run via `npm run db:seed` / `npm run db:clean`.

---

## 3. Data Flow (Request Lifecycle)

### Authenticated page render (Server Component)
```
Browser → Middleware (Edge) → auth cookie? → /page.tsx (Server Component)
  → requireAuth() in action/layout [server] → Session (JWT) → Prisma query
  → Render → Stream + Server Components to client → Hydration
```

### User action (e.g. approve leave)
```
Client (form submit) → Server Action (src/lib/actions/leave.ts)
  → requireAdmin() [RBAC] → Prisma write → logAudit() [audit trail]
  → Optional: sendEmail() [Resend] + fanoutNotifications() [in-app]
  → Return result → Client revalidation (router.refresh / RSC)
```

### Payroll finalization (state machine)
```
transitionPayRun(LOCKED → FINALIZED)
  → Assert valid transition (VALID_TRANSIONS table)
  → Mark finalizedById / finalizedAt
  → For each payslip:
      │  → sendEmail(template=PAYSLIP_READY) [Resend]
      └→ fanoutNotifications(type=PAYSLIP)
  → logAudit(action=FINALIZED)
```

### Money flow (payroll calculation)
```
Attendance (src/lib/actions/attendance.ts) → attendance summary
  ↓
computePayroll(employees + salaryComponents + statutoryConfig)
  → applies pro-rata gross, PF, ESI, PT, TDS
  → returns PayrollResult
  ↓
PaySlip.create({ earningsJson, deductionsJson, netPaise, … })  [immutable snapshot]
```

### File upload flow
```
Browser → POST api/documents/upload
  → requireAdmin() [RBAC] → saveFile(File) → storage.ts
      → Vercel Blob (prod, BLOB_READ_WRITE_TOKEN)
      OR local disk UPLOAD_DIR (dev)
  → EmployeeDocument.create({ filePath, … })
```

---

## 4. File Structure Overview

```
SKWebApp-GitRepo/
├── Procfile                      # web: npm start (PaaS / self-hosted)
├── docker-compose.yml            # PostgreSQL 16 service (local dev)
├── vercel.json                   # Build config, cache headers, function limits
├── next.config.ts                # Next.js config (image domains, security headers, optimizePackageImports)
├── tsconfig.json                 # TS config (@/ → src/, strict mode, incremental)
├── prisma.config.ts              # Prisma 7 CLI config: DB URL, schema path, migration/seed script
├── postcss.config.mjs            # Tailwind PostCSS plugin
├── eslint.config.mjs             # ESLint 9 flat config (Next.js core-web-vitals)
├── vitest.config.ts              # Vitest config (node env, @/ alias)
├── package.json                  # Dependencies + scripts
├── .env.example                  # Environment variable template
├── .gitignore
├── tsconfig.tsbuildinfo          # Incremental build cache (gitignored)
│
├── prisma/
│   ├── schema.prisma             # Data model (source of truth; datasource block no longer has `url`)
│   ├── seed.ts                   # Demo data seeder
│   └── clean-db.ts               # Dev DB reset script
│
├── src/
│   ├── middleware.ts             # Edge middleware (HTTPS redirect, auth guard)
│   ├── auth.ts                   # NextAuth configuration
│   │
│   ├── app/                      # App Router (pages, layouts, API routes)
│   │   ├── layout.tsx            # Root layout (fonts, providers, toaster)
│   │   ├── page.tsx              # Landing page
│   │   ├── login/page.tsx        # Login screen
│   │   ├── globals.css           # Tailwind directives
│   │   ├── (screens)/            # Authenticated route group
│   │   │   └── layout.tsx        # AppShell wrapper
│   │   └── api/                  # Route handlers
│   │
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Component library primitives
│   │   └── layout/               # App shell: sidebar, footer, app-shell
│   │
│   └── lib/                      # Core library & data layer
│       ├── actions/              # Server Actions (RBAC-guarded, Prisma writes)
│       ├── services/             # Domain services (payroll engine, email, PDFs)
│       ├── hooks/                # Client hooks (use-toast, use-navigation-loading)
│       ├── prisma.ts             # Prisma 7 client singleton — uses PrismaPg adapter (pooled vs. local pool config)
│       ├── rbac.ts               # Auth + role guards
│       ├── audit.ts              # Audit logging utility
│       ├── money.ts              # Currency utilities (paise-based)
│       ├── storage.ts            # File storage abstraction
│       ├── rate-limit.ts         # Login rate limiting
│       └── utils.ts              # Shared helpers (cn, date formatting)
│
└── docs/
    ├── architecture.md           # This file
    └── security.md               # Security configuration guide
```

---

## 5. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Integer paise storage** | Avoids floating-point rounding errors in currency; `money.ts` handles conversion/formatting |
| **App Router + Server Actions** | Reduces API surface, co-locates data fetching with UI, enables RSC streaming |
| **RBAC in every action** | Server-side guard (`requireAdmin` etc.) prevents unauthorized mutations even if UI is bypassed |
| **Immutable payslip snapshots** | Finalized payslips store JSON snapshots of earnings/deductions/statutory — immune to later schema/config changes |
| **Configurable statutory rates** | PF/ESI/PT/TDS rates come from `StatutoryConfig`, not hardcoded |
| **Pay-run state machine** | Explicit `VALID_TRANSITIONS` table in `actions/payroll.ts` enforces valid workflow (DRAFT → REVIEWING → LOCKED → FINALIZED) |
| **Append-only audit log** | `AuditLog` model captures before/after JSON on all mutations |
| **Edge middleware auth check** | Cookie-only check (no JWT decode) keeps the edge function tiny and fast |
| **Blob storage with disk fallback** | `@vercel/blob` in prod, local `/tmp` in dev — single codebase, both environments work |
| **Prisma 7 driver adapter** | `PrismaPg` (`@prisma/adapter-pg`) manages the Postgres connection pool; pooled URLs skip client-side pool config |
| **Global Prisma client reuse** | `globalThis.prisma` prevents connection pool exhaustion during hot-reload in dev |

---

## 6. Testing

- **Framework**: Vitest 3 (unit tests, Node environment).
- **Coverage**: `src/lib/services/payroll-engine.test.ts` — tests PF capping, ESI thresholds, PT slabs, pro-rata, and full payroll computation.
- **Run**: `npm test` (single run) / `npm run test:watch` (watch mode).
- **Lint**: `npm run lint` (ESLint, Next.js rules).

---

## 7. Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (localhost:3000) |
| `npm run build` | Generate Prisma client + production build |
| `npm start` | Run production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create + apply migration |
| `npm run db:push` | Push schema to DB (dev, non-migration) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:clean` | Reset/truncate database |
| `npm test` | Run unit tests |
| `npm run lint` | Run ESLint |

---

## 8. Deployment

- **Primary platform**: Vercel (`vercel.json` configures build → `.next` output directory).
- **Self-hosted / PaaS**: `Procfile` defines `web: npm start`. Requires `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `RESEND_API_KEY`, and `BLOB_READ_WRITE_TOKEN` (or `UPLOAD_DIR`) env vars.
- **Database**: Local dev via `docker compose up -d`; production uses Prisma Postgres (pooled endpoint) or self-managed Postgres.

---

## 9. Dependency Update State (2026-09-29)

All direct dependencies were bumped to the latest stable releases and the deprecated `@types/bcryptjs` stub was removed (`bcryptjs@3` ships its own types). The Prisma 6→7 migration was applied end-to-end.

### Bumped to latest stable
| Package | From | To |
|---------|------|----|
| `next` | 16.3.3 | 16.3.7 |
| `eslint-config-next` | 16.3.3 | 16.3.7 |
| `react` / `react-dom` | 19.2.8 | 19.3.0 |
| `@prisma/client` | 6.8.2 | 7.10.0 |
| `prisma` | 6.12.0 | 7.10.0 |
| `@prisma/adapter-pg` | — (new) | 7.10.0 |
| `zod` | 3.25.76 | 4.6.5 |
| `lucide-react` | 0.511.0 | 1.48.0 |
| `@types/node` | 20.19.43 | 26.6.3 |
| `recharts` | 2.15.4 | 3.10.1 |
| `resend` | 4.8.0 | 6.30.0 |
| `@next/bundle-analyzer` | 16.3.5 | 16.3.7 |
| `next-auth` | 5.0.0-beta.28 | 5.0.0-beta.32 |

### Pinned (ecosystem incompatibility)
| Package | Pinned to | Why |
|---------|-----------|-----|
| `typescript` | `^5` (5.9.3) | TS 7 is incompatible with the `typescript-eslint` bundled in `eslint-config-next@16.3.7`. Next.js build compiles fine with TS 7; only lint is blocked. |
| `eslint` | `^9` (9.39.5) | ESLint 10 is incompatible with `eslint-plugin-react@7.37.5` (the version bundled by `eslint-config-next`), which only supports ESLint `^3..^9.7`. ESLint 9 lints cleanly. |

### Removed
| Package | Reason |
|---------|--------|
| `@types/bcryptjs` | Deprecated stub — `bcryptjs@3.0.3` ships its own type definitions |

### Unused (not removed — kept for potential future use)
| Package | Note |
|---------|------|
| `recharts` | Not imported anywhere in `src/` (the `charts.tsx` UI component only imports React + `cn`). Kept in case of future dashboard work. |

### Known audit advisories (not yet fixed)
- **`vitest` 3.x** → `@vitest/mocker` path-traversal (moderate, dev-only). Fixable by bumping to vitest 5 (breaking change).
- **`prisma` CLI** → `mysql2` / `deepmerge-ts` (high). Transitive deps loaded only for MySQL connections; not exploitable for this PostgreSQL-only project.
