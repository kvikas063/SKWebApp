import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // DATABASE_URL is only required for commands that actually connect to the
    // database (migrate, db push, studio, seed). `prisma generate` — which is
    // what `npm run build` runs — does not need it. Prisma's `env()` helper
    // throws if the variable is missing, so read it defensively here instead.
    // Vercel builds run without DATABASE_URL set, and the config must still
    // load so the client can be generated.
    url: process.env.DATABASE_URL || "",
  },
});