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

const adapter = new PrismaPg(getPoolConfig());

function createClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    adapter,
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
