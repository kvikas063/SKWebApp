import { z } from "zod";
export declare const DEFAULT_PAGE_SIZE = 10;
export declare const MAX_PAGE_SIZE = 100;
export declare const pagingQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type PagingQuery = z.infer<typeof pagingQuerySchema>;
export declare function resolvePaging(params: PagingQuery): {
    page: number;
    limit: number;
    offset: number;
    skip: number;
    take: number;
};
export declare function buildPageMeta(params: PagingQuery, total: number): {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
export declare function settlePage<T>(data: T[], total: number, params: PagingQuery): {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    data: T[];
};
export declare function parsePagingQuery(searchParams: URLSearchParams): PagingQuery;
//# sourceMappingURL=pagination.d.ts.map