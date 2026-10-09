import { z } from "zod";
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const pagingQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    offset: z.coerce.number().int().nonnegative().optional(),
    search: z.string().max(100).optional(),
    department: z.string().max(50).optional(),
});
export function resolvePaging(params) {
    const limit = Math.min(params.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const page = params.page ?? 1;
    const offset = params.offset ?? (page - 1) * limit;
    return { page, limit, offset, skip: offset, take: limit };
}
export function buildPageMeta(params, total) {
    const { page, limit, offset } = resolvePaging(params);
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        offset,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
export function settlePage(data, total, params) {
    return {
        data,
        ...buildPageMeta(params, total),
    };
}
export function parsePagingQuery(searchParams) {
    const result = pagingQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!result.success) {
        throw new Error(`Invalid query parameters: ${result.error.message}`);
    }
    return result.data;
}
//# sourceMappingURL=pagination.js.map