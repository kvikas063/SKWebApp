import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { PoolConfig } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPoolConfig(): PoolConfig {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  // Neon's pooled endpoint (-pooler.<host>), pgBouncer URLs, and Prisma
  // Postgres connection strings already manage connection multiplexing.
  // pg handles its own pool natively, so the Prisma engine's connection_limit
  // query param no longer applies — cap max instead for local dev.
  const isPooled =
    url.includes("-pooler.") ||
    url.includes("pgbouncer=true") ||
    url.startsWith("prisma+postgres://") ||
    url.includes("pooled.db.prisma.io");
  if (isPooled) return { connectionString: url };
  // Local dev: cap the pool so one process can't exhaust the dev Postgres.
  return { connectionString: url, max: 1, idleTimeoutMillis: 10000 };
}

// Lazily create the client on first use. Importing this module must never
// connect to the database or throw — it is imported during static
// prerendering (e.g. by route handlers), where DATABASE_URL is not set.
// The actual connection happens only when a query runs, at which point the
// runtime environment (Vercel) has DATABASE_URL available.
let client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (client) return client;
  const adapter = new PrismaPg(getPoolConfig());
  client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    adapter,
  });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

// Proxy so `prisma.user.findUnique(...)` works without eagerly constructing
// the client. This preserves the existing `prisma.<model>.<method>` API.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return getClient()[prop as keyof PrismaClient];
  },
});