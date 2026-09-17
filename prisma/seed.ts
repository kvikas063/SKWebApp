import { PrismaClient, UserRole, EmployeeType, LeaveType } from "@prisma/client";
import bcrypt from "bcryptjs";

function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const company = await prisma.company.upsert({
    where: { id: "demo-company" },
    update: {},
    create: {
      id: "demo-company",
      name: "Demo Technologies Pvt Ltd",
      address: "123 Tech Park, Whitefield",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
      pan: "AABCD1234E",
      tan: "BLRD12345A",
      pfNumber: "KARN1234567000",
      esiNumber: "31001234560000001",
    },
  });

  await prisma.statutoryConfig.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      pfEmployeeRate: 12,
      pfEmployerRate: 12,
      pfWageCeilingPaise: rupeesToPaise(15000),
      esiWageThresholdPaise: rupeesToPaise(21000),
      esiEmployeeRate: 0.75,
      esiEmployerRate: 3.25,
      oldRegimeStdDeductionPaise: rupeesToPaise(50000),
      newRegimeStdDeductionPaise: rupeesToPaise(75000),
      ptSlabsJson: [
        { fromPaise: 0, toPaise: 750000, amountPaise: 0 },
        { fromPaise: 750001, toPaise: 1000000, amountPaise: 17500 },
        { fromPaise: 1000001, toPaise: 1250000, amountPaise: 20000 },
        { fromPaise: 1250001, toPaise: 999999999, amountPaise: 25000 },
      ],
      tdsSlabsNewJson: [
        { fromPaise: 0, toPaise: 30000000, rate: 0 },
        { fromPaise: 30000000, toPaise: 60000000, rate: 5 },
        { fromPaise: 60000000, toPaise: 90000000, rate: 10 },
        { fromPaise: 90000000, toPaise: 120000000, rate: 15 },
        { fromPaise: 120000000, toPaise: 150000000, rate: 20 },
        { fromPaise: 150000000, toPaise: 999999999, rate: 30 },
      ],
      tdsSlabsOldJson: [
        { fromPaise: 0, toPaise: 25000000, rate: 0 },
        { fromPaise: 25000000, toPaise: 50000000, rate: 5 },
        { fromPaise: 50000000, toPaise: 100000000, rate: 20 },
        { fromPaise: 100000000, toPaise: 999999999, rate: 30 },
      ],
    },
  });

  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "HR Admin",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
    },
  });

  const managerHash = await bcrypt.hash("manager123", 12);
  await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: {},
    create: {
      email: "manager@demo.com",
      name: "Rahul Sharma",
      passwordHash: managerHash,
      role: UserRole.MANAGER,
    },
  });

  const leaveTypes = [LeaveType.CASUAL, LeaveType.EARNED, LeaveType.SICK];
  const employeeTypes = [EmployeeType.REGULAR, EmployeeType.PART_TIME, EmployeeType.PROBATION];

  for (const empType of employeeTypes) {
    for (const leaveType of leaveTypes) {
      const entitlements: Record<LeaveType, number> = {
        CASUAL: 12,
        EARNED: 15,
        SICK: 7,
      };
      await prisma.leavePolicy.upsert({
        where: {
          companyId_employeeType_leaveType: {
            companyId: company.id,
            employeeType: empType,
            leaveType,
          },
        },
        update: {},
        create: {
          companyId: company.id,
          employeeType: empType,
          leaveType,
          yearlyEntitlement: entitlements[leaveType],
          allowCarryover: leaveType === LeaveType.EARNED,
          maxCarryoverDays: leaveType === LeaveType.EARNED ? 5 : 0,
          minServiceMonths: 6,
        },
      });
    }
  }

  const holidays2025 = [
    { date: "2025-01-01", name: "New Year's Day" },
    { date: "2025-01-14", name: "Makar Sankranti" },
    { date: "2025-01-26", name: "Republic Day" },
    { date: "2025-02-26", name: "Maha Shivaratri" },
    { date: "2025-03-14", name: "Holi" },
    { date: "2025-03-31", name: "Eid al-Fitr" },
    { date: "2025-04-14", name: "Dr. Ambedkar Jayanti" },
    { date: "2025-04-18", name: "Good Friday" },
    { date: "2025-05-01", name: "May Day / Labour Day" },
    { date: "2025-05-12", name: "Buddha Purnima" },
    { date: "2025-06-07", name: "Eid al-Adha (Bakrid)" },
    { date: "2025-08-15", name: "Independence Day" },
    { date: "2025-08-16", name: "Parsi New Year" },
    { date: "2025-08-27", name: "Ganesh Chaturthi" },
    { date: "2025-09-05", name: "Milad-un-Nabi" },
    { date: "2025-10-02", name: "Gandhi Jayanti" },
    { date: "2025-10-12", name: "Dussehra" },
    { date: "2025-10-20", name: "Diwali" },
    { date: "2025-11-05", name: "Guru Nanak Jayanti" },
    { date: "2025-12-25", name: "Christmas" },
  ];

  const holidays2026 = [
    { date: "2026-01-01", name: "New Year's Day" },
    { date: "2026-01-14", name: "Makar Sankranti" },
    { date: "2026-01-26", name: "Republic Day" },
    { date: "2026-02-15", name: "Maha Shivaratri" },
    { date: "2026-03-04", name: "Holi" },
    { date: "2026-03-20", name: "Eid al-Fitr" },
    { date: "2026-04-03", name: "Good Friday" },
    { date: "2026-04-14", name: "Dr. Ambedkar Jayanti" },
    { date: "2026-05-01", name: "May Day / Labour Day" },
    { date: "2026-05-12", name: "Buddha Purnima" },
    { date: "2026-05-27", name: "Eid al-Adha (Bakrid)" },
    { date: "2026-08-15", name: "Independence Day" },
    { date: "2026-08-16", name: "Ganesh Chaturthi" },
    { date: "2026-08-26", name: "Milad-un-Nabi" },
    { date: "2026-10-02", name: "Gandhi Jayanti" },
    { date: "2026-10-19", name: "Dussehra" },
    { date: "2026-11-08", name: "Diwali" },
    { date: "2026-11-24", name: "Guru Nanak Jayanti" },
    { date: "2026-12-25", name: "Christmas" },
  ];

  const allHolidays = [...holidays2025, ...holidays2026];

  for (const h of allHolidays) {
    await prisma.holiday.upsert({
      where: { companyId_date: { companyId: company.id, date: new Date(h.date) } },
      update: { name: h.name },
      create: { companyId: company.id, date: new Date(h.date), name: h.name },
    });
  }

  const employees = [
    {
      code: "EMP001",
      firstName: "Rahul",
      lastName: "Sharma",
      email: "rahul@demo.com",
      type: EmployeeType.REGULAR,
      designation: "Senior Developer",
      department: "Engineering",
      basic: 35000,
      hra: 14000,
      special: 10000,
      conveyance: 1600,
      bankAccountNo: "1234567890",
      bankIfsc: "HDFC0001234",
      pan: "ABCDE1234F",
      uan: "100123456789",
    },
    {
      code: "EMP002",
      firstName: "Priya",
      lastName: "Patel",
      email: "priya@demo.com",
      type: EmployeeType.REGULAR,
      designation: "HR Manager",
      department: "Human Resources",
      basic: 40000,
      hra: 16000,
      special: 12000,
      conveyance: 1600,
      bankAccountNo: "9876543210",
      bankIfsc: "ICIC0001234",
      pan: "FGHIJ5678K",
      uan: "100987654321",
    },
    {
      code: "EMP003",
      firstName: "Amit",
      lastName: "Kumar",
      email: "amit@demo.com",
      type: EmployeeType.PROBATION,
      designation: "Junior Developer",
      department: "Engineering",
      basic: 20000,
      hra: 8000,
      special: 5000,
      conveyance: 1600,
      bankAccountNo: "5555666677",
      bankIfsc: "SBIN0001234",
      pan: "KLMNO9012P",
      uan: "100555666777",
    },
    {
      code: "EMP004",
      firstName: "Sneha",
      lastName: "Reddy",
      email: "sneha@demo.com",
      type: EmployeeType.REGULAR,
      designation: "Tech Lead",
      department: "Engineering",
      basic: 50000,
      hra: 20000,
      special: 15000,
      conveyance: 1600,
      bankAccountNo: "1111222233",
      bankIfsc: "HDFC0005678",
      pan: "PQRST5678U",
      uan: "100111222333",
    },
    {
      code: "EMP005",
      firstName: "Vikram",
      lastName: "Singh",
      email: "vikram@demo.com",
      type: EmployeeType.REGULAR,
      designation: "Backend Developer",
      department: "Engineering",
      basic: 32000,
      hra: 12800,
      special: 9000,
      conveyance: 1600,
      bankAccountNo: "2222333344",
      bankIfsc: "ICIC0005678",
      pan: "VWXYZ9012A",
      uan: "100222333444",
    },
    {
      code: "EMP006",
      firstName: "Anita",
      lastName: "Joshi",
      email: "anita@demo.com",
      type: EmployeeType.REGULAR,
      designation: "QA Engineer",
      department: "Quality Assurance",
      basic: 28000,
      hra: 11200,
      special: 8000,
      conveyance: 1600,
      bankAccountNo: "3333444455",
      bankIfsc: "SBIN0005678",
      pan: "BCDEF2345G",
      uan: "100333444555",
    },
    {
      code: "EMP007",
      firstName: "Rohit",
      lastName: "Mehta",
      email: "rohit@demo.com",
      type: EmployeeType.PROBATION,
      designation: "QA Trainee",
      department: "Quality Assurance",
      basic: 18000,
      hra: 7200,
      special: 4500,
      conveyance: 1600,
      bankAccountNo: "4444555566",
      bankIfsc: "HDFC0009012",
      pan: "GHIJK6789L",
      uan: "100444555666",
    },
    {
      code: "EMP008",
      firstName: "Kavita",
      lastName: "Nair",
      email: "kavita@demo.com",
      type: EmployeeType.REGULAR,
      designation: "Sales Manager",
      department: "Sales",
      basic: 38000,
      hra: 15200,
      special: 11000,
      conveyance: 1600,
      bankAccountNo: "5555666677",
      bankIfsc: "ICIC0009012",
      pan: "MNOPQ3456R",
      uan: "100555666777",
    },
    {
      code: "EMP009",
      firstName: "Arjun",
      lastName: "Gupta",
      email: "arjun@demo.com",
      type: EmployeeType.REGULAR,
      designation: "Sales Executive",
      department: "Sales",
      basic: 25000,
      hra: 10000,
      special: 7000,
      conveyance: 1600,
      bankAccountNo: "6666777788",
      bankIfsc: "SBIN0009012",
      pan: "STUVW7890X",
      uan: "100666777888",
    },
    {
      code: "EMP010",
      firstName: "Pooja",
      lastName: "Verma",
      email: "pooja@demo.com",
      type: EmployeeType.REGULAR,
      designation: "Marketing Manager",
      department: "Marketing",
      basic: 36000,
      hra: 14400,
      special: 10500,
      conveyance: 1600,
      bankAccountNo: "7777888899",
      bankIfsc: "HDFC0003456",
      pan: "YZABC1234D",
      uan: "100777888999",
    },
    {
      code: "EMP011",
      firstName: "Karan",
      lastName: "Bhatia",
      email: "karan@demo.com",
      type: EmployeeType.REGULAR,
      designation: "Content Strategist",
      department: "Marketing",
      basic: 27000,
      hra: 10800,
      special: 7500,
      conveyance: 1600,
      bankAccountNo: "8888999900",
      bankIfsc: "ICIC0003456",
      pan: "DEFGH5678I",
      uan: "100888999000",
    },
    {
      code: "EMP012",
      firstName: "Meera",
      lastName: "Iyer",
      email: "meera@demo.com",
      type: EmployeeType.REGULAR,
      designation: "Finance Manager",
      department: "Finance",
      basic: 45000,
      hra: 18000,
      special: 13000,
      conveyance: 1600,
      bankAccountNo: "9999000011",
      bankIfsc: "SBIN0003456",
      pan: "JKLMN9012O",
      uan: "100999000111",
    },
    {
      code: "EMP013",
      firstName: "Suresh",
      lastName: "Pillai",
      email: "suresh@demo.com",
      type: EmployeeType.REGULAR,
      designation: "Accountant",
      department: "Finance",
      basic: 30000,
      hra: 12000,
      special: 8500,
      conveyance: 1600,
      bankAccountNo: "1010101010",
      bankIfsc: "HDFC0007890",
      pan: "PQRST3456U",
      uan: "100101010101",
    },
    {
      code: "EMP014",
      firstName: "Divya",
      lastName: "Chopra",
      email: "divya@demo.com",
      type: EmployeeType.PART_TIME,
      designation: "Operations Executive",
      department: "Operations",
      basic: 18000,
      hra: 7200,
      special: 4500,
      conveyance: 1600,
      bankAccountNo: "2020202020",
      bankIfsc: "ICIC0007890",
      pan: "VWXYZ7890A",
      uan: "100202020202",
    },
    {
      code: "EMP015",
      firstName: "Nikhil",
      lastName: "Rao",
      email: "nikhil@demo.com",
      type: EmployeeType.REGULAR,
      designation: "HR Executive",
      department: "Human Resources",
      basic: 24000,
      hra: 9600,
      special: 6800,
      conveyance: 1600,
      bankAccountNo: "3030303030",
      bankIfsc: "SBIN0007890",
      pan: "BCDEF9012G",
      uan: "100303030303",
    },
  ];

  // Generate 50 more employees (EMP016–EMP065) to fill the roster
  const extraFirstNames = [
    "Aditya", "Riya", "Karan", "Meera", "Nikhil", "Pooja", "Sandeep", "Tanvi", "Varun", "Yash",
    "Aishwarya", "Dev", "Ishaan", "Jaya", "Kunal", "Lavanya", "Manish", "Nandini", "Omkar", "Pranav",
    "Qadir", "Rakesh", "Snehal", "Tushar", "Uday", "Vidya", "Waman", "Yamini", "Zara", "Aarav",
    "Bhavna", "Chirag", "Deepa", "Eshaan", "Falguni", "Gautam", "Harini", "Inder", "Jhanvi", "Karthik",
    "Lalit", "Mihir", "Neha", "Ojas", "Parul", "Raghav", "Sanya", "Tarun", "Urvi", "Vishal",
  ];
  const extraLastNames = [
    "Iyer", "Bose", "Kapoor", "Reddy", "Patel", "Nair", "Menon", "Joshi", "Chatterjee", "Banerjee",
    "Gupta", "Khan", "Mukherjee", "Pillai", "Rao", "Saxena", "Tiwari", "Verma", "Walia", "Yadav",
    "Zaveri", "Acharya", "Bhatt", "Chauhan", "Desai", "Eswaran", "Fernandes", "Gill", "Hegde", "Iyengar",
    "Jain", "Khatri", "Lal", "Malhotra", "Naidu", "Oberoi", "Pandit", "Qureshi", "Rastogi", "Sengupta",
    "Trivedi", "Upadhyay", "Venkatesh", "Wadhwa", "Xavier", "Zutshi", "Agarwal", "Bajaj", "Chandra", "Dewan",
  ];
  const departmentsList = ["Engineering", "Sales", "Marketing", "Operations", "Finance", "HR", "QA", "Customer Support"];
  const designationsList: Record<string, string[]> = {
    Engineering: ["Software Engineer", "Senior Engineer", "Tech Lead", "QA Engineer", "DevOps Engineer", "Frontend Developer", "Backend Developer"],
    Sales: ["Sales Executive", "Account Manager", "Sales Lead", "Regional Manager", "BDE"],
    Marketing: ["Marketing Executive", "Content Writer", "SEO Specialist", "Brand Manager", "Marketing Lead"],
    Operations: ["Operations Executive", "Operations Manager", "Logistics Lead"],
    Finance: ["Accountant", "Finance Analyst", "Finance Manager", "Auditor"],
    HR: ["HR Executive", "Recruiter", "HR Manager", "Talent Acquisition"],
    QA: ["QA Engineer", "QA Lead", "Automation Tester"],
    "Customer Support": ["Support Executive", "Support Lead", "Customer Success Manager"],
  };
  const types = [EmployeeType.REGULAR, EmployeeType.REGULAR, EmployeeType.REGULAR, EmployeeType.PROBATION, EmployeeType.PART_TIME];
  const ifscPrefixes = ["HDFC", "ICIC", "SBIN", "AXIS", "KOTAK", "YESB", "IDFB", "PUNB"];

  for (let i = 0; i < 50; i++) {
    const idx = 15 + i; // 1-based after EMP015
    const code = `EMP${String(idx + 1).padStart(3, "0")}`;
    const firstName = extraFirstNames[i % extraFirstNames.length];
    const lastName = extraLastNames[i % extraLastNames.length];
    const department = departmentsList[i % departmentsList.length];
    const designation = designationsList[department][i % designationsList[department].length];
    const type = types[i % types.length];
    const basic = 25000 + ((i * 1373) % 40000); // deterministic spread
    const hra = Math.round(basic * 0.4);
    const special = Math.round(basic * 0.25);
    const conveyance = 1600;
    const accountNum = String(4000000000 + i * 7919).padStart(10, "0").slice(-10);
    const ifsc = `${ifscPrefixes[i % ifscPrefixes.length]}00${String(1000 + (i * 47) % 8999).padStart(4, "0")}`;
    const pan = `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(66 + ((i * 3) % 26))}${String.fromCharCode(67 + ((i * 7) % 26))}${String.fromCharCode(68 + ((i * 11) % 26))}${String.fromCharCode(69 + ((i * 13) % 26))}${String(1000 + (i * 23) % 8999)}${String.fromCharCode(65 + ((i * 17) % 26))}`;
    const uan = `100${String(400000000 + i * 9973).padStart(9, "0").slice(-9)}`;
    employees.push({
      code,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@demo.com`,
      type,
      designation,
      department,
      basic,
      hra,
      special,
      conveyance,
      bankAccountNo: accountNum,
      bankIfsc: ifsc,
      pan,
      uan,
    });
  }

  const year = new Date().getFullYear();
  const empHash = await bcrypt.hash("employee123", 12);

  for (const emp of employees) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        name: `${emp.firstName} ${emp.lastName}`,
        passwordHash: empHash,
        role: UserRole.EMPLOYEE,
      },
    });

    const employee = await prisma.employee.upsert({
      where: { companyId_employeeCode: { companyId: company.id, employeeCode: emp.code } },
      update: {},
      create: {
        companyId: company.id,
        userId: user.id,
        employeeCode: emp.code,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        dateOfJoining: new Date("2024-04-01"),
        employeeType: emp.type,
        designation: emp.designation,
        department: emp.department,
        bankName: "HDFC Bank",
        bankAccountNo: emp.bankAccountNo,
        bankIfsc: emp.bankIfsc,
        pan: emp.pan,
        uan: emp.uan,
      },
    });

    const components = [
      { name: "Basic", amountPaise: rupeesToPaise(emp.basic), sortOrder: 1 },
      { name: "HRA", amountPaise: rupeesToPaise(emp.hra), sortOrder: 2 },
      { name: "Special Allowance", amountPaise: rupeesToPaise(emp.special), sortOrder: 3 },
      { name: "Conveyance", amountPaise: rupeesToPaise(emp.conveyance), sortOrder: 4 },
    ];

    for (const comp of components) {
      const existing = await prisma.salaryComponent.findFirst({
        where: { employeeId: employee.id, name: comp.name },
      });
      if (!existing) {
        await prisma.salaryComponent.create({
          data: { employeeId: employee.id, type: "EARNING", ...comp },
        });
      }
    }

    for (const leaveType of leaveTypes) {
      const policy = await prisma.leavePolicy.findUnique({
        where: {
          companyId_employeeType_leaveType: {
            companyId: company.id,
            employeeType: emp.type,
            leaveType,
          },
        },
      });
      if (policy) {
        await prisma.leaveBalance.upsert({
          where: {
            employeeId_leaveType_year: { employeeId: employee.id, leaveType, year },
          },
          update: {},
          create: {
            employeeId: employee.id,
            leaveType,
            year,
            entitled: policy.yearlyEntitlement,
            carriedOver: 0,
            used: 0,
          },
        });
      }
    }
  }

  // ─── Manager hierarchy ──────────────────────────────────────────────────
  console.log("Seeding manager hierarchy...");

  // Map: employeeCode -> managerCode
  const managerMap: Record<string, string> = {
    EMP004: "EMP001",  // Sneha (Tech Lead) reports to Rahul
    EMP005: "EMP004",  // Vikram (Backend Dev) reports to Sneha
    EMP003: "EMP005",  // Amit (Junior Dev) reports to Vikram
    EMP006: "EMP001",  // Anita (QA) reports to Rahul
    EMP007: "EMP006",  // Rohit (QA Trainee) reports to Anita
    EMP009: "EMP008",  // Arjun (Sales Exec) reports to Kavita
    EMP011: "EMP010",  // Karan (Content) reports to Pooja
    EMP013: "EMP012",  // Suresh (Accountant) reports to Meera
    EMP015: "EMP002",  // Nikhil (HR Exec) reports to Priya
  };

  // Assign 50 new employees to managers based on department
  const deptToManager: Record<string, string> = {
    Engineering: "EMP001",
    QA: "EMP006",
    Sales: "EMP008",
    Marketing: "EMP010",
    Finance: "EMP012",
    HR: "EMP002",
    Operations: "EMP014",
    "Customer Support": "EMP009",
  };
  for (let i = 16; i <= 65; i++) {
    const code = `EMP${String(i).padStart(3, "0")}`;
    const newEmp = employees.find((e) => e.code === code);
    if (!newEmp) continue;
    const mgrCode = deptToManager[newEmp.department] || "EMP001";
    if (mgrCode !== code) managerMap[code] = mgrCode;
  }

  for (const [empCode, mgrCode] of Object.entries(managerMap)) {
    const emp = await prisma.employee.findUnique({ where: { companyId_employeeCode: { companyId: company.id, employeeCode: empCode } } });
    const mgr = await prisma.employee.findUnique({ where: { companyId_employeeCode: { companyId: company.id, employeeCode: mgrCode } } });
    if (emp && mgr) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { managerId: mgr.id },
      });
    }
  }

  // ─── Leave requests (mix of PENDING, APPROVED, REJECTED across recent months) ──
  const adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
  const leaveReasons = [
    "Family function",
    "Not feeling well, need rest",
    "Personal work",
    "Doctor appointment",
    "Wedding to attend",
    "Vacation with family",
    "Medical checkup",
    "Child's school event",
    "Sibling's engagement ceremony",
    "Festival celebration",
  ];
  const leaveRequestsToCreate: {
    employeeId: string;
    leaveType: typeof leaveTypes[number];
    startDate: Date;
    endDate: Date;
    days: number;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reviewedBy?: string;
    reviewedAt?: Date;
    reviewNote?: string;
  }[] = [];

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const employeeRecord = await prisma.employee.findUnique({
      where: { companyId_employeeCode: { companyId: company.id, employeeCode: emp.code } },
    });
    if (!employeeRecord) continue;

    // Create 1-3 leave requests per employee
    const numRequests = 1 + (i % 3);
    for (let r = 0; r < numRequests; r++) {
      const monthsAgo = (i * 7 + r * 31) % 6; // spread across last 6 months
      const startMonth = new Date().getMonth() - monthsAgo;
      const startYear = new Date().getFullYear();
      const dayOfMonth = 1 + ((i * 11 + r * 17) % 27);
      const startDate = new Date(startYear, startMonth, dayOfMonth);
      const numDays = 1 + ((i + r) % 5);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + numDays - 1);

      const lt = leaveTypes[(i + r) % leaveTypes.length];
      const reason = leaveReasons[(i * 3 + r) % leaveReasons.length];

      // Distribute: 50% PENDING, 30% APPROVED, 20% REJECTED for visibility
      const statusRoll = (i * 13 + r * 7) % 10;
      const status: "PENDING" | "APPROVED" | "REJECTED" =
        statusRoll < 5 ? "PENDING" : statusRoll < 8 ? "APPROVED" : "REJECTED";

      leaveRequestsToCreate.push({
        employeeId: employeeRecord.id,
        leaveType: lt,
        startDate,
        endDate,
        days: numDays,
        reason,
        status,
        ...(status !== "PENDING"
          ? {
              reviewedBy: adminUser?.id ?? user.id,
              reviewedAt: new Date(startDate.getTime() - 86400000),
              reviewNote: status === "APPROVED" ? "Approved. Enjoy!" : "Insufficient coverage during this period.",
            }
          : {}),
      });
    }
  }

  // Clear existing leave requests for idempotency
  await prisma.leaveRequest.deleteMany({});
  for (const lr of leaveRequestsToCreate) {
    await prisma.leaveRequest.create({ data: lr });
  }
  console.log(`Seeded ${leaveRequestsToCreate.length} leave requests`);

  // ─── Sample announcement ────────────────────────────────────────────────
  await prisma.announcement.upsert({
    where: { id: "welcome-announcement" },
    update: {},
    create: {
      id: "welcome-announcement",
      companyId: company.id,
      title: "Welcome to HRMS Suite",
      body: "Your all-in-one HR platform is live. Use the sidebar to navigate employees, payroll, and the new org chart. Reach out to your HR admin for any questions.",
      audience: "ALL",
      pinned: true,
      authorId: admin.id,
    },
  });

  // ─── Attendance seed ────────────────────────────────────────────────────
  console.log("Seeding attendance records...");

  const allEmployees = await prisma.employee.findMany({
    where: { companyId: company.id },
    select: { id: true, employeeCode: true, firstName: true },
  });

  const holidayDates = new Set(
    (await prisma.holiday.findMany({ where: { companyId: company.id } })).map(
      (h) => h.date.toISOString().slice(0, 10)
    )
  );

  // Deterministic pseudo-random based on employee + date
  function seedRand(seedStr: string): number {
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 1000) / 1000;
  }

  function isWeekend(d: Date) {
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  function dateOnly(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // Generate attendance for the last 90 days (covers current + previous months)
  const today = dateOnly(new Date());
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 89);

  // Per-employee attendance status profile (mix of mostly present, some patterns)
  const employeeProfiles: Record<string, { presentRate: number; halfDayRate: number; lopRate: number; lateRate: number }> = {
    EMP001: { presentRate: 0.95, halfDayRate: 0.04, lopRate: 0.01, lateRate: 0.25 },
    EMP002: { presentRate: 0.97, halfDayRate: 0.02, lopRate: 0.01, lateRate: 0.10 },
    EMP003: { presentRate: 0.88, halfDayRate: 0.06, lopRate: 0.06, lateRate: 0.35 },
    EMP004: { presentRate: 0.96, halfDayRate: 0.03, lopRate: 0.01, lateRate: 0.15 },
    EMP005: { presentRate: 0.92, halfDayRate: 0.05, lopRate: 0.03, lateRate: 0.20 },
    EMP006: { presentRate: 0.94, halfDayRate: 0.04, lopRate: 0.02, lateRate: 0.18 },
    EMP007: { presentRate: 0.85, halfDayRate: 0.08, lopRate: 0.07, lateRate: 0.40 },
    EMP008: { presentRate: 0.93, halfDayRate: 0.04, lopRate: 0.03, lateRate: 0.20 },
    EMP009: { presentRate: 0.90, halfDayRate: 0.05, lopRate: 0.05, lateRate: 0.25 },
    EMP010: { presentRate: 0.95, halfDayRate: 0.03, lopRate: 0.02, lateRate: 0.12 },
    EMP011: { presentRate: 0.91, halfDayRate: 0.05, lopRate: 0.04, lateRate: 0.22 },
    EMP012: { presentRate: 0.97, halfDayRate: 0.02, lopRate: 0.01, lateRate: 0.08 },
    EMP013: { presentRate: 0.93, halfDayRate: 0.04, lopRate: 0.03, lateRate: 0.15 },
    EMP014: { presentRate: 0.89, halfDayRate: 0.06, lopRate: 0.05, lateRate: 0.30 },
    EMP015: { presentRate: 0.94, halfDayRate: 0.04, lopRate: 0.02, lateRate: 0.16 },
  };

  let totalCreated = 0;
  for (const emp of allEmployees) {
    const profile = employeeProfiles[emp.employeeCode] ?? {
      presentRate: 0.92,
      halfDayRate: 0.04,
      lopRate: 0.04,
      lateRate: 0.20,
    };

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().slice(0, 10);
      const isFuture = d.getTime() > today.getTime();

      if (isFuture) continue;
      if (isWeekend(d)) continue;

      if (holidayDates.has(dateKey)) {
        await prisma.attendance.upsert({
          where: { employeeId_date: { employeeId: emp.id, date: new Date(dateKey) } },
          update: {},
          create: {
            employeeId: emp.id,
            date: new Date(dateKey),
            status: "HOLIDAY",
          },
        });
        totalCreated++;
        continue;
      }

      const rand = seedRand(`${emp.id}-${dateKey}`);
      let status: "PRESENT" | "HALF_DAY" | "LOP" | "ABSENT" = "PRESENT";
      let workedMinutes: number | null = 480;
      let punchIn: Date | null = null;
      let punchOut: Date | null = null;

      if (rand < profile.lopRate) {
        status = "LOP";
        workedMinutes = 0;
      } else if (rand < profile.lopRate + profile.halfDayRate) {
        status = "HALF_DAY";
        workedMinutes = 240;
        punchIn = new Date(d);
        punchIn.setHours(9, Math.floor(seedRand(dateKey + "in") * 30), 0, 0);
        punchOut = new Date(d);
        punchOut.setHours(13, 30, 0, 0);
      } else {
        status = "PRESENT";
        workedMinutes = 480;
        const inHour = 9;
        const inMin = Math.floor(seedRand(dateKey + "in") * 60);
        punchIn = new Date(d);
        punchIn.setHours(inHour, inMin, 0, 0);
        const outHour = 18;
        const outMin = 30 + Math.floor(seedRand(dateKey + "out") * 60);
        punchOut = new Date(d);
        punchOut.setHours(outHour, outMin, 0, 0);
        if (inHour === 9 && inMin > 30 && seedRand(dateKey + "late") < profile.lateRate) {
        }
      }

      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: emp.id, date: new Date(dateKey) } },
        update: {},
        create: {
          employeeId: emp.id,
          date: new Date(dateKey),
          punchIn,
          punchOut,
          workedMinutes,
          status,
        },
      });
      totalCreated++;
    }
  }

  console.log(`Seeded ${totalCreated} attendance records`);

  // ─── Payroll seed (previous 3 months) ─────────────────────────────────────
  console.log("Seeding payroll runs and payslips...");

  const allEmployeesForPayroll = await prisma.employee.findMany({
    where: { companyId: company.id, isActive: true },
    include: {
      salaryComponents: { where: { isActive: true } },
    },
  });

  const statutory = await prisma.statutoryConfig.findUnique({
    where: { companyId: company.id },
  });

  if (!statutory) {
    throw new Error("Statutory config not found");
  }

  function calcPF(basicPaise: number): { employee: number; employer: number } {
    if (basicPaise === 0) return { employee: 0, employer: 0 };
    const pfWage = Math.min(basicPaise, statutory!.pfWageCeilingPaise);
    return {
      employee: Math.round((pfWage * statutory!.pfEmployeeRate) / 100),
      employer: Math.round((pfWage * statutory!.pfEmployerRate) / 100),
    };
  }

  function calcESI(grossPaise: number): { employee: number; employer: number } {
    if (grossPaise > statutory!.esiWageThresholdPaise) {
      return { employee: 0, employer: 0 };
    }
    return {
      employee: Math.round((grossPaise * statutory!.esiEmployeeRate) / 100),
      employer: Math.round((grossPaise * statutory!.esiEmployerRate) / 100),
    };
  }

  function calcPT(grossPaise: number): number {
    const slabs = (statutory!.ptSlabsJson as Array<{ fromPaise: number; toPaise: number; amountPaise: number }>) || [];
    for (const slab of slabs) {
      if (grossPaise >= slab.fromPaise && grossPaise <= slab.toPaise) {
        return slab.amountPaise;
      }
    }
    return 0;
  }

  function calcTDS(annualGrossPaise: number, taxRegime: string): number {
    const stdDeduction = taxRegime === "OLD"
      ? statutory!.oldRegimeStdDeductionPaise
      : statutory!.newRegimeStdDeductionPaise;
    const taxable = Math.max(0, annualGrossPaise - stdDeduction);
    const slabs = [
      { fromPaise: 0, toPaise: 30000000, rate: 0 },
      { fromPaise: 30000001, toPaise: 60000000, rate: 5 },
      { fromPaise: 60000001, toPaise: 90000000, rate: 10 },
      { fromPaise: 90000001, toPaise: 120000000, rate: 15 },
      { fromPaise: 120000001, toPaise: 150000000, rate: 20 },
      { fromPaise: 150000001, toPaise: Infinity, rate: 30 },
    ];
    let tax = 0;
    for (const slab of slabs) {
      if (taxable <= slab.fromPaise) break;
      const taxableInSlab = Math.min(taxable, slab.toPaise) - slab.fromPaise;
      if (taxableInSlab > 0) {
        tax += Math.round((taxableInSlab * slab.rate) / 100);
      }
    }
    return Math.round(tax / 12);
  }

  const payrollMonths: { year: number; month: number }[] = [];
  const start = new Date(2025, 0, 1);
  const end = new Date();
  end.setDate(1);
  end.setMonth(end.getMonth() - 1);
  for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
    payrollMonths.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  let payrollRunsCreated = 0;
  let payrollSlipsCreated = 0;

  for (const { year, month } of payrollMonths) {
    const totalDays = new Date(year, month, 0).getDate();
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const attendanceByEmployee: Record<string, { present: number; half: number; lop: number }> = {};
    const monthlyAttendance = await prisma.attendance.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
    });
    for (const a of monthlyAttendance) {
      if (!attendanceByEmployee[a.employeeId]) {
        attendanceByEmployee[a.employeeId] = { present: 0, half: 0, lop: 0 };
      }
      if (a.status === "PRESENT") attendanceByEmployee[a.employeeId].present++;
      else if (a.status === "HALF_DAY") attendanceByEmployee[a.employeeId].half++;
      else if (a.status === "LOP" || a.status === "ABSENT") attendanceByEmployee[a.employeeId].lop++;
    }

    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;

    const slipsToCreate: Array<{
      employeeId: string;
      earnings: Array<{ name: string; amountPaise: number }>;
      deductions: Array<{ name: string; amountPaise: number }>;
      gross: number;
      net: number;
      totalDed: number;
      daysPresent: number;
      daysAbsent: number;
      lopDays: number;
      paidDays: number;
      statutory: {
        pfEmployeePaise: number;
        pfEmployerPaise: number;
        esiEmployeePaise: number;
        esiEmployerPaise: number;
        ptPaise: number;
        tdsPaise: number;
      };
    }> = [];

    for (const emp of allEmployeesForPayroll) {
      const components = emp.salaryComponents.filter((c) => c.isActive);
      const earningsComponents = components.filter((c) => c.type === "EARNING");
      const att = attendanceByEmployee[emp.id] || { present: 0, half: 0, lop: 0 };
      const lopDays = Math.min(att.lop, 3) + (att.half * 0.5);
      const paidDays = totalDays - lopDays;
      const daysPresent = att.present + att.half;
      const daysAbsent = att.lop;

      const earnings = earningsComponents.map((c) => ({
        name: c.name,
        amountPaise: Math.round((c.amountPaise * paidDays) / totalDays),
      }));
      const gross = earnings.reduce((s, e) => s + e.amountPaise, 0);
      const basic = earnings.find((e) => e.name.toLowerCase().includes("basic"))?.amountPaise ?? 0;

      const pf = calcPF(basic);
      const esi = calcESI(gross);
      const pt = calcPT(gross);
      const annualGross = gross * 12;
      const tds = calcTDS(annualGross, emp.taxRegime);

      const deductions: Array<{ name: string; amountPaise: number }> = [];
      if (pf.employee > 0) deductions.push({ name: "PF (Employee)", amountPaise: pf.employee });
      if (esi.employee > 0) deductions.push({ name: "ESI (Employee)", amountPaise: esi.employee });
      if (pt > 0) deductions.push({ name: "Professional Tax", amountPaise: pt });
      if (tds > 0) deductions.push({ name: "TDS", amountPaise: tds });

      const totalDed = deductions.reduce((s, d) => s + d.amountPaise, 0);
      const net = gross - totalDed;

      slipsToCreate.push({
        employeeId: emp.id,
        earnings,
        deductions,
        gross,
        net,
        totalDed,
        daysPresent,
        daysAbsent,
        lopDays,
        paidDays,
        statutory: {
          pfEmployeePaise: pf.employee,
          pfEmployerPaise: pf.employer,
          esiEmployeePaise: esi.employee,
          esiEmployerPaise: esi.employer,
          ptPaise: pt,
          tdsPaise: tds,
        },
      });

      totalGross += gross;
      totalNet += net;
      totalDeductions += totalDed;
    }

    const payRun = await prisma.payRun.upsert({
      where: { companyId_year_month: { companyId: company.id, year, month } },
      update: {
        status: "FINALIZED",
        totalGrossPaise: totalGross,
        totalNetPaise: totalNet,
        totalDeductionsPaise: totalDeductions,
        finalizedAt: new Date(year, month - 1, totalDays, 18, 0, 0),
        finalizedById: admin.id,
      },
      create: {
        companyId: company.id,
        year,
        month,
        status: "FINALIZED",
        totalGrossPaise: totalGross,
        totalNetPaise: totalNet,
        totalDeductionsPaise: totalDeductions,
        openedAt: new Date(year, month - 1, 1, 10, 0, 0),
        openedById: admin.id,
        finalizedAt: new Date(year, month - 1, totalDays, 18, 0, 0),
        finalizedById: admin.id,
      },
    });
    payrollRunsCreated++;

    for (const slip of slipsToCreate) {
      await prisma.paySlip.upsert({
        where: { payRunId_employeeId: { payRunId: payRun.id, employeeId: slip.employeeId } },
        update: {
          grossPaise: slip.gross,
          netPaise: slip.net,
          totalDeductionsPaise: slip.totalDed,
          earningsJson: slip.earnings as Prisma.InputJsonValue,
          deductionsJson: slip.deductions as Prisma.InputJsonValue,
          statutoryJson: slip.statutory as Prisma.InputJsonValue,
          daysPresent: slip.daysPresent,
          daysAbsent: slip.daysAbsent,
          lopDays: slip.lopDays,
          paidDays: slip.paidDays,
        },
        create: {
          payRunId: payRun.id,
          employeeId: slip.employeeId,
          grossPaise: slip.gross,
          netPaise: slip.net,
          totalDeductionsPaise: slip.totalDed,
          earningsJson: slip.earnings as Prisma.InputJsonValue,
          deductionsJson: slip.deductions as Prisma.InputJsonValue,
          statutoryJson: slip.statutory as Prisma.InputJsonValue,
          daysPresent: slip.daysPresent,
          daysAbsent: slip.daysAbsent,
          lopDays: slip.lopDays,
          paidDays: slip.paidDays,
        },
      });
      payrollSlipsCreated++;
    }
  }

  console.log(`Seeded ${payrollRunsCreated} pay runs and ${payrollSlipsCreated} payslips`);

// ─── Projects
  const empRahul = await prisma.employee.findUnique({ where: { companyId_employeeCode: { companyId: company.id, employeeCode: "EMP001" } } });
  const empPriya = await prisma.employee.findUnique({ where: { companyId_employeeCode: {companyId: company.id, employeeCode: "EMP002" } } });
  const empAmit = await prisma.employee.findUnique({ where: { companyId_employeeCode: {companyId: company.id, employeeCode: "EMP003" } } });

  const demoProjects = [
    {
      projectId: "PRJ-2026-001",
      name: "Skyline Tower",
      description: "45-story commercial tower in downtown Bengaluru",
      status: "IN_PROGRESS" as any,
      priority: "HIGH" as any,
      location: "Whitefield, Bengaluru",
      budgetPaise: BigInt(5000000000),
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-12-31"),
      managerId: empPriya?.id,
    },
    {
      projectId: "PRJ-2026-002",
      name: "Riverside Residential",
      description: "120-unit gated community on the Mysore Road",
      status: "PLANNING" as any,
      priority: "MEDIUM" as any,
      location: "Mysore Road, Bengaluru",
      budgetPaise: BigInt(3500000000),
      startDate: new Date("2026-03-01"),
      endDate: new Date("2027-06-30"),
      managerId: empPriya?.id,
    },
    {
      projectId: "PRJ-2026-003",
      name: "Warehouse Expansion",
      description: "Cold storage warehouse expansion for FMCG distributor",
      status: "IN_PROGRESS" as any,
      priority: "LOW" as any,
      location: "Dabaspete Industrial Area",
      budgetPaise: BigInt(1200000000),
      startDate: new Date("2026-02-10"),
      endDate: new Date("2026-09-30"),
      managerId: empRahul?.id,
    },
    {
      projectId: "PRJ-2026-004",
      name: "Highway Bridge",
      description: "NH-44 flyover construction over river crossing",
      status: "ON_HOLD" as any,
      priority: "CRITICAL" as any,
      location: "NH-44, Tamil Nadu",
      budgetPaise: BigInt(8000000000),
      startDate: new Date("2026-04-01"),
      endDate: new Date("2027-03-31"),
      managerId: empPriya?.id,
    },
    {
      projectId: "PRJ-2026-005",
      name: "Mall Renovation",
      description: "Legacy mall facelift and tenant onboarding",
      status: "COMPLETED" as any,
      priority: "MEDIUM" as any,
      location: "Koramangala, Bengaluru",
      budgetPaise: BigInt(900000000),
      startDate: new Date("2025-06-01"),
      endDate: new Date("2026-01-31"),
      managerId: empAmit?.id,
    },
  ];

  let projectsCreated = 0;
  for (const p of demoProjects) {
    const exists = await prisma.project.findUnique({ where: { projectId: p.projectId } });
    if (exists) continue;
    await prisma.project.create({
      data: {
        projectId: p.projectId,
        name: p.name,
        description: p.description,
        status: p.status,
        priority: p.priority,
        location: p.location,
        budgetPaise: p.budgetPaise,
        startDate: p.startDate,
        endDate: p.endDate,
        managerId: p.managerId,
        companyId: company.id,
      },
    });
    projectsCreated++;
  }
  console.log(`Seeded ${projectsCreated} projects`);

  console.log("Seed complete!");
  console.log("Admin login: admin@demo.com / admin123");
  console.log("Employee login: rahul@demo.com / employee123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
