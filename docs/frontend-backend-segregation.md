# Segregation Plan: Frontend / Backend Code

## Goal

Reorganize the project so the root contains only two source trees:

- `frontend/` — Next.js app, UI components, client utilities, static assets
- `backend/` — server actions, services, data access, auth, Prisma, storage, audit

No behavior changes. Only file paths and import strings change.

---

## Current state

```
src/
  app/                   # Next.js App Router pages + API routes
  components/            # Frontend React components
  lib/                   # MIXED: backend + frontend + shared
    prisma.ts
    rbac.ts
    storage.ts
    audit.ts
    rate-limit.ts
    actions/             # backend
    services/            # backend
    hooks/               # frontend
    types/               # shared
    money.ts             # shared
    utils.ts             # shared
auth.ts                  # backend
prisma/                  # backend
```

Cross-boundary leaks: none. Backend modules are imported only from Server Components and Server Actions.

---

## Target structure

```
frontend/
  app/                   # Next.js App Router pages + API routes
  components/            # Frontend React components
  lib/                   # Frontend + shared utilities
    money.ts
    utils.ts
    hooks/
    types/
    __tests__/
  public/                # Static assets
backend/
  actions/               # "use server" modules
  services/              # Domain services, email, PDF generation
  lib/                   # Backend utilities
    prisma.ts
    rbac.ts
    storage.ts
    audit.ts
    rate-limit.ts
  prisma/                # Schema, migrations, seed
  auth.ts                # NextAuth config
package.json             # At project root
next.config.ts           # At project root
tsconfig.json            # At project root
```

---

## Move map

### From `src/` to `frontend/`

| Current | Target |
|---------|--------|
| `src/app/**` | `frontend/app/**` |
| `src/components/**` | `frontend/components/**` |
| `src/lib/money.ts` | `frontend/lib/money.ts` |
| `src/lib/utils.ts` | `frontend/lib/utils.ts` |
| `src/lib/hooks/**` | `frontend/lib/hooks/**` |
| `src/lib/types/**` | `frontend/lib/types/**` |
| `src/lib/__tests__/money.test.ts` | `frontend/lib/__tests__/money.test.ts` |
| `src/globals.css` | `frontend/globals.css` |
| `src/favicon.ico` | `frontend/favicon.ico` |

### From `src/` to `backend/`

| Current | Target |
|---------|--------|
| `src/auth.ts` | `backend/auth.ts` |
| `src/proxy.ts` | `backend/proxy.ts` |
| `src/app/api/**` | `frontend/app/api/**` (API routes stay in Next.js app dir) |

### From `src/lib/` root to `backend/lib/`

| Current | Target |
|---------|--------|
| `src/lib/prisma.ts` | `backend/lib/prisma.ts` |
| `src/lib/rbac.ts` | `backend/lib/rbac.ts` |
| `src/lib/storage.ts` | `backend/lib/storage.ts` |
| `src/lib/audit.ts` | `backend/lib/audit.ts` |
| `src/lib/rate-limit.ts` | `backend/lib/rate-limit.ts` |

### From `src/lib/actions/` to `backend/actions/`

| Current | Target |
|---------|--------|
| `src/lib/actions/announcements.ts` | `backend/actions/announcements.ts` |
| `src/lib/actions/attendance.ts` | `backend/actions/attendance.ts` |
| `src/lib/actions/company.ts` | `backend/actions/company.ts` |
| `src/lib/actions/dashboard.ts` | `backend/actions/dashboard.ts` |
| `src/lib/actions/documents.ts` | `backend/actions/documents.ts` |
| `src/lib/actions/email-logs.ts` | `backend/actions/email-logs.ts` |
| `src/lib/actions/employees.ts` | `backend/actions/employees.ts` |
| `src/lib/actions/leave.ts` | `backend/actions/leave.ts` |
| `src/lib/actions/notifications.ts` | `backend/actions/notifications.ts` |
| `src/lib/actions/org-chart.ts` | `backend/actions/org-chart.ts` |
| `src/lib/actions/password.ts` | `backend/actions/password.ts` |
| `src/lib/actions/payroll.ts` | `backend/actions/payroll.ts` |
| `src/lib/actions/profile.ts` | `backend/actions/profile.ts` |
| `src/lib/actions/projects.ts` | `backend/actions/projects.ts` |

### From `src/lib/services/` to `backend/`

| Current | Target |
|---------|--------|
| `src/lib/services/audit.ts` | `backend/lib/services-audit.ts` |
| `src/lib/services/email.ts` | `backend/email.ts` |
| `src/lib/services/employees.ts` | `backend/employees.ts` |
| `src/lib/services/pagination.ts` | `backend/pagination.ts` |
| `src/lib/services/payroll-engine.ts` | `backend/payroll-engine.ts` |
| `src/lib/services/payroll-exports.ts` | `backend/payroll-exports.ts` |
| `src/lib/services/payslip-pdf.tsx` | `backend/payslip-pdf.tsx` |
| `src/lib/services/project-report-pdf.tsx` | `backend/project-report-pdf.tsx` |

### Tests

| Current | Target |
|---------|--------|
| `src/lib/__tests__/money.test.ts` | `frontend/lib/__tests__/money.test.ts` (stay — tests shared code) |
| `src/lib/services/__tests__/` | `backend/__tests__/` |

### Stay in place (root)

| File | Reason |
|------|--------|
| `prisma/schema.prisma` | Move to `backend/prisma/schema.prisma` |
| `prisma/migrations/` | Move to `backend/prisma/migrations/` |
| `prisma/seed.ts` | Move to `backend/prisma/seed.ts` |
| `prisma/clean-db.ts` | Move to `backend/prisma/clean-db.ts` |
| `prisma.config.ts` | Move to `backend/prisma.config.ts` |
| `package.json` | Keep at root |
| `next.config.ts` | Keep at root, add `rootDir` |
| `tsconfig.json` | Keep at root, update paths |
| `vercel.json` | Keep at root |
| `railway.json` | Keep at root |
| `docker-compose.yml` | Keep at root |

---

## Path alias changes

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./frontend/*"],
      "@server/*": ["./backend/*"]
    }
  }
}
```

### Import rules after segregation

| Import from | Allowed prefix |
|-------------|----------------|
| `frontend/app/**` (Server Components) | `@/server/*`, `@/*` |
| `frontend/components/**` (Server Components) | `@/server/*`, `@/*` |
| `"use client"` components | `@/*` only — never `@/server/*` |
| `"use server"` modules | `@/server/*`, `@/*` (shared only) |
| `backend/**` | `@/server/*`, `@/*` (shared only) |

### Import string changes

| Before | After |
|--------|-------|
| `@/lib/prisma` | `@/server/lib/prisma` |
| `@/lib/rbac` | `@/server/lib/rbac` |
| `@/lib/storage` | `@/server/lib/storage` |
| `@/lib/audit` | `@/server/lib/audit` |
| `@/lib/actions/employees` | `@/server/actions/employees` |
| `@/lib/services/email` | `@/server/email` |
| `@/lib/services/payroll-engine` | `@/server/payroll-engine` |
| `@/lib/money` | `@/lib/money` (unchanged) |
| `@/lib/utils` | `@/lib/utils` (unchanged) |

---

## Next.js configuration

Update `next.config.ts` at project root:

```ts
import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  rootDir: path.join(process.cwd(), 'frontend'),
  // ... existing config (headers, images, etc.)
};

export default nextConfig;
```

Update `package.json` scripts to reference the new root:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

With `rootDir` set, `next dev` and `next build` automatically resolve `frontend/app` as the app directory.

---

## Files that need import updates

| Source | Count | Why |
|--------|-------|-----|
| `frontend/app/**` | 40+ | Server Components importing actions, services, rbac, storage |
| `frontend/components/**` | 20+ | Server Components importing actions, types, utils |
| `backend/actions/**` | 14 | Importing services, rbac, audit, prisma |
| `backend/services/**` | 8 | Importing each other, rbac |

Total files to touch: ~80+

---

## Validation

Run these after every batch of moves:

```bash
npm run lint
npm run build
npm run test
```

### Manual smoke tests

1. Sign-in → dashboard loads
2. Employee list → create → edit
3. Payroll run → preview → PDF download
4. Document upload → download → delete
5. Leave apply → approve → notification
6. Project create → milestone → task → report PDF

---

## Risks / notes

- **No runtime behavior change** — only file paths change.
- **Type-only imports from `"use server"` modules** are erased at build time and remain safe after the move.
- **Next.js rootDir**: `frontend/` becomes the Next.js project root. All Next.js-specific files (`app/`, `components/`, `public/`) live under it.
- **Tests**: `frontend/lib/__tests__/money.test.ts` stays in frontend. Service tests move to `backend/__tests__/`.
- **Git history**: use `git mv` to preserve blame/lineage.
- **Future enforcement**: after segregation, add ESLint `no-restricted-imports` to prevent `@/server/*` imports in `"use client"` files.

---

## Recommended order

1. Move all backend files to `backend/` with `git mv`
2. Move all frontend files to `frontend/` with `git mv`
3. Update `tsconfig.json` paths and `next.config.ts` rootDir
4. Update imports in `frontend/app/**` and `frontend/components/**`
5. Update imports within `backend/` itself
6. Run `npm run lint && npm run build && npm run test`
7. Commit as a single refactor PR
