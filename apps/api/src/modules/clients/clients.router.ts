import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { requireAuth, requireRole } from "../../middleware/rbac";

const clientsRouter = new Hono();
clientsRouter.use("*", requireAuth);

// 1. List all clients
clientsRouter.get("/", async (c) => {
  const search = c.req.query("search");

  const whereClause: any = {};
  if (search) {
    whereClause.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { clientNumber: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { gstin: { contains: search, mode: "insensitive" } },
    ];
  }

  const clients = await prisma.client.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          projects: true,
          invoices: true,
          tickets: true,
        },
      },
      invoices: {
        select: {
          totalAmount: true,
          paidAmount: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate financial totals per client
  const enrichedClients = clients.map((client) => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    for (const inv of client.invoices) {
      if (inv.status !== "CANCELLED") {
        const total = Number(inv.totalAmount);
        const paid = Number(inv.paidAmount);
        totalBilled += total;
        totalPaid += paid;
        totalOutstanding += total - paid;
      }
    }

    const { invoices, ...rest } = client;
    return {
      ...rest,
      financials: {
        totalBilled,
        totalPaid,
        totalOutstanding,
      },
    };
  });

  return c.json({ clients: enrichedClients });
});

// 2. Client 360 Aggregated Single Pane of Glass
clientsRouter.get("/:id/360", async (c) => {
  const id = c.req.param("id");

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contacts: true,
      projects: {
        include: {
          manager: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true, timeEntries: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        include: {
          payments: true,
          items: true,
        },
        orderBy: { issueDate: "desc" },
      },
      tickets: {
        orderBy: { createdAt: "desc" },
      },
      documents: true,
      activities: {
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    return c.json({ error: "Client not found" }, 404);
  }

  // Aggregate financial metrics
  let totalBilled = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;

  for (const inv of client.invoices) {
    if (inv.status !== "CANCELLED") {
      const total = Number(inv.totalAmount);
      const paid = Number(inv.paidAmount);
      totalBilled += total;
      totalPaid += paid;
      totalOutstanding += total - paid;
    }
  }

  return c.json({
    client: {
      ...client,
      financialSummary: {
        totalBilled,
        totalPaid,
        totalOutstanding,
      },
    },
  });
});

// 3. Create client manually
const createClientSchema = z.object({
  companyName: z.string().min(1),
  contactPerson: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(5),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  billingAddress: z.string().min(5),
  shippingAddress: z.string().optional(),
  paymentTerms: z.string().default("Net 30"),
});

clientsRouter.post("/", requireRole(["SALES", "ADMIN"]), async (c) => {
  const body = await c.req.json();
  const parsed = createClientSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const clientCount = await prisma.client.count();
  const clientNumber = `CLI-${String(clientCount + 1001).padStart(4, "0")}`;

  const client = await prisma.client.create({
    data: {
      clientNumber,
      ...parsed.data,
      contacts: {
        create: [
          {
            name: parsed.data.contactPerson,
            email: parsed.data.email,
            phone: parsed.data.phone,
            isPrimary: true,
          },
        ],
      },
    },
  });

  return c.json({ client, message: "Client created successfully" }, 201);
});

// 4. List all documents across clients
clientsRouter.get("/documents/all", async (c) => {
  const documents = await prisma.document.findMany({
    include: {
      client: { select: { id: true, clientNumber: true, companyName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ documents });
});

// 5. Upload document metadata for client
const addDocumentSchema = z.object({
  name: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.number().nonnegative(),
  mimeType: z.string(),
});

clientsRouter.post("/:id/documents", async (c) => {
  const clientId = c.req.param("id");
  const body = await c.req.json();
  const parsed = addDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const doc = await prisma.document.create({
    data: {
      clientId,
      name: parsed.data.name,
      fileUrl: parsed.data.fileUrl,
      fileSize: parsed.data.fileSize,
      mimeType: parsed.data.mimeType,
    },
  });

  return c.json({ document: doc, message: "Document saved successfully" }, 201);
});

export { clientsRouter };

