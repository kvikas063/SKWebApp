import type { EmployeeType, SalaryComponentType, UserRole } from "@prisma/client";

/**
 * An employee row as returned by `listEmployees`.
 *
 * This is an explicit subset of the `Employee` model, not a spread of it: the
 * bank details, statutory identifiers (PAN/Aadhaar/UAN) and address columns are
 * intentionally absent, because the list is served over HTTP as well as to the
 * `/employees` page. `dateOfJoining` is pre-serialised to an ISO string so the
 * React Server Component payload and the JSON body have an identical shape.
 */
export interface EmployeeListRow {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  employeeType: EmployeeType;
  dateOfJoining: string;
  isActive: boolean;
  salaryComponents: Array<{
    id: string;
    name: string;
    type: SalaryComponentType;
    amountPaise: number;
    sortOrder: number;
  }>;
  user: { id: string; email: string | null; role: UserRole } | null;
}

// Query parameters accepted by the employee list. `page`/`limit` are the
// preferred inputs; `offset` is supported for callers that already work in
// offsets and takes precedence when provided.
export interface GetEmployeesParams {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  department?: string;
}

// Aggregate stats for the whole filtered set (not just the current page), so
// the header cards stay correct while a page is being viewed. Money is paise.
export interface EmployeeListSummary {
  totalEmployees: number;
  totalDepartments: number;
  totalGrossPaise: number;
}

// A department and how many employees it currently has, used to build the
// department filter dropdown.
export interface DepartmentCount {
  department: string;
  count: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  offset: number;
  totalPages: number;
  summary: EmployeeListSummary;
  departmentCounts: DepartmentCount[];
}

export type PaginatedEmployees = Paginated<EmployeeListRow>;
