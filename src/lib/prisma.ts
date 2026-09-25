import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Neon's pooled endpoint (-pooler.<host>) and pgBouncer URLs already manage
// connection multiplexing server-side. Prisma's own connection_limit would
// just add a second layer of throttling — and a tight pool_timeout makes
// queries queue, which on a saturated pooler shows up as multi-second stalls.
// Only append pool params for plain (non-pooled) Postgres, i.e. local dev.
function datasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  const isPooled =
    url.includes("-pooler.") ||
    url.includes("pgbouncer=true") ||
    url.startsWith("prisma+postgres://") ||
    url.includes("pooled.db.prisma.io");
  if (isPooled) return url;
  // Local dev: cap the pool so one process can't exhaust the dev Postgres.
  return url + (url.includes("?") ? "&" : "?") + "connection_limit=1&pool_timeout=10";
}

function createClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasourceUrl: datasourceUrl(),
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;