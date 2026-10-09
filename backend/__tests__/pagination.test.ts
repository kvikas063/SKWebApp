import { describe, it, expect } from "vitest";
import {
  buildPageMeta,
  clampPaging,
  parsePagingQuery,
  resolvePaging,
  settlePage,
  toOffset,
  toPositiveInt,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "@/server/pagination";

describe("resolvePaging", () => {
  it("defaults to the first page at the default size", () => {
    expect(resolvePaging()).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE, skip: 0, take: 10 });
  });

  it("derives the offset from page and limit", () => {
    expect(resolvePaging({ page: 3, limit: 25 })).toEqual({ page: 3, limit: 25, skip: 50, take: 25 });
  });

  it("lets an explicit offset win over page", () => {
    expect(resolvePaging({ page: 1, limit: 10, offset: 40 })).toEqual({
      page: 1, limit: 10, skip: 40, take: 10,
    });
  });

  it("accepts raw string input from searchParams", () => {
    expect(resolvePaging({ page: "2", limit: "20" })).toEqual({ page: 2, limit: 20, skip: 20, take: 20 });
  });

  it("caps limit and falls back on nonsense", () => {
    expect(resolvePaging({ limit: 5000 }).limit).toBe(MAX_PAGE_SIZE);
    expect(resolvePaging({ limit: "abc" }).limit).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePaging({ limit: 0 }).limit).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePaging({ limit: -5 }).limit).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePaging({ page: "nope" }).page).toBe(1);
  });

  it("never produces a negative skip", () => {
    expect(resolvePaging({ page: 0, limit: 10 }).skip).toBe(0);
    expect(resolvePaging({ offset: -10 }).skip).toBe(0);
  });

  it("honours custom defaults and caps", () => {
    expect(resolvePaging({}, { defaultLimit: 25 }).limit).toBe(25);
    expect(resolvePaging({ limit: 15 }, { maxLimit: 10 }).limit).toBe(10);
  });
});

describe("toPositiveInt / toOffset", () => {
  it("clamps and falls back", () => {
    expect(toPositiveInt("42", 1, 100)).toBe(42);
    expect(toPositiveInt("142", 1, 100)).toBe(100);
    expect(toPositiveInt("x", 7, 100)).toBe(7);
    expect(toPositiveInt(undefined, 7, 100)).toBe(7);
    expect(toPositiveInt("8.9", 1, 100)).toBe(8);
  });

  it("returns undefined for a negative offset so page/limit can derive one", () => {
    expect(toOffset(30)).toBe(30);
    expect(toOffset("30")).toBe(30);
    expect(toOffset(-1)).toBeUndefined();
    expect(toOffset("nope")).toBeUndefined();
    expect(toOffset(undefined)).toBeUndefined();
  });
});

describe("buildPageMeta", () => {
  it("computes the paging block", () => {
    expect(buildPageMeta({ page: 2, limit: 10, skip: 10 }, 65)).toEqual({
      page: 2, limit: 10, offset: 10, total: 65, totalPages: 7,
    });
  });

  it("reports at least one page for an empty list", () => {
    expect(buildPageMeta({ page: 1, limit: 10, skip: 0 }, 0).totalPages).toBe(1);
  });

  it("rounds a partial last page up", () => {
    expect(buildPageMeta({ page: 1, limit: 10, skip: 0 }, 11).totalPages).toBe(2);
  });
});

describe("parsePagingQuery", () => {
  it("applies defaults for an empty query", () => {
    const { data, errors } = parsePagingQuery(new URLSearchParams(""));
    expect(errors).toBeNull();
    expect(data).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE, offset: undefined });
  });

  it("coerces and validates", () => {
    expect(parsePagingQuery(new URLSearchParams("page=2&limit=25")).data)
      .toMatchObject({ page: 2, limit: 25 });
    expect(parsePagingQuery(new URLSearchParams("limit=0")).errors).toHaveProperty("limit");
    expect(parsePagingQuery(new URLSearchParams("page=abc")).errors).toHaveProperty("page");
  });

  it("treats blank values as absent", () => {
    expect(parsePagingQuery(new URLSearchParams("page=&limit=")).data)
      .toMatchObject({ page: 1, limit: DEFAULT_PAGE_SIZE });
  });
});

describe("clampPaging", () => {
  it("leaves an in-range page untouched", () => {
    const paging = resolvePaging({ page: "3", limit: "10" });
    expect(clampPaging(paging, 100)).toEqual(paging);
  });

  it("pulls a past-the-end page back to the last page that exists", () => {
    const paging = resolvePaging({ page: "99999", limit: "10" });
    expect(clampPaging(paging, 1235)).toEqual({ page: 124, limit: 10, skip: 1230, take: 10 });
  });

  it("keeps page 1 when the result set is empty", () => {
    const paging = resolvePaging({ page: "5", limit: "10" });
    expect(clampPaging(paging, 0)).toEqual({ page: 1, limit: 10, skip: 0, take: 10 });
  });
});

describe("buildPageMeta", () => {
  it("never reports an impossible range for an out-of-range page", () => {
    const paging = resolvePaging({ page: "99999", limit: "10" });
    const meta = buildPageMeta(paging, 1235);
    expect(meta).toEqual({ page: 124, limit: 10, offset: 1230, total: 1235, totalPages: 124 });
    // The old shape produced "Showing 999981-1235 of 1235".
    expect(meta.offset + meta.limit).toBeGreaterThanOrEqual(meta.total);
  });
});

describe("settlePage", () => {
  it("returns the already-fetched rows when the page is in range", async () => {
    const paging = resolvePaging({ page: "2", limit: "10" });
    const refetch = async () => {
      throw new Error("refetch should not run");
    };
    await expect(settlePage({ data: ["a"], paging, total: 100, refetch })).resolves.toEqual({
      data: ["a"],
      page: 2,
    });
  });

  it("re-runs the query against the last real page when out of range", async () => {
    const paging = resolvePaging({ page: "99999", limit: "10" });
    const calls: number[] = [];
    const result = await settlePage({
      data: [],
      paging,
      total: 1235,
      refetch: async (p) => {
        calls.push(p.skip);
        return ["last-page-row"];
      },
    });
    expect(result).toEqual({ data: ["last-page-row"], page: 124 });
    expect(calls).toEqual([1230]);
  });

  it("does not re-query when the table is simply empty", async () => {
    const paging = resolvePaging({ page: "7", limit: "10" });
    const refetch = async () => {
      throw new Error("refetch should not run");
    };
    await expect(settlePage({ data: [], paging, total: 0, refetch })).resolves.toEqual({
      data: [],
      page: 1,
    });
  });
});
