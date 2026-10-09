import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/lib/rbac";
import { listEmployees, parseEmployeesQuery } from "@/server/employees";

/**
 * GET /api/employees
 *
 * Paginated, filtered employee list.
 *
 * Query parameters (all optional):
 *   page       1-based page number. Default 1.
 *   limit      Rows per page, 1-100. Default 10.
 *   offset     Row offset; when present it overrides `page`.
 *   search     Case-insensitive match on first/last name, email, employee
 *              code, designation or department.
 *   department Exact department match. "ALL" is treated as no filter.
 *
 * Responses:
 *   200 { data, total, page, limit, offset, totalPages, summary,
 *         departmentCounts, filters }
 *   400 { error, details }  — a query parameter failed validation
 *   401 { error }           — no session
 *
 * The response mirrors what the `getEmployees` server action returns, so a
 * client of either surface sees the same payload. Access is role-scoped by
 * `listEmployees`: an admin sees the whole company, a manager only their
 * direct reports.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: params, errors } = parseEmployeesQuery(req.nextUrl.searchParams);
  if (!params) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: errors },
      { status: 400 },
    );
  }

  const result = await listEmployees(user, params);

  return NextResponse.json(
    {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      offset: result.offset,
      totalPages: result.totalPages,
      summary: result.summary,
      departmentCounts: result.departmentCounts,
      // Echo the effective filters back so a client can render the active
      // filter state without re-deriving it from its own request.
      filters: {
        search: params.search ?? null,
        department: params.department ?? "ALL",
      },
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
