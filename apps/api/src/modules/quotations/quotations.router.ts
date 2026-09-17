import { Hono } from "hono";
import { z } from "zod";
import { prisma, pool } from "../../utils/prisma";
import { requireAuth, requireRole } from "../../middleware/rbac";

const quotationsRouter = new Hono();

// Allow public proposal endpoints without auth
quotationsRouter.use("*", async (c, next) => {
  if (c.req.path.includes("/public/")) {
    return next();
  }
  return requireAuth(c, next);
});

// Ensure PostgreSQL table exists with JSONB items support
let isTableInitialized = false;
async function ensureQuotationsTable() {
  if (isTableInitialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      quotation_number TEXT UNIQUE NOT NULL,
      share_token TEXT UNIQUE,
      client_id TEXT,
      lead_id TEXT,
      company_name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      valid_until TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      sub_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      igst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
      is_interstate BOOLEAN NOT NULL DEFAULT FALSE,
      notes TEXT,
      terms TEXT,
      items JSONB NOT NULL DEFAULT '[]'::jsonb,
      converted_project_id TEXT,
      converted_invoice_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE quotations ADD COLUMN IF NOT EXISTS share_token TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_share_token ON quotations(share_token);
    CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
    CREATE INDEX IF NOT EXISTS idx_quotations_client ON quotations(client_id);
  `);
  isTableInitialized = true;
}

function mapRowToQuotation(row: any) {
  return {
    id: row.id,
    quotationNumber: row.quotation_number,
    shareToken: row.share_token || row.id,
    clientId: row.client_id,
    leadId: row.lead_id,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    issueDate: row.issue_date,
    validUntil: row.valid_until,
    status: row.status,
    subTotal: Number(row.sub_total),
    cgstAmount: Number(row.cgst_amount),
    sgstAmount: Number(row.sgst_amount),
    igstAmount: Number(row.igst_amount),
    totalAmount: Number(row.total_amount),
    isInterstate: Boolean(row.is_interstate),
    notes: row.notes,
    terms: row.terms,
    items: typeof row.items === "string" ? JSON.parse(row.items) : row.items || [],
    convertedProjectId: row.converted_project_id,
    convertedInvoiceId: row.converted_invoice_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 1. List Quotations with Filtering & Financial Metrics
quotationsRouter.get("/", async (c) => {
  await ensureQuotationsTable();
  const status = c.req.query("status");
  const search = c.req.query("search");

  let query = "SELECT * FROM quotations WHERE 1=1";
  const params: any[] = [];

  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (company_name ILIKE $${params.length} OR quotation_number ILIKE $${params.length} OR contact_person ILIKE $${params.length})`;
  }

  query += " ORDER BY created_at DESC";

  const { rows } = await pool.query(query, params);
  const quotations = rows.map(mapRowToQuotation);

  // Compute aggregate stats
  const totalValue = quotations.reduce((acc, q) => acc + q.totalAmount, 0);
  const acceptedValue = quotations
    .filter((q) => q.status === "ACCEPTED")
    .reduce((acc, q) => acc + q.totalAmount, 0);
  const pendingCount = quotations.filter((q) => q.status === "SENT" || q.status === "DRAFT").length;
  const acceptedCount = quotations.filter((q) => q.status === "ACCEPTED").length;

  return c.json({
    quotations,
    stats: {
      totalValue: Math.round(totalValue),
      acceptedValue: Math.round(acceptedValue),
      pendingCount,
      acceptedCount,
      totalCount: quotations.length,
    },
  });
});

// Public Proposal Endpoints (Accessible by external clients without JWT authentication)
quotationsRouter.get("/public/:token", async (c) => {
  await ensureQuotationsTable();
  const token = c.req.param("token");

  const { rows } = await pool.query(
    "SELECT * FROM quotations WHERE share_token = $1 OR id = $1 LIMIT 1",
    [token]
  );

  if (rows.length === 0) {
    return c.json({ error: "Quotation proposal not found or link has expired" }, 404);
  }

  const quotation = mapRowToQuotation(rows[0]);
  return c.json({ quotation });
});

const publicAcceptProposalSchema = z.object({
  signatoryName: z.string().min(2, "Signatory full name is required"),
  signatoryTitle: z.string().optional(),
  signatoryEmail: z.string().email("Valid email address is required"),
  notes: z.string().optional(),
});

quotationsRouter.post("/public/:token/accept", async (c) => {
  await ensureQuotationsTable();
  const token = c.req.param("token");
  const body = await c.req.json();
  const parsed = publicAcceptProposalSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const { rows } = await pool.query(
    "SELECT * FROM quotations WHERE share_token = $1 OR id = $1 LIMIT 1",
    [token]
  );

  if (rows.length === 0) {
    return c.json({ error: "Quotation proposal not found" }, 404);
  }

  const qtn = mapRowToQuotation(rows[0]);

  if (qtn.status === "ACCEPTED" || qtn.convertedProjectId) {
    return c.json({
      error: "This proposal has already been digitally accepted and confirmed.",
      quotation: qtn,
    }, 400);
  }

  if (new Date() > new Date(qtn.validUntil)) {
    return c.json({
      error: "This quotation proposal has expired. Please contact our team for a revised quote.",
    }, 400);
  }

  // 1. Resolve or Create Client
  let clientId = qtn.clientId;
  if (!clientId) {
    const existingClient = await prisma.client.findFirst({
      where: {
        OR: [{ email: qtn.email }, { companyName: qtn.companyName }],
      },
    });

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const clientCount = await prisma.client.count();
      const newClient = await prisma.client.create({
        data: {
          clientNumber: `CLI-${String(clientCount + 1001)}`,
          companyName: qtn.companyName,
          contactPerson: parsed.data.signatoryName || qtn.contactPerson,
          email: qtn.email,
          phone: qtn.phone || "N/A",
          billingAddress: "Registered Corporate Office",
          paymentTerms: "Net 30",
        },
      });
      clientId = newClient.id;
    }
  }

  // 2. Resolve default project manager or admin user
  const defaultManager =
    (await prisma.user.findFirst({
      where: { role: { in: ["PROJECT_MANAGER", "ADMIN"] } },
      select: { id: true },
    })) ||
    (await prisma.user.findFirst({
      select: { id: true },
    }));

  if (!defaultManager) {
    return c.json({ error: "No system manager configured to initialize project" }, 500);
  }

  // 3. Create Project with milestones
  const projName = `${qtn.companyName} - Project Delivery`;
  const createdProject = await prisma.project.create({
    data: {
      name: projName,
      clientId: clientId!,
      managerId: defaultManager.id,
      status: "ACTIVE",
      budget: qtn.totalAmount,
      startDate: new Date(),
      milestones: {
        create: [
          {
            title: "Phase 1: Project Kickoff & Requirements Delivery",
            amount: Math.round(qtn.totalAmount * 0.5),
            completionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          {
            title: "Phase 2: Final Acceptance & Handover",
            amount: Math.round(qtn.totalAmount * 0.5),
            completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
    include: { milestones: true },
  });

  // 4. Create Draft Tax Invoice
  const invoiceCount = await prisma.invoice.count();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, "0")}`;

  const processedInvoiceItems = qtn.items.map((item: any) => ({
    description: item.description,
    sacCode: item.sacCode || "998314",
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unitPrice),
    taxRate: Number(item.taxRate) || 18,
    amount: (Number(item.quantity) || 1) * Number(item.unitPrice),
  }));

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const createdInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      clientId: clientId!,
      projectId: createdProject.id,
      dueDate,
      subTotal: qtn.subTotal,
      cgstAmount: qtn.cgstAmount,
      sgstAmount: qtn.sgstAmount,
      igstAmount: qtn.igstAmount,
      totalAmount: qtn.totalAmount,
      notes: `Digitally Accepted via Client Proposal Portal. Quotation #${qtn.quotationNumber}.\nSignatory: ${parsed.data.signatoryName} (${parsed.data.signatoryTitle || "Authorized Signatory"}, ${parsed.data.signatoryEmail})`,
      terms: qtn.terms || "Payment due within 30 days of invoice date.",
      items: { create: processedInvoiceItems },
    },
    include: { items: true },
  });

  // 5. Update Quotation Status to ACCEPTED and record digital signature
  const sigText = `Digitally Accepted & Signed by ${parsed.data.signatoryName} (${parsed.data.signatoryTitle || "Authorized Signatory"}, ${parsed.data.signatoryEmail}) on ${new Date().toUTCString()}.${parsed.data.notes ? `\nClient Comments: ${parsed.data.notes}` : ""}`;
  const finalNotes = qtn.notes ? `${qtn.notes}\n\n[Client Digital Signature]:\n${sigText}` : `[Client Digital Signature]:\n${sigText}`;

  const updateRes = await pool.query(
    `UPDATE quotations
     SET status = 'ACCEPTED',
         client_id = $1,
         converted_project_id = $2,
         converted_invoice_id = $3,
         notes = $4,
         updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [clientId, createdProject.id, createdInvoice.id, finalNotes, qtn.id]
  );

  return c.json({
    message: "Proposal digitally signed and accepted successfully! Active project and initial onboarding invoice generated.",
    quotation: mapRowToQuotation(updateRes.rows[0]),
    project: createdProject,
    invoice: createdInvoice,
  });
});

// 2. Get Single Quotation (Internal)
quotationsRouter.get("/:id", async (c) => {
  await ensureQuotationsTable();
  const id = c.req.param("id");

  const { rows } = await pool.query("SELECT * FROM quotations WHERE id = $1", [id]);
  if (rows.length === 0) {
    return c.json({ error: "Quotation not found" }, 404);
  }

  const quotation = mapRowToQuotation(rows[0]);
  return c.json({ quotation });
});

// 3. Create Quotation Schema
const itemSchema = z.object({
  description: z.string().min(1),
  sacCode: z.string().default("998314"),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().default(18),
});

const createQuotationSchema = z.object({
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  companyName: z.string().min(1),
  contactPerson: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  validDays: z.number().int().positive().default(30),
  isInterstate: z.boolean().default(false),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

// 4. Create Quotation
quotationsRouter.post("/", requireRole(["SALES", "PROJECT_MANAGER", "ADMIN"]), async (c) => {
  await ensureQuotationsTable();
  const body = await c.req.json();
  const parsed = createQuotationSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const data = parsed.data;

  // Process items & calculate GST totals
  let subTotal = 0;
  const processedItems = data.items.map((item) => {
    const qty = Number(item.quantity);
    const price = Number(item.unitPrice);
    const amount = qty * price;
    subTotal += amount;
    return {
      ...item,
      amount,
    };
  });

  const taxRateDecimal = 0.18;
  const taxTotal = subTotal * taxRateDecimal;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (data.isInterstate) {
    igstAmount = taxTotal;
  } else {
    cgstAmount = taxTotal / 2;
    sgstAmount = taxTotal / 2;
  }

  const totalAmount = subTotal + taxTotal;

  // Generate Quotation Number (e.g. QTN-2026-0001)
  const countRes = await pool.query("SELECT COUNT(*) FROM quotations");
  const count = parseInt(countRes.rows[0].count, 10);
  const quotationNumber = `QTN-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + data.validDays);

  const id = `qtn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const shareToken = `prop_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;

  const defaultTerms =
    data.terms ||
    "1. Validity: 30 days from date of estimate.\n2. Payment terms: 50% advance upon agreement, 50% upon milestone completion.\n3. Taxes: GST @ 18% as applicable.";

  const insertQuery = `
    INSERT INTO quotations (
      id, quotation_number, share_token, client_id, lead_id, company_name, contact_person,
      email, phone, valid_until, status, sub_total, cgst_amount, sgst_amount,
      igst_amount, total_amount, is_interstate, notes, terms, items
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    ) RETURNING *
  `;

  const values = [
    id,
    quotationNumber,
    shareToken,
    data.clientId || null,
    data.leadId || null,
    data.companyName,
    data.contactPerson,
    data.email,
    data.phone || null,
    validUntil.toISOString(),
    "DRAFT",
    subTotal,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalAmount,
    data.isInterstate,
    data.notes || null,
    defaultTerms,
    JSON.stringify(processedItems),
  ];

  const { rows } = await pool.query(insertQuery, values);
  const quotation = mapRowToQuotation(rows[0]);

  return c.json({ quotation, message: "Quotation generated successfully" }, 201);
});

// 5. Update Quotation (Status or content)
quotationsRouter.patch("/:id", requireRole(["SALES", "PROJECT_MANAGER", "ADMIN"]), async (c) => {
  await ensureQuotationsTable();
  const id = c.req.param("id");
  const body = await c.req.json();

  const allowedStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];
  if (body.status && !allowedStatuses.includes(body.status)) {
    return c.json({ error: "Invalid status value" }, 400);
  }

  const existingRes = await pool.query("SELECT * FROM quotations WHERE id = $1", [id]);
  if (existingRes.rows.length === 0) {
    return c.json({ error: "Quotation not found" }, 404);
  }

  const existing = existingRes.rows[0];
  const newStatus = body.status || existing.status;
  const newNotes = body.notes !== undefined ? body.notes : existing.notes;
  const newTerms = body.terms !== undefined ? body.terms : existing.terms;

  const updateRes = await pool.query(
    `UPDATE quotations
     SET status = $1, notes = $2, terms = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [newStatus, newNotes, newTerms, id]
  );

  return c.json({
    quotation: mapRowToQuotation(updateRes.rows[0]),
    message: "Quotation updated successfully",
  });
});

// 6. ERPNext-inspired 1-Click Convert to Project & Invoice
const convertQuotationSchema = z.object({
  createProject: z.boolean().default(true),
  createInvoice: z.boolean().default(true),
  projectName: z.string().optional(),
});

quotationsRouter.post("/:id/convert", requireRole(["SALES", "PROJECT_MANAGER", "ADMIN"]), async (c) => {
  await ensureQuotationsTable();
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = convertQuotationSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const { rows } = await pool.query("SELECT * FROM quotations WHERE id = $1", [id]);
  if (rows.length === 0) {
    return c.json({ error: "Quotation not found" }, 404);
  }

  const qtn = mapRowToQuotation(rows[0]);

  // If already converted, prevent double execution
  if (qtn.convertedProjectId && parsed.data.createProject) {
    return c.json({ error: "Quotation has already been converted to a Project" }, 400);
  }

  // 1. Resolve or Create Client
  let clientId = qtn.clientId;
  if (!clientId) {
    const existingClient = await prisma.client.findFirst({
      where: {
        OR: [{ email: qtn.email }, { companyName: qtn.companyName }],
      },
    });

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const clientCount = await prisma.client.count();
      const newClient = await prisma.client.create({
        data: {
          clientNumber: `CLI-${String(clientCount + 1001)}`,
          companyName: qtn.companyName,
          contactPerson: qtn.contactPerson,
          email: qtn.email,
          phone: qtn.phone || "N/A",
          billingAddress: "Registered Office",
          paymentTerms: "Net 30",
        },
      });
      clientId = newClient.id;
    }
  }

  let createdProject: any = null;
  let createdInvoice: any = null;

  // 2. Create Project if requested
  if (parsed.data.createProject) {
    const projName = parsed.data.projectName || `${qtn.companyName} - Project Delivery`;
    createdProject = await prisma.project.create({
      data: {
        name: projName,
        clientId: clientId!,
        managerId: c.get("user").userId,
        status: "ACTIVE",
        budget: qtn.totalAmount,
        startDate: new Date(),
        milestones: {
          create: [
            {
              title: "Phase 1: Project Kickoff & Requirements Delivery",
              amount: Math.round(qtn.totalAmount * 0.5),
              completionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
            {
              title: "Phase 2: Final Acceptance & Handover",
              amount: Math.round(qtn.totalAmount * 0.5),
              completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          ],
        },
      },
      include: { milestones: true },
    });
  }

  // 3. Create Draft Tax Invoice if requested
  if (parsed.data.createInvoice) {
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, "0")}`;

    const processedInvoiceItems = qtn.items.map((item: any) => ({
      description: item.description,
      sacCode: item.sacCode || "998314",
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate) || 18,
      amount: (Number(item.quantity) || 1) * Number(item.unitPrice),
    }));

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    createdInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: clientId!,
        projectId: createdProject ? createdProject.id : undefined,
        dueDate,
        subTotal: qtn.subTotal,
        cgstAmount: qtn.cgstAmount,
        sgstAmount: qtn.sgstAmount,
        igstAmount: qtn.igstAmount,
        totalAmount: qtn.totalAmount,
        notes: `Converted from Quotation #${qtn.quotationNumber}. ${qtn.notes || ""}`,
        terms: qtn.terms || "Payment due within 30 days of invoice date.",
        items: { create: processedInvoiceItems },
      },
      include: { items: true },
    });
  }

  // 4. Update Quotation Status to ACCEPTED and link references
  await pool.query(
    `UPDATE quotations
     SET status = 'ACCEPTED',
         client_id = $1,
         converted_project_id = $2,
         converted_invoice_id = $3,
         updated_at = NOW()
     WHERE id = $4`,
    [
      clientId,
      createdProject ? createdProject.id : qtn.convertedProjectId,
      createdInvoice ? createdInvoice.id : qtn.convertedInvoiceId,
      id,
    ]
  );

  return c.json({
    message: "Quotation converted successfully",
    project: createdProject,
    invoice: createdInvoice,
  });
});

// 7. Delete Quotation (allowed if not converted)
quotationsRouter.delete("/:id", requireRole(["SALES", "ADMIN"]), async (c) => {
  await ensureQuotationsTable();
  const id = c.req.param("id");

  const { rows } = await pool.query("SELECT * FROM quotations WHERE id = $1", [id]);
  if (rows.length === 0) {
    return c.json({ error: "Quotation not found" }, 404);
  }

  const qtn = rows[0];
  if (qtn.converted_project_id || qtn.converted_invoice_id) {
    return c.json({ error: "Cannot delete an accepted quotation that has already been converted" }, 400);
  }

  await pool.query("DELETE FROM quotations WHERE id = $1", [id]);
  return c.json({ message: "Quotation deleted successfully" });
});

export { quotationsRouter };
