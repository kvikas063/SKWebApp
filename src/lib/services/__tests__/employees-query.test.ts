import { describe, it, expect } from "vitest";
import { parseEmployeesQuery } from "@/lib/services/employees";

const parse = (qs: string) => parseEmployeesQuery(new URLSearchParams(qs));

describe("parseEmployeesQuery", () => {
  it("applies defaults when the query string is empty", () => {
    const { data, errors } = parse("");
    expect(errors).toBeNull();
    expect(data).toEqual({ page: 1, limit: 10, offset: undefined, search: undefined, department: undefined });
  });

  it("coerces numeric strings", () => {
    const { data, errors } = parse("page=3&limit=25");
    expect(errors).toBeNull();
    expect(data).toMatchObject({ page: 3, limit: 25 });
  });

  it("treats blank values as absent rather than invalid", () => {
    const { data, errors } = parse("page=&limit=&search=");
    expect(errors).toBeNull();
    expect(data).toMatchObject({ page: 1, limit: 10, search: undefined });
  });

  it("trims and keeps search and department", () => {
    const { data, errors } = parse("search=%20jane%20&department=Engineering");
    expect(errors).toBeNull();
    expect(data).toMatchObject({ search: "jane", department: "Engineering" });
  });

  it("caps limit at 100", () => {
    const { data, errors } = parse("limit=5000");
    expect(errors).not.toBeNull();
    expect(errors).toHaveProperty("limit");
    expect(data).toBeNull();
  });

  it("rejects a limit below 1", () => {
    const { data, errors } = parse("limit=0");
    expect(data).toBeNull();
    expect(errors).toHaveProperty("limit");
  });

  it("rejects non-integer and negative paging values", () => {
    expect(parse("page=1.5").errors).toHaveProperty("page");
    expect(parse("page=-2").errors).toHaveProperty("page");
    expect(parse("offset=-1").errors).toHaveProperty("offset");
  });

  it("rejects non-numeric paging values", () => {
    const { data, errors } = parse("page=abc");
    expect(data).toBeNull();
    expect(errors).toHaveProperty("page");
  });

  it("accepts offset as an alternative to page", () => {
    const { data, errors } = parse("limit=10&offset=40");
    expect(errors).toBeNull();
    expect(data).toMatchObject({ limit: 10, offset: 40 });
  });

  it("rejects an over-long search term", () => {
    const { data, errors } = parse(`search=${"a".repeat(101)}`);
    expect(data).toBeNull();
    expect(errors).toHaveProperty("search");
  });

  it("ignores unknown query parameters", () => {
    const { data, errors } = parse("page=2&sort=name");
    expect(errors).toBeNull();
    expect(data).toMatchObject({ page: 2 });
  });
});
