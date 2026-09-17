import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { requireAuth, requireRole } from "../../middleware/rbac";

const invoicesRouter = new Hono();
invoicesRouter.use("*", requireAuth);

// Statutory GST Tax Constants for IT & Software Professional Services (SAC 998314)
export const GST_CONFIG = {
  INTERSTATE_IGST_RATE: 0.18,
  INTRASTATE_CGST_RATE: 0.09,
  INTRASTATE_SGST_RATE: 0.09,
};

// 1. List Invoices
invoicesRouter.get("/", async (c) => {
  const status = c.req.query("status");
  const clientId = c.req.query("clientId");

  const whereClause: any = {};
  if (status) whereClause.status = status;
  if (clientId) whereClause.clientId = clientId;

  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      client: { select: { id: true, clientNumber: true, companyName: true, gstin: true } },
      project: { select: { id: true, name: true } },
      _count: { select: { items: true, payments: true } },
    },
    orderBy: { issueDate: "desc" },
  });

  return c.json({ invoices });
});

// 1.1 Export Invoices for GSTR-1 (Table 4 B2B format)
invoicesRouter.get("/export/gstr1", async (c) => {
  const invoices = await prisma.invoice.findMany({
    include: {
      client: true,
      items: true,
    },
    orderBy: { issueDate: "asc" },
  });

  const headers = [
    "GSTIN/UIN of Recipient",
    "Receiver Name",
    "Invoice Number",
    "Invoice date",
    "Invoice Value",
    "Place Of Supply",
    "Reverse Charge",
    "Applicable % of Tax Rate",
    "Invoice Type",
    "E-Commerce GSTIN",
    "Rate",
    "Taxable Value",
    "Cess Amount",
  ];

  const rows = invoices.map((inv) => {
    const gstin = inv.client.gstin || "URP";
    const pos = inv.client.gstin ? `${inv.client.gstin.substring(0, 2)}-State` : "33-Tamil Nadu";
    const formattedDate = new Date(inv.issueDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return [
      `"${gstin}"`,
      `"${inv.client.companyName.replace(/"/g, '""')}"`,
      `"${inv.invoiceNumber}"`,
      `"${formattedDate}"`,
      Number(inv.totalAmount).toFixed(2),
      `"${pos}"`,
      `"N"`,
      `""`,
      `"Regular"`,
      `""`,
      Number(inv.igstAmount) > 0 ? "18.00" : "18.00",
      Number(inv.subTotal).toFixed(2),
      "0.00",
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");

  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", `attachment; filename="gstr1_b2b_${new Date().getFullYear()}.csv"`);
  return c.body(csvContent);
});

// 1.2 Export GSTR-1 in GSTN Portal JSON Schema (Direct upload to gst.gov.in)
invoicesRouter.get("/export/gstr1-json", async (c) => {
  const invoices = await prisma.invoice.findMany({
    include: {
      client: true,
      items: true,
    },
    orderBy: { issueDate: "asc" },
  });

  const b2bMap = new Map<string, any>();

  for (const inv of invoices) {
    const ctin = inv.client.gstin || "URP";
    const pos = inv.client.gstin ? inv.client.gstin.substring(0, 2) : "33";
    const dateFormatted = new Date(inv.issueDate)
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-");

    const isInterstate = Number(inv.igstAmount) > 0;
    const rate = 18;
    const txval = Number(inv.subTotal);
    const iamt = isInterstate ? Number(inv.igstAmount) : 0;
    const camt = isInterstate ? 0 : Number(inv.cgstAmount);
    const samt = isInterstate ? 0 : Number(inv.sgstAmount);

    const invObj = {
      inum: inv.invoiceNumber,
      idt: dateFormatted,
      val: Number(inv.totalAmount),
      pos,
      rchrg: "N",
      inv_typ: "R",
      itms: [
        {
          num: 1,
          itm_det: {
            rt: rate,
            txval,
            iamt,
            camt,
            samt,
            csamt: 0,
          },
        },
      ],
    };

    if (!b2bMap.has(ctin)) {
      b2bMap.set(ctin, { ctin, inv: [] });
    }
    b2bMap.get(ctin).inv.push(invObj);
  }

  const gstr1Payload = {
    gstin: process.env.ORG_GSTIN || "33AABCE1234F1Z5",
    fp: `${String(new Date().getMonth() + 1).padStart(2, "0")}${new Date().getFullYear()}`,
    b2b: Array.from(b2bMap.values()),
  };

  c.header("Content-Type", "application/json; charset=utf-8");
  c.header("Content-Disposition", `attachment; filename="gstr1_b2b_${new Date().getFullYear()}.json"`);
  return c.json(gstr1Payload);
});

// 1.3 Export Sales Register for Tally Prime / Zoho Books
invoicesRouter.get("/export/tally", async (c) => {
  const invoices = await prisma.invoice.findMany({
    include: {
      client: true,
    },
    orderBy: { issueDate: "asc" },
  });

  const headers = [
    "Voucher Date",
    "Voucher Type",
    "Invoice Number",
    "Party Ledger Name",
    "GSTIN",
    "Taxable Value",
    "CGST Amount",
    "SGST Amount",
    "IGST Amount",
    "Total Invoice Value",
    "Payment Status",
  ];

  const rows = invoices.map((inv) => {
    const formattedDate = new Date(inv.issueDate).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return [
      `"${formattedDate}"`,
      `"Sales"`,
      `"${inv.invoiceNumber}"`,
      `"${inv.client.companyName.replace(/"/g, '""')}"`,
      `"${inv.client.gstin || "Unregistered"}"`,
      Number(inv.subTotal).toFixed(2),
      Number(inv.cgstAmount).toFixed(2),
      Number(inv.sgstAmount).toFixed(2),
      Number(inv.igstAmount).toFixed(2),
      Number(inv.totalAmount).toFixed(2),
      `"${inv.status}"`,
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");

  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", `attachment; filename="tally_sales_register_${new Date().getFullYear()}.csv"`);
  return c.body(csvContent);
});

// 1.4 Accounts Receivable (AR) Aging Analysis & Debtor Aging Buckets (ERPNext AR Engine)
invoicesRouter.get("/aging", async (c) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
    },
    include: {
      client: {
        select: {
          id: true,
          clientNumber: true,
          companyName: true,
          contactPerson: true,
          email: true,
          phone: true,
          paymentTerms: true,
        },
      },
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();

  // Aging Buckets accumulator
  let totalOutstanding = 0;
  let currentAmount = 0;        // Not yet overdue (or <= 0 days overdue)
  let overdue1to30Amount = 0;   // 1 - 30 days overdue
  let overdue31to60Amount = 0;  // 31 - 60 days overdue
  let overdue61to90Amount = 0;  // 61 - 90 days overdue
  let overdue90PlusAmount = 0;  // > 90 days overdue (Critical)

  let currentCount = 0;
  let overdue1to30Count = 0;
  let overdue31to60Count = 0;
  let overdue61to90Count = 0;
  let overdue90PlusCount = 0;

  // Client debtor grouping map
  const clientMap = new Map<string, any>();

  const processedInvoices = invoices
    .map((inv) => {
      const total = Number(inv.totalAmount);
      const paid = Number(inv.paidAmount);
      const balance = Math.max(0, total - paid);

      if (balance <= 0) return null;

      const dueDate = new Date(inv.dueDate);
      const diffMs = now.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let bucket: "CURRENT" | "1-30" | "31-60" | "61-90" | "90+";
      if (daysOverdue <= 0) {
        bucket = "CURRENT";
        currentAmount += balance;
        currentCount++;
      } else if (daysOverdue <= 30) {
        bucket = "1-30";
        overdue1to30Amount += balance;
        overdue1to30Count++;
      } else if (daysOverdue <= 60) {
        bucket = "31-60";
        overdue31to60Amount += balance;
        overdue31to60Count++;
      } else if (daysOverdue <= 90) {
        bucket = "61-90";
        overdue61to90Amount += balance;
        overdue61to90Count++;
      } else {
        bucket = "90+";
        overdue90PlusAmount += balance;
        overdue90PlusCount++;
      }

      totalOutstanding += balance;

      // Group by client
      const cId = inv.client.id;
      if (!clientMap.has(cId)) {
        clientMap.set(cId, {
          client: inv.client,
          totalOutstanding: 0,
          current: 0,
          overdue1to30: 0,
          overdue31to60: 0,
          overdue61to90: 0,
          overdue90Plus: 0,
          maxDaysOverdue: 0,
          oldestDueDate: inv.dueDate,
          invoices: [],
        });
      }

      const clientEntry = clientMap.get(cId);
      clientEntry.totalOutstanding += balance;
      if (bucket === "CURRENT") clientEntry.current += balance;
      else if (bucket === "1-30") clientEntry.overdue1to30 += balance;
      else if (bucket === "31-60") clientEntry.overdue31to60 += balance;
      else if (bucket === "61-90") clientEntry.overdue61to90 += balance;
      else if (bucket === "90+") clientEntry.overdue90Plus += balance;

      if (daysOverdue > clientEntry.maxDaysOverdue) {
        clientEntry.maxDaysOverdue = daysOverdue;
      }

      const invSummary = {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        totalAmount: total,
        paidAmount: paid,
        balance,
        daysOverdue: Math.max(0, daysOverdue),
        bucket,
        status: inv.status,
        projectName: inv.project?.name,
      };

      clientEntry.invoices.push(invSummary);
      return {
        ...invSummary,
        client: inv.client,
      };
    })
    .filter(Boolean);

  // Calculate Days Sales Outstanding (DSO) over the last 90 days
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sales90Days = await prisma.invoice.aggregate({
    where: {
      issueDate: { gte: ninetyDaysAgo },
      status: { notIn: ["DRAFT", "CANCELLED"] },
    },
    _sum: { totalAmount: true },
  });

  const totalSales90 = Number(sales90Days._sum.totalAmount || 0);
  const dso = totalSales90 > 0 ? Math.round((totalOutstanding / totalSales90) * 90) : 0;

  // Format client debtors summaries
  const debtors = Array.from(clientMap.values())
    .map((entry) => ({
      ...entry,
      totalOutstanding: Math.round(entry.totalOutstanding),
      current: Math.round(entry.current),
      overdue1to30: Math.round(entry.overdue1to30),
      overdue31to60: Math.round(entry.overdue31to60),
      overdue61to90: Math.round(entry.overdue61to90),
      overdue90Plus: Math.round(entry.overdue90Plus),
      totalOverdue: Math.round(
        entry.overdue1to30 + entry.overdue31to60 + entry.overdue61to90 + entry.overdue90Plus
      ),
      invoicesCount: entry.invoices.length,
    }))
    .sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  return c.json({
    summary: {
      totalOutstanding: Math.round(totalOutstanding),
      totalOverdue: Math.round(
        overdue1to30Amount + overdue31to60Amount + overdue61to90Amount + overdue90PlusAmount
      ),
      dso,
      buckets: {
        current: { amount: Math.round(currentAmount), count: currentCount },
        overdue1to30: { amount: Math.round(overdue1to30Amount), count: overdue1to30Count },
        overdue31to60: { amount: Math.round(overdue31to60Amount), count: overdue31to60Count },
        overdue61to90: { amount: Math.round(overdue61to90Amount), count: overdue61to90Count },
        overdue90Plus: { amount: Math.round(overdue90PlusAmount), count: overdue90PlusCount },
      },
      totalUnpaidInvoices: processedInvoices.length,
    },
    debtors,
    invoices: processedInvoices,
  });
});

// 2. Invoice Details with line items and payments
invoicesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      project: true,
      items: true,
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });

  if (!invoice) {
    return c.json({ error: "Invoice not found" }, 404);
  }

  const remainingBalance = Number(invoice.totalAmount) - Number(invoice.paidAmount);

  return c.json({ invoice: { ...invoice, remainingBalance } });
});

// 2.1 Multi-tier Dunning Notice Generation & Activity Log Dispatch
const dunningSchema = z.object({
  level: z.enum(["AUTO", "LEVEL_1", "LEVEL_2", "LEVEL_3"]).default("AUTO"),
  includeInterest: z.boolean().default(true),
  interestRatePerAnnum: z.number().default(18),
  customRemarks: z.string().optional(),
});

invoicesRouter.post("/:id/dunning", requireRole(["FINANCE", "ADMIN"]), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = dunningSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      project: true,
    },
  });

  if (!invoice) {
    return c.json({ error: "Invoice not found" }, 404);
  }

  const total = Number(invoice.totalAmount);
  const paid = Number(invoice.paidAmount);
  const balance = Math.max(0, total - paid);

  if (balance <= 0) {
    return c.json({ error: "Invoice is already fully settled. No dunning notice required." }, 400);
  }

  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  const diffMs = now.getTime() - dueDate.getTime();
  const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  // Determine Level
  let resolvedLevel = parsed.data.level;
  if (resolvedLevel === "AUTO") {
    if (daysOverdue <= 15) {
      resolvedLevel = "LEVEL_1";
    } else if (daysOverdue <= 45) {
      resolvedLevel = "LEVEL_2";
    } else {
      resolvedLevel = "LEVEL_3";
    }
  }

  // Calculate Interest under Section 16 MSME Act (18% p.a. default)
  let interestAmount = 0;
  if (parsed.data.includeInterest && daysOverdue > 0 && resolvedLevel !== "LEVEL_1") {
    const dailyRate = (parsed.data.interestRatePerAnnum / 100) / 365;
    interestAmount = Math.round(balance * dailyRate * daysOverdue);
  }

  const totalPayableWithInterest = balance + interestAmount;

  // Generate Notice Reference Number
  const noticeRef = `DUN-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // Level Titles & Formal Body text
  let noticeTitle = "";
  let noticeSeverity: "INFO" | "WARNING" | "CRITICAL" = "INFO";
  let letterBody = "";
  let settlementDeadlineDays = 7;

  if (resolvedLevel === "LEVEL_1") {
    noticeTitle = "Level 1: Polite Payment Reminder";
    noticeSeverity = "INFO";
    settlementDeadlineDays = 7;
    letterBody = `This is a courteous reminder that Tax Invoice ${invoice.invoiceNumber} dated ${new Date(invoice.issueDate).toLocaleDateString("en-IN")} was due on ${new Date(invoice.dueDate).toLocaleDateString("en-IN")} and currently reflects an outstanding balance of ₹${balance.toLocaleString("en-IN")}. If payment has already been remitted, please accept our thanks and share the bank UTR reference. Otherwise, we kindly request settlement within 7 business days.`;
  } else if (resolvedLevel === "LEVEL_2") {
    noticeTitle = "Level 2: Formal Past-Due Commercial Notice";
    noticeSeverity = "WARNING";
    settlementDeadlineDays = 5;
    letterBody = `Please be advised that Tax Invoice ${invoice.invoiceNumber} is now ${daysOverdue} days overdue. Despite previous reminders, the outstanding principal amount of ₹${balance.toLocaleString("en-IN")} remains unsettled.${interestAmount > 0 ? ` As per commercial agreement terms and the MSME Development Act, statutory delayed payment interest of ₹${interestAmount.toLocaleString("en-IN")} (@ ${parsed.data.interestRatePerAnnum}% p.a.) has accrued, bringing total dues to ₹${totalPayableWithInterest.toLocaleString("en-IN")}.` : ""} Immediate remittance is requested within 5 business days to avoid service interruption.`;
  } else {
    noticeTitle = "Level 3: Final Demand & Legal Suspension Warning";
    noticeSeverity = "CRITICAL";
    settlementDeadlineDays = 3;
    letterBody = `FINAL DEMAND NOTICE: Tax Invoice ${invoice.invoiceNumber} is critically delinquent at ${daysOverdue} days past due date. Total outstanding principal is ₹${balance.toLocaleString("en-IN")}${interestAmount > 0 ? ` plus statutory accrued interest of ₹${interestAmount.toLocaleString("en-IN")} (Total: ₹${totalPayableWithInterest.toLocaleString("en-IN")}) under Section 16 of the MSMED Act 2006` : ""}. Failure to settle this account within 3 business days will result in immediate suspension of all active deliverables, revocation of staging access, and referral to legal counsel for recovery.`;
  }

  // Record into Client Activity Log
  await prisma.activityLog.create({
    data: {
      clientId: invoice.clientId,
      type: "NOTE",
      content: `📢 [DUNNING NOTICE ${resolvedLevel} - ${noticeRef}]: Dispatched for Invoice ${invoice.invoiceNumber}. Outstanding: ₹${balance.toLocaleString("en-IN")}${interestAmount > 0 ? ` (+ ₹${interestAmount.toLocaleString("en-IN")} statutory interest)` : ""}. Days Overdue: ${daysOverdue}.`,
      isInternalOnly: false,
    },
  });

  return c.json({
    notice: {
      noticeReference: noticeRef,
      level: resolvedLevel,
      title: noticeTitle,
      severity: noticeSeverity,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client.companyName,
      contactPerson: invoice.client.contactPerson,
      email: invoice.client.email,
      daysOverdue,
      principalBalance: balance,
      interestAmount,
      totalPayable: totalPayableWithInterest,
      settlementDeadlineDays,
      letterBody,
      customRemarks: parsed.data.customRemarks || null,
      generatedAt: now.toISOString(),
      bankDetails: {
        beneficiary: "CELESTIALABS TECHNOLOGIES PRIVATE LIMITED",
        bankName: "HDFC Bank Ltd",
        accountNumber: "50200088912345",
        ifscCode: "HDFC0000123",
        upiId: "celestialabs@hdfcbank",
      },
    },
  });
});

// 3. Pull Unbilled Hours & Completed Milestones into Invoice Items
invoicesRouter.post("/pull-unbilled", requireRole(["FINANCE", "ADMIN"]), async (c) => {
  const { projectId } = await c.req.json();

  if (!projectId) {
    return c.json({ error: "projectId is required" }, 400);
  }

  // Fetch completed unbilled billable time entries
  const unbilledTime = await prisma.timeEntry.findMany({
    where: {
      projectId,
      isBillable: true,
      isBilled: false,
      endTime: { not: null },
    },
    include: {
      user: { select: { name: true } },
      task: { select: { title: true } },
    },
  });

  // Fetch unbilled milestones
  const unbilledMilestones = await prisma.milestone.findMany({
    where: {
      projectId,
      isBilled: false,
    },
  });

  const generatedItems = [];

  // Group milestones
  for (const m of unbilledMilestones) {
    generatedItems.push({
      description: `Milestone Deliverable: ${m.title}`,
      sacCode: "998314",
      quantity: 1,
      unitPrice: Number(m.amount),
      taxRate: 18,
      amount: Number(m.amount),
    });
  }

  // Aggregate time entries by task
  const taskHoursMap = new Map<string, { title: string; hours: number; rate: number }>();
  for (const t of unbilledTime) {
    const key = t.taskId || "general";
    const title = t.task?.title || "Professional Engineering Services";
    const hours = t.durationMinutes / 60;
    const rate = Number(t.billingRate);

    const existing = taskHoursMap.get(key) || { title, hours: 0, rate };
    existing.hours += hours;
    taskHoursMap.set(key, existing);
  }

  for (const [_, item] of taskHoursMap.entries()) {
    const formattedHours = Number(item.hours.toFixed(2));
    const amount = formattedHours * item.rate;
    generatedItems.push({
      description: `Billable Hours: ${item.title} (${formattedHours} hrs @ ₹${item.rate}/hr)`,
      sacCode: "998314",
      quantity: formattedHours,
      unitPrice: item.rate,
      taxRate: 18,
      amount: Math.round(amount),
    });
  }

  return c.json({
    items: generatedItems,
    timeEntryCount: unbilledTime.length,
    milestoneCount: unbilledMilestones.length,
    timeEntryIds: unbilledTime.map((t) => t.id),
    milestoneIds: unbilledMilestones.map((m) => m.id),
  });
});

// 4. Create GST Invoice
const createInvoiceSchema = z.object({
  clientId: z.string(),
  projectId: z.string().optional(),
  dueDate: z.string(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  isInterstate: z.boolean().default(false), // If true, apply 18% IGST; if false, 9% CGST + 9% SGST
  timeEntryIds: z.array(z.string()).optional(),
  milestoneIds: z.array(z.string()).optional(),
  items: z.array(
    z.object({
      description: z.string().min(1),
      sacCode: z.string().default("998314"),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      taxRate: z.number().default(18),
    })
  ),
});

invoicesRouter.post("/", requireRole(["FINANCE", "ADMIN"]), async (c) => {
  const body = await c.req.json();
  const parsed = createInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const { clientId, projectId, dueDate, notes, terms, isInterstate, items, timeEntryIds, milestoneIds } = parsed.data;

  // Calculate Subtotal & Taxes
  let subTotal = 0;
  const processedItems = items.map((item) => {
    const amount = Math.round(item.quantity * item.unitPrice * 100) / 100;
    subTotal += amount;
    return {
      description: item.description,
      sacCode: item.sacCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      amount,
    };
  });

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterstate) {
    igstAmount = Math.round(subTotal * GST_CONFIG.INTERSTATE_IGST_RATE * 100) / 100;
  } else {
    cgstAmount = Math.round(subTotal * GST_CONFIG.INTRASTATE_CGST_RATE * 100) / 100;
    sgstAmount = Math.round(subTotal * GST_CONFIG.INTRASTATE_SGST_RATE * 100) / 100;
  }

  const totalAmount = subTotal + cgstAmount + sgstAmount + igstAmount;

  // Generate Invoice Number
  const count = await prisma.invoice.count();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        projectId,
        dueDate: new Date(dueDate),
        subTotal,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount,
        notes,
        terms: terms || "Payment due within 30 days of invoice date.",
        items: { create: processedItems },
      },
      include: { items: true, client: true },
    });

    // Mark pulled unbilled time entries as billed & link to invoice
    if (timeEntryIds && timeEntryIds.length > 0) {
      await tx.timeEntry.updateMany({
        where: { id: { in: timeEntryIds } },
        data: { isBilled: true, invoiceId: inv.id },
      });
    }

    // Mark pulled unbilled milestones as billed
    if (milestoneIds && milestoneIds.length > 0) {
      await tx.milestone.updateMany({
        where: { id: { in: milestoneIds } },
        data: { isBilled: true },
      });
    }

    return inv;
  });

  return c.json({ invoice, message: "Invoice created successfully" }, 201);
});

// 5. Record Cleared Payment against Invoice (with Indian Statutory TDS deduction support)
const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string().min(1),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
  tdsAmount: z.number().nonnegative().optional().default(0),
  tdsSection: z.string().optional(), // e.g. "194J" (10% Tech/Professional), "194C" (2% Contractor), "194H" (5% Commission)
});

invoicesRouter.post("/:id/payments", requireRole(["FINANCE", "ADMIN"]), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = recordPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return c.json({ error: "Invoice not found" }, 404);
  }

  const tds = parsed.data.tdsAmount || 0;
  // Total cleared from invoice balance = Net Remittance Received + Statutory TDS Withheld
  const totalCleared = parsed.data.amount + tds;
  const newPaidAmount = Number(invoice.paidAmount) + totalCleared;
  const totalAmount = Number(invoice.totalAmount);

  let newStatus = invoice.status;
  if (newPaidAmount >= totalAmount) {
    newStatus = "PAID";
  } else if (newPaidAmount > 0) {
    newStatus = "PARTIAL";
  }

  // Format payment notes to document TDS deduction according to Indian Income Tax Act
  let finalNotes = parsed.data.notes || "";
  if (tds > 0) {
    const secTag = parsed.data.tdsSection ? `(Sec ${parsed.data.tdsSection})` : "(TDS)";
    const tdsNote = `[TDS Deducted: ₹${tds.toLocaleString("en-IN")} ${secTag}]`;
    finalNotes = finalNotes ? `${finalNotes} | ${tdsNote}` : tdsNote;
  }

  const paymentCount = await prisma.payment.count();
  const paymentNumber = `PAY-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(4, "0")}`;

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        invoiceId: invoice.id,
        amount: parsed.data.amount,
        paymentMethod: parsed.data.paymentMethod,
        referenceId: parsed.data.referenceId,
        notes: finalNotes || null,
      },
    });

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    return { payment, updatedInvoice };
  });

  return c.json({
    message: "Payment recorded successfully",
    payment: result.payment,
    invoice: result.updatedInvoice,
  }, 201);
});

// 6. List all payments across invoices
invoicesRouter.get("/payments/all", async (c) => {
  const payments = await prisma.payment.findMany({
    include: {
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          client: { select: { id: true, companyName: true } },
        },
      },
    },
    orderBy: { paymentDate: "desc" },
  });

  const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount), 0);

  return c.json({ payments, totalCollected: Math.round(totalCollected) });
});

export { invoicesRouter };

