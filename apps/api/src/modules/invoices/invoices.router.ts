import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { requireAuth, requireRole } from "../../middleware/rbac";

const invoicesRouter = new Hono();
invoicesRouter.use("*", requireAuth);

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

// 1.2 Export Sales Register for Tally Prime / Zoho Books
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

// 3. Pull Unbilled Hours & Completed Milestones into Invoice Items
invoicesRouter.post("/pull-unbilled", requireRole(["FINANCE", "ADMIN"]), async (c) => {
  const { projectId } = await c.req.json();

  if (!projectId) {
    return c.json({ error: "projectId is required" }, 400);
  }

  // Fetch approved unbilled time entries
  const unbilledTime = await prisma.timeEntry.findMany({
    where: {
      projectId,
      isBillable: true,
      isBilled: false,
      isApproved: true,
    },
    include: {
      user: { select: { name: true } },
      task: { select: { title: true } },
    },
  });

  // Fetch completed unbilled milestones
  const unbilledMilestones = await prisma.milestone.findMany({
    where: {
      projectId,
      isApproved: true,
      isBilled: false,
    },
  });

  const generatedItems = [];

  // Group milestones
  for (const m of unbilledMilestones) {
    generatedItems.push({
      description: `Milestone: ${m.title}`,
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
    const title = t.task?.title || "Professional Services";
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
      description: `Hours Logged: ${item.title}`,
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

  const { clientId, projectId, dueDate, notes, terms, isInterstate, items } = parsed.data;

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
    igstAmount = Math.round(subTotal * 0.18 * 100) / 100;
  } else {
    cgstAmount = Math.round(subTotal * 0.09 * 100) / 100;
    sgstAmount = Math.round(subTotal * 0.09 * 100) / 100;
  }

  const totalAmount = subTotal + cgstAmount + sgstAmount + igstAmount;

  // Generate Invoice Number
  const count = await prisma.invoice.count();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const invoice = await prisma.invoice.create({
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

  return c.json({ invoice, message: "Invoice created successfully" }, 201);
});

// 5. Record Cleared Payment against Invoice
const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string().min(1),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
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

  const newPaidAmount = Number(invoice.paidAmount) + parsed.data.amount;
  const totalAmount = Number(invoice.totalAmount);

  let newStatus = invoice.status;
  if (newPaidAmount >= totalAmount) {
    newStatus = "PAID";
  } else if (newPaidAmount > 0) {
    newStatus = "PARTIAL";
  }

  const paymentCount = await prisma.payment.count();
  const paymentNumber = `PAY-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(4, "0")}`;

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        invoiceId: id,
        amount: parsed.data.amount,
        paymentMethod: parsed.data.paymentMethod,
        referenceId: parsed.data.referenceId,
        notes: parsed.data.notes,
      },
    });

    const updatedInvoice = await tx.invoice.update({
      where: { id },
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

