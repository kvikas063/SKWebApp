import { Hono } from "hono";
import { z } from "zod";
import { listEmployees, getEmployeeById, getEmployeeByCode, createEmployee, updateEmployee, deleteEmployee } from "../services/employees.js";
import { logAudit } from "../services/audit.js";

const employeesRouter = new Hono();

const createSchema = z.object({
  employeeCode: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  department: z.string().min(1),
  designation: z.string().min(1),
  employeeType: z.enum(["REGULAR", "PROBATION", "CONTRACT"]),
  taxRegime: z.enum(["OLD", "NEW"]),
  dateOfJoining: z.string().datetime(),
  dateOfBirth: z.string().datetime().optional(),
  phone: z.string().optional(),
  bankAccount: z.string().optional(),
  ifscCode: z.string().optional(),
  panNumber: z.string().optional(),
  aadharNumber: z.string().optional(),
  uanNumber: z.string().optional(),
  esiNumber: z.string().optional(),
  salaryComponents: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(["EARNING", "DEDUCTION"]),
    amount: z.number().positive(),
  })).optional(),
});

const updateSchema = createSchema.partial();

employeesRouter.get("/", async (c) => {
  const params = {
    page: c.req.query("page"),
    limit: c.req.query("limit"),
    offset: c.req.query("offset"),
    search: c.req.query("search"),
    department: c.req.query("department"),
  };

  const result = await listEmployees(params as any);
  return c.json(result);
});

employeesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const employee = await getEmployeeById(id);
  if (!employee) return c.json({ error: "Not found" }, 404);
  return c.json(employee);
});

employeesRouter.get("/code/:code", async (c) => {
  const code = c.req.param("code");
  const employee = await getEmployeeByCode(code);
  if (!employee) return c.json({ error: "Not found" }, 404);
  return c.json(employee);
});

employeesRouter.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const data = {
    ...parsed.data,
    dateOfJoining: new Date(parsed.data.dateOfJoining),
    dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : undefined,
    salaryComponents: parsed.data.salaryComponents || [],
  };

  const employee = await createEmployee(data);

  await logAudit({
    actorId: user.id,
    companyId: user.companyId,
    action: "EMPLOYEE_CREATE",
    entityType: "Employee",
    entityId: employee.id,
    after: { employeeCode: employee.employeeCode, email: employee.email },
  });

  return c.json(employee, 201);
});

employeesRouter.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const before = await getEmployeeById(id);
  if (!before) return c.json({ error: "Not found" }, 404);

  const data = {
    ...parsed.data,
    dateOfJoining: parsed.data.dateOfJoining ? new Date(parsed.data.dateOfJoining) : undefined,
    dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : undefined,
  };

  const employee = await updateEmployee(id, data);

  await logAudit({
    actorId: user.id,
    companyId: user.companyId,
    action: "EMPLOYEE_UPDATE",
    entityType: "Employee",
    entityId: id,
    before: { employeeCode: before.employeeCode, department: before.department, designation: before.designation },
    after: { employeeCode: employee.employeeCode, department: employee.department, designation: employee.designation },
  });

  return c.json(employee);
});

employeesRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const before = await getEmployeeById(id);
  if (!before) return c.json({ error: "Not found" }, 404);

  await deleteEmployee(id);

  await logAudit({
    actorId: user.id,
    companyId: user.companyId,
    action: "EMPLOYEE_DELETE",
    entityType: "Employee",
    entityId: id,
    before: { employeeCode: before.employeeCode, email: before.email },
  });

  return c.json({ ok: true });
});

export { employeesRouter };