import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// On Vercel (and any serverless runtime) every cold container starts a fresh
// Node process, so a plain PrismaClient pays a full DB connection + engine
// startup on the first request of each instance. Strip the connection pool
// down to a single connection to avoid exhausting the Postgres limit and
// keep cold starts cheap. Use a pooled URL when one is provided (e.g. a
// pgBouncer proxy), otherwise fall back to the raw DATABASE_URL.
const pooledUrl = process.env.DATABASE_URL
  ? process.env.DATABASE_URL +
    (process.env.DATABASE_URL.includes("?") ? "&" : "?") +
    "connection_limit=1&pool_timeout=10"
  : undefined;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: pooledUrl,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
