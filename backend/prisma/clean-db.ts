import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");

  await prisma.notification.deleteMany();
  console.log("Deleted notifications");

  await prisma.account.deleteMany();
  console.log("Deleted accounts");

  await prisma.session.deleteMany();
  console.log("Deleted sessions");

  await prisma.announcement.deleteMany();
  console.log("Deleted announcements");

  await prisma.auditLog.deleteMany();
  console.log("Deleted audit logs");

  await prisma.emailLog.deleteMany();
  console.log("Deleted email logs");

  await prisma.employeeDocument.deleteMany();
  console.log("Deleted employee documents");

  await prisma.salaryComponent.deleteMany();
  console.log("Deleted salary components");

  await prisma.leaveBalance.deleteMany();
  console.log("Deleted leave balances");

  await prisma.leaveRequest.deleteMany();
  console.log("Deleted leave requests");

  await prisma.attendance.deleteMany();
  console.log("Deleted attendance records");

  await prisma.paySlip.deleteMany();
  console.log("Deleted pay slips");

  await prisma.payRun.deleteMany();
  console.log("Deleted pay runs");

  await prisma.employee.deleteMany();
  console.log("Deleted employees");

  await prisma.user.deleteMany();
  console.log("Deleted users");

  await prisma.leavePolicy.deleteMany();
  console.log("Deleted leave policies");

  await prisma.holiday.deleteMany();
  console.log("Deleted holidays");

  await prisma.statutoryConfig.deleteMany();
  console.log("Deleted statutory configs");

  await prisma.emailTemplate.deleteMany();
  console.log("Deleted email templates");

  await prisma.company.deleteMany();
  console.log("Deleted companies");

  console.log("Database cleaned successfully.");
}

main()
  .catch((e) => {
    console.error("Error cleaning database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
