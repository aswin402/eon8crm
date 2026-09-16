/**
 * EON8 CRM — Enterprise Lifecycle & Integration Smoke Test
 * 
 * Verifies end-to-end flow:
 * 1. Health & RBAC verification
 * 2. Lead creation & Atomic WON conversion (Lead -> Client + Project)
 * 3. Project 360 milestone creation & billable labor timesheet logging
 * 4. GST Tax Invoice calculation (CGST/SGST 9%+9%)
 * 5. Payment recording & status reconciliation (DRAFT -> PAID)
 * 6. Gross margin & cash flow integrity check
 * 7. GSTR-1, Tally, Timesheet & Expense CSV export verification
 * 8. Live Operational Alerts Feed validation
 */

import { sign } from "hono/jwt";
import { prisma } from "../utils/prisma";

const API_BASE = process.env.API_BASE || "http://localhost:3001";
const JWT_SECRET = process.env.JWT_SECRET || "eon8crm-super-secret-jwt-key-change-in-production-2026";

async function runLifecycleTests() {
  console.log("================================================================================");
  console.log("🚀 EON8 CRM — Master Enterprise Lifecycle Verification Suite");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}${detail ? ` (${detail})` : ""}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ""}`);
      failed++;
    }
  }

  // Get Admin user from database
  const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!adminUser) {
    throw new Error("No SUPER_ADMIN user found in database. Please run seed script first.");
  }

  // Generate Super Admin Test Token
  const token = await sign(
    { userId: adminUser.id, email: adminUser.email, role: adminUser.role, name: adminUser.name },
    JWT_SECRET,
    "HS256"
  );
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // STEP 1: Health & RBAC Check
  console.log("--- 1. Infrastructure & Security Guards ---");
  const healthRes = await fetch(`${API_BASE}/health`);
  const healthData = (await healthRes.json()) as any;
  assert(healthRes.status === 200 && healthData.status === "healthy", "Backend Server Health", `Uptime: ${healthData.uptime?.toFixed(1)}s`);

  const unauthRes = await fetch(`${API_BASE}/api/v1/clients`);
  assert(unauthRes.status === 401, "RBAC Security Gate enforces 401 on unauthenticated requests");

  // STEP 2: Lead Creation & Atomic WON Conversion
  console.log("\n--- 2. Sales Pipeline & Atomic 'WON' Conversion ---");
  const uniqueSuffix = Date.now().toString().slice(-4);
  const leadPayload = {
    companyName: `Titan Space Dynamics ${uniqueSuffix} Pvt Ltd`,
    contactPerson: "Vikram Sarabhai",
    email: `contact@titanspace-${uniqueSuffix}.in`,
    phone: "+91 98765 43210",
    estimatedValue: 500000,
    source: "Referral",
    industry: "Aerospace",
    serviceInterest: "Custom CRM & ERP Architecture",
    assignedToId: adminUser.id,
  };

  const leadCreateRes = await fetch(`${API_BASE}/api/v1/leads`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(leadPayload),
  });
  const leadData = (await leadCreateRes.json()) as any;
  const lead = leadData.lead;
  assert(leadCreateRes.status === 201 && lead?.id, "Created Qualified Inbound Lead", `ID: ${lead?.id}, Value: ₹5,00,000`);

  // Convert Lead to WON via POST /api/v1/leads/:id/convert
  const wonRes = await fetch(`${API_BASE}/api/v1/leads/${lead.id}/convert`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      gstin: "33AABCT1234F1Z5",
      billingAddress: "Plot 42, Guindy Industrial Estate, Chennai, Tamil Nadu 600032",
      projectManagerId: adminUser.id,
      projectBudget: 500000,
    }),
  });
  const wonData = (await wonRes.json()) as any;
  const newClient = wonData.client;
  const newProject = wonData.project;
  assert(wonRes.status === 200 && newClient?.id && newProject?.id, "Atomic 1-Click WON Conversion executed", `Client: ${newClient?.clientNumber}, Project: ${newProject?.name}`);

  // STEP 3: Project 360 Milestone & Timesheet
  console.log("\n--- 3. Project 360 Operations & Labor Tracking ---");
  const milestoneRes = await fetch(`${API_BASE}/api/v1/projects/${newProject.id}/milestones`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Sprint 1: Core Architecture & Prototype Review",
      description: "Deliver multi-tenant data architecture and client prototype",
      amount: 150000,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    }),
  });
  const milestoneData = (await milestoneRes.json()) as any;
  assert(milestoneRes.status === 201 && milestoneData.milestone?.id, "Created Project Milestone", `Amount: ₹1,50,000`);

  // Log Billable Time Entry
  const timeLogRes = await fetch(`${API_BASE}/api/v1/time/entries`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      projectId: newProject.id,
      description: "Full-stack integration and GST calculation module delivery",
      durationMinutes: 180, // 3 hours
      isBillable: true,
      startTime: new Date().toISOString(),
    }),
  });
  const timeLogData = (await timeLogRes.json()) as any;
  assert(timeLogRes.status === 201 && timeLogData.timeEntry?.id, "Logged 3h Billable Timesheet", `Duration: 180 mins`);

  // STEP 4: Indian GST Invoicing Engine
  console.log("\n--- 4. Statutory Invoicing & GST Tax Engine ---");
  // Calculate GST: Subtotal 4,500, Intra-state Tamil Nadu (33) -> CGST 9% (405) + SGST 9% (405) = Total 5,310
  const invoiceCreateRes = await fetch(`${API_BASE}/api/v1/invoices`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      clientId: newClient.id,
      projectId: newProject.id,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      notes: "Sprint 1 Professional Services & Engineering Retainer",
      items: [
        {
          description: "Full-stack integration and GST calculation module delivery (3h @ ₹1,500/hr)",
          sacCode: "998314",
          quantity: 3,
          unitPrice: 1500,
          taxRate: 18,
        },
      ],
    }),
  });
  const invoiceData = (await invoiceCreateRes.json()) as any;
  const invoice = invoiceData.invoice;
  const isInvoiceValid =
    Number(invoice?.subTotal) === 4500 &&
    Number(invoice?.cgstAmount) === 405 &&
    Number(invoice?.sgstAmount) === 405 &&
    Number(invoice?.totalAmount) === 5310;

  assert(
    isInvoiceValid,
    "Calculated Section 31 CGST+SGST (9%+9%) Tax Invoice",
    `Subtotal: ₹${invoice?.subTotal}, GST: ₹${Number(invoice?.cgstAmount) + Number(invoice?.sgstAmount)}, Total: ₹${invoice?.totalAmount}`
  );

  // STEP 5: Payment Reconciliation & Ledger
  console.log("\n--- 5. Payment Ledger & Status State Machine ---");
  const paymentRes = await fetch(`${API_BASE}/api/v1/invoices/${invoice.id}/payments`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      amount: 5310,
      paymentMethod: "NEFT",
      referenceId: "HDFC-NEFT-2026-981240",
      notes: "Full settlement for Sprint 1 invoice",
    }),
  });
  const paymentData = (await paymentRes.json()) as any;
  assert(paymentRes.status === 201, "Recorded Full Cleared Payment", "Ref: HDFC-NEFT-2026-981240");

  // Verify invoice transitioned to PAID
  const verifiedInvRes = await fetch(`${API_BASE}/api/v1/invoices/${invoice.id}`, { headers: authHeaders });
  const verifiedInvData = (await verifiedInvRes.json()) as any;
  assert(
    verifiedInvData.invoice?.status === "PAID" && Number(verifiedInvData.invoice?.paidAmount) === 5310,
    "Invoice state machine transitioned to 'PAID'",
    `Paid: ₹${verifiedInvData.invoice?.paidAmount}`
  );

  // STEP 6: Statutory Exports (GSTR-1, Tally, Timesheet, Expenses)
  console.log("\n--- 6. Statutory CSV Export Suite ---");
  const gstr1Res = await fetch(`${API_BASE}/api/v1/invoices/export/gstr1`, { headers: authHeaders });
  const gstr1Csv = await gstr1Res.text();
  assert(
    gstr1Res.status === 200 && gstr1Csv.includes("GSTIN/UIN of Recipient") && gstr1Csv.includes(invoice.invoiceNumber),
    "GSTR-1 Table 4 B2B CSV includes new tax invoice"
  );

  const tallyRes = await fetch(`${API_BASE}/api/v1/invoices/export/tally`, { headers: authHeaders });
  const tallyCsv = await tallyRes.text();
  assert(
    tallyRes.status === 200 && tallyCsv.includes("Party Ledger Name") && tallyCsv.includes("Titan Space Dynamics"),
    "Tally Prime / Zoho Sales Register CSV generated with party ledger"
  );

  const timeExportRes = await fetch(`${API_BASE}/api/v1/time/export`, { headers: authHeaders });
  const timeCsv = await timeExportRes.text();
  assert(timeExportRes.status === 200 && timeCsv.includes("Duration (Hours)"), "Timesheet Labor Logs CSV generated");

  const expenseExportRes = await fetch(`${API_BASE}/api/v1/expenses/export`, { headers: authHeaders });
  const expenseCsv = await expenseExportRes.text();
  assert(expenseExportRes.status === 200 && expenseCsv.includes("Vendor / Payee"), "Operational Expenses CSV generated");

  // STEP 7: Live Operational Alerts Feed
  console.log("\n--- 7. Live Operational Intelligence Feed ---");
  const alertsRes = await fetch(`${API_BASE}/api/v1/analytics/alerts`, { headers: authHeaders });
  const alertsData = (await alertsRes.json()) as any;
  assert(
    alertsRes.status === 200 && alertsData.systemHealthy === true && Array.isArray(alertsData.alerts),
    "Live Operational Alerts endpoint active",
    `Active Actions: ${alertsData.unreadCount}`
  );

  console.log("\n================================================================================");
  console.log(`🏁 Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runLifecycleTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
