import { z } from "zod";

/**
 * Shared list-pagination helpers.
 *
 * Every list screen takes the same `page` / `limit` / `offset` inputs and gets
 * the same `PageMeta` back, so the "load one page" logic lives here once rather
 * than being restated per screen.
 *
 * `offset` is supported alongside `page` for callers that already think in
 * offsets; when present it wins, and `page` is still echoed so a client can
 * render its own controls.
 */

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export type PageParams = {
  page?: number | string;
  limit?: number | string;
  offset?: number | string;
};

export type PageMeta = {
  page: number;
  limit: number;
  offset: number;
  total: number;
  totalPages: number;
};

/** Clamp to a positive integer, falling back when absent or unparseable. */
export function toPositiveInt(
  value: number | string | undefined,
  fallback: number,
  max: number,
): number {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  const int = Math.trunc(n);
  if (int < 1) return fallback;
  return Math.min(int, max);
}

/** A non-negative row offset, or `undefined` so `page`/`limit` can derive one. */
export function toOffset(value: number | string | undefined): number | undefined {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return undefined;
  return Math.trunc(n);
}

export type ResolvedPaging = {
  page: number;
  limit: number;
  skip: number;
  take: number;
};

/**
 * Normalise paging input into the `take`/`skip` a Prisma query needs.
 * Accepts strings so a page component can forward raw `searchParams` unchanged.
 */
export function resolvePaging(
  params: PageParams = {},
  { defaultLimit = DEFAULT_PAGE_SIZE, maxLimit = MAX_PAGE_SIZE } = {},
): ResolvedPaging {
  const limit = toPositiveInt(params.limit, defaultLimit, maxLimit);
  const explicitOffset = toOffset(params.offset);
  const page = toPositiveInt(params.page, 1, Number.MAX_SAFE_INTEGER);
  const offset = explicitOffset ?? (page - 1) * limit;
  return { page, limit, skip: offset, take: limit };
}

/**
 * Pull a requested page back into range.
 *
 * `resolvePaging` cannot do this: it only sees the requested numbers, while the
 * last page that actually exists depends on the row count. A stale bookmark or a
 * `?page=` link built before rows were deleted can therefore point past the end,
 * where Prisma just returns nothing.
 */
export function clampPaging(
  paging: Pick<ResolvedPaging, "page" | "limit" | "skip">,
  total: number,
): ResolvedPaging {
  const totalPages = Math.max(1, Math.ceil(total / paging.limit));
  const page = Math.min(paging.page, totalPages);
  return { page, limit: paging.limit, skip: (page - 1) * paging.limit, take: paging.limit };
}

/**
 * Build the paging block a list response returns alongside its rows. `totalPages`
 * is at least 1 so the UI has a valid target for an empty list.
 *
 * `page` is clamped to the last page that exists, so the metadata never reports
 * an impossible range such as "Showing 999981-1235 of 1235".
 */
export function buildPageMeta(
  paging: Pick<ResolvedPaging, "page" | "limit" | "skip">,
  total: number,
): PageMeta {
  const clamped = clampPaging(paging, total);
  return {
    page: clamped.page,
    limit: clamped.limit,
    offset: clamped.skip,
    total,
    totalPages: Math.max(1, Math.ceil(total / clamped.limit)),
  };
}

/**
 * Finish a list query once the total is known: if the requested page was past the
 * end, re-run `refetch` against the last page that exists so the caller gets rows
 * that match the paging metadata. Returns the already-fetched `data` untouched in
 * the common case, so the extra query only runs for an out-of-range request.
 */
export async function settlePage<T>(args: {
  data: T[];
  paging: ResolvedPaging;
  total: number;
  refetch: (paging: ResolvedPaging) => Promise<T[]>;
}): Promise<{ data: T[]; page: number }> {
  const clamped = clampPaging(args.paging, args.total);
  // Nothing to re-fetch when the table is empty, or when the requested page was
  // already the last page that exists.
  if (args.total === 0 || clamped.skip === args.paging.skip) {
    return { data: args.data, page: clamped.page };
  }
  return { data: await args.refetch(clamped), page: clamped.page };
}

/** A list of rows plus its paging block, as returned by the list actions. */
export type Paginated<T> = { data: T[] } & PageMeta;

const blankToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

/**
 * Zod schema for paging-only query strings. Used by HTTP list endpoints; page
 * components pass typed values instead and rely on `resolvePaging`'s clamping.
 * Exported so resource-specific schemas can `.extend()` it instead of
 * restating the paging rules.
 */
export const pagingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  offset: z.coerce.number().int().min(0).max(1_000_000).optional(),
});

/** Collapse a zod failure into a field-keyed message map, or `null` on success. */
export function readQueryResult<T>(result: z.ZodSafeParseResult<T>) {
  if (result.success) return { data: result.data, errors: null };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return { data: null, errors };
}

export function parsePagingQuery(params: URLSearchParams) {
  const input = Object.fromEntries(
    Array.from(params.keys()).map((key) => [key, blankToUndef(params.get(key))]),
  );
  return readQueryResult(pagingQuerySchema.safeParse(input));
}
