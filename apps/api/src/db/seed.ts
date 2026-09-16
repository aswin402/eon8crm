import { prisma } from "../utils/prisma";

async function main() {
  console.log("🌱 Seeding EON8 CRM Database...");

  // 1. Hash password for test accounts
  const passwordHash = await Bun.password.hash("Password@123", {
    algorithm: "bcrypt",
    cost: 10,
  });

  // 2. Clean existing records if any
  await prisma.activityLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.document.deleteMany();
  await prisma.clientContact.deleteMany();
  await prisma.client.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  // 3. Seed Users for all 6 Roles
  console.log("Creating role-based users...");
  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@eon8crm.internal",
      name: "Aswin (CTO)",
      passwordHash,
      role: "SUPER_ADMIN",
      internalCostRate: 0.00,
      billableRate: 2500.00,
      phone: "+91 9876543210",
    },
  });

  const operationsAdmin = await prisma.user.create({
    data: {
      email: "admin@eon8crm.internal",
      name: "Devi (Ops Director)",
      passwordHash,
      role: "ADMIN",
      internalCostRate: 1200.00,
      billableRate: 2000.00,
      phone: "+91 9876543211",
    },
  });

  const salesRep = await prisma.user.create({
    data: {
      email: "sales@eon8crm.internal",
      name: "Rahul Verma",
      passwordHash,
      role: "SALES",
      internalCostRate: 600.00,
      billableRate: 1500.00,
      phone: "+91 9876543212",
    },
  });

  const projectManager = await prisma.user.create({
    data: {
      email: "pm@eon8crm.internal",
      name: "Priya Sharma",
      passwordHash,
      role: "PROJECT_MANAGER",
      internalCostRate: 800.00,
      billableRate: 1800.00,
      phone: "+91 9876543213",
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: "dev@eon8crm.internal",
      name: "Karthik Raja",
      passwordHash,
      role: "EMPLOYEE",
      internalCostRate: 500.00,
      billableRate: 1200.00,
      phone: "+91 9876543214",
    },
  });

  const financeOfficer = await prisma.user.create({
    data: {
      email: "finance@eon8crm.internal",
      name: "Anand Sundaram",
      passwordHash,
      role: "FINANCE",
      internalCostRate: 700.00,
      billableRate: 1500.00,
      phone: "+91 9876543215",
    },
  });

  // 4. Seed Leads across pipeline stages
  console.log("Creating sample sales leads...");
  await prisma.lead.create({
    data: {
      leadNumber: "LEAD-2026-0001",
      companyName: "Nexus Retail Solutions",
      contactPerson: "Arjun Reddy",
      email: "arjun@nexusretail.com",
      phone: "+91 9123456780",
      source: "Inbound Website",
      industry: "E-Commerce",
      serviceInterest: "Full-Stack Custom ERP",
      estimatedValue: 450000.00,
      status: "PROPOSAL",
      assignedToId: salesRep.id,
      notes: "Client needs quote-to-cash workflow with Tally sync.",
    },
  });

  await prisma.lead.create({
    data: {
      leadNumber: "LEAD-2026-0002",
      companyName: "Apex Logistics Tech",
      contactPerson: "Suresh Menon",
      email: "suresh@apexlogistics.in",
      phone: "+91 9123456781",
      source: "LinkedIn",
      industry: "Supply Chain",
      serviceInterest: "Fleet Management App",
      estimatedValue: 750000.00,
      status: "NEGOTIATION",
      assignedToId: salesRep.id,
      notes: "Proposal submitted. Awaiting board approval for 50% advance.",
    },
  });

  // 5. Seed Client 360 & Connected Project
  console.log("Creating Client 360 master record...");
  const client = await prisma.client.create({
    data: {
      clientNumber: "CLI-1001",
      companyName: "Celestial Enterprises Pvt Ltd",
      contactPerson: "Vikram Malhotra",
      email: "vikram@celestial.in",
      phone: "+91 9888877777",
      gstin: "33AAAAA0000A1Z5", // Tamil Nadu GST code
      pan: "AAAAA0000A",
      billingAddress: "42, Industrial Estate, Guindy, Chennai, Tamil Nadu - 600032",
      paymentTerms: "Net 30",
      contacts: {
        create: [
          {
            name: "Vikram Malhotra",
            email: "vikram@celestial.in",
            phone: "+91 9888877777",
            designation: "Managing Director",
            isPrimary: true,
          },
          {
            name: "Meera Iyer",
            email: "accounts@celestial.in",
            phone: "+91 9888877778",
            designation: "Accounts Lead",
            isPrimary: false,
          },
        ],
      },
    },
  });

  // 6. Seed Project, Tasks & Milestones
  console.log("Creating Project, Deliverables & Tasks...");
  const project = await prisma.project.create({
    data: {
      name: "Celestial B2B Portal Overhaul",
      clientId: client.id,
      managerId: projectManager.id,
      budget: 600000.00,
      status: "ACTIVE",
      startDate: new Date("2026-09-01"),
      dueDate: new Date("2026-11-30"),
      description: "End-to-end B2B client portal with automated invoicing and GST filing.",
      milestones: {
        create: [
          {
            title: "Phase 1: Architecture & Auth",
            amount: 200000.00,
            completionDate: new Date("2026-09-15"),
            isApproved: true,
            isBilled: true,
          },
          {
            title: "Phase 2: Project & Invoicing Engine",
            amount: 250000.00,
            completionDate: new Date("2026-10-15"),
            isApproved: false,
            isBilled: false,
          },
        ],
      },
      tasks: {
        create: [
          {
            title: "Setup Prisma schema and RBAC authorization guards",
            description: "Enforce strict role verification on all API endpoints.",
            priority: "HIGH",
            isCompleted: true,
            assigneeId: employee.id,
          },
          {
            title: "Build Split-Screen Invoice Studio",
            description: "Implement interactive line-items with SAC/HSN auto-complete.",
            priority: "URGENT",
            isCompleted: false,
            assigneeId: employee.id,
          },
        ],
      },
    },
  });

  // 7. Seed Time Entries (Ever Gauzy costing model)
  console.log("Logging billable time entries...");
  await prisma.timeEntry.create({
    data: {
      userId: employee.id,
      projectId: project.id,
      description: "Designed and migrated 18 relational models to PostgreSQL",
      startTime: new Date("2026-09-10T09:00:00Z"),
      endTime: new Date("2026-09-10T14:30:00Z"),
      durationMinutes: 330,
      isBillable: true,
      isApproved: true,
      costRate: employee.internalCostRate,
      billingRate: employee.billableRate,
    },
  });

  // 8. Seed Invoice & Indian GST (ERPNext DocStatus model)
  console.log("Generating sample GST Invoice...");
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0001",
      clientId: client.id,
      projectId: project.id,
      status: "PARTIAL",
      issueDate: new Date("2026-09-15"),
      dueDate: new Date("2026-10-15"),
      subTotal: 200000.00,
      cgstAmount: 18000.00, // 9% CGST
      sgstAmount: 18000.00, // 9% SGST
      igstAmount: 0.00,
      totalAmount: 236000.00,
      paidAmount: 100000.00,
      notes: "Advance payment for Phase 1 milestone deliverables.",
      items: {
        create: [
          {
            description: "Phase 1: Architecture, Authentication & RBAC Engine",
            sacCode: "998314",
            quantity: 1.00,
            unitPrice: 200000.00,
            taxRate: 18.00,
            amount: 200000.00,
          },
        ],
      },
      payments: {
        create: [
          {
            paymentNumber: "PAY-2026-0001",
            amount: 100000.00,
            paymentDate: new Date("2026-09-16"),
            paymentMethod: "NEFT / Bank Transfer",
            referenceId: "HDFC2026091678910",
            notes: "Partial advance settlement cleared via HDFC Bank.",
          },
        ],
      },
    },
  });

  // 9. Seed Operational Expenses
  console.log("Logging sample operational expenses...");
  await prisma.expense.createMany({
    data: [
      {
        category: "Software",
        description: "AWS Cloud Infrastructure & Database Hosting",
        amount: 38500.00,
        expenseDate: new Date("2026-09-02"),
        vendor: "Amazon Web Services Inc",
      },
      {
        category: "Software",
        description: "Figma Organization & Design System Seats",
        amount: 14200.00,
        expenseDate: new Date("2026-09-05"),
        vendor: "Figma Inc",
      },
      {
        category: "Rent",
        description: "Chennai Tech Park Office Facility Lease",
        amount: 75000.00,
        expenseDate: new Date("2026-09-01"),
        vendor: "Ascendas IT Park",
      },
      {
        category: "Salaries",
        description: "Sprint 0-1 Core Engineering Payroll Batch",
        amount: 280000.00,
        expenseDate: new Date("2026-09-01"),
        vendor: "EON8 Internal Payroll",
      },
      {
        category: "Travel",
        description: "Client Discovery Onsite & Architecture Review Travel",
        amount: 12400.00,
        expenseDate: new Date("2026-09-08"),
        vendor: "IndiGo Airlines",
      },
    ],
  });

  // 10. Seed Overdue Invoice to exercise Aging Matrix
  console.log("Generating Overdue Invoice for AR Aging analysis...");
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0002",
      clientId: client.id,
      projectId: project.id,
      status: "OVERDUE",
      issueDate: new Date("2026-08-01"),
      dueDate: new Date("2026-08-25"), // 22 days overdue
      subTotal: 150000.00,
      cgstAmount: 13500.00,
      sgstAmount: 13500.00,
      igstAmount: 0.00,
      totalAmount: 177000.00,
      paidAmount: 0.00,
      notes: "Invoice overdue beyond 20 days. Automated reminder dispatched.",
      items: {
        create: [
          {
            description: "Phase 0: Business Process Re-engineering & PRD Delivery",
            sacCode: "998313",
            quantity: 1.00,
            unitPrice: 150000.00,
            taxRate: 18.00,
            amount: 150000.00,
          },
        ],
      },
    },
  });

  // 11. Seed Support Tickets
  console.log("Generating initial support tickets...");
  await prisma.ticket.create({
    data: {
      ticketNumber: "TIK-1001",
      subject: "SSO Integration authentication redirect timeout",
      description: "Client reports SAML2 SSO callback drops session tokens under Safari browser.",
      priority: "URGENT",
      status: "IN_PROGRESS",
      clientId: client.id,
      assignedToId: employee.id,
      slaDueTime: new Date(Date.now() + 3 * 3600 * 1000), // 3 hours remaining
    },
  });

  await prisma.ticket.create({
    data: {
      ticketNumber: "TIK-1002",
      subject: "Request additional billing user seat for Finance controller",
      description: "Need to grant read-only invoicing permissions for external statutory auditor.",
      priority: "LOW",
      status: "OPEN",
      clientId: client.id,
      slaDueTime: new Date(Date.now() + 40 * 3600 * 1000), // 40 hours remaining
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("-----------------------------------------------");
  console.log("Test Login Credentials (Password: Password@123):");
  console.log("• Super Admin: superadmin@eon8crm.internal");
  console.log("• Operations:  admin@eon8crm.internal");
  console.log("• Sales Rep:   sales@eon8crm.internal");
  console.log("• PM Lead:     pm@eon8crm.internal");
  console.log("• Developer:   dev@eon8crm.internal");
  console.log("• Finance:     finance@eon8crm.internal");
  console.log("-----------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
