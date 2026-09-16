import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { requireAuth, requireRole } from "../../middleware/rbac";

const leadsRouter = new Hono();
leadsRouter.use("*", requireAuth);

// 1. Get all leads (Sales, PM, Admin, Super Admin)
leadsRouter.get("/", requireRole(["SALES", "PROJECT_MANAGER", "ADMIN"]), async (c) => {
  const status = c.req.query("status");
  const search = c.req.query("search");

  const whereClause: any = {};
  if (status) {
    whereClause.status = status;
  }
  if (search) {
    whereClause.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { leadNumber: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      convertedClient: {
        select: { id: true, clientNumber: true, companyName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ leads });
});

// 2. Create Lead
const createLeadSchema = z.object({
  companyName: z.string().min(1),
  contactPerson: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(5),
  source: z.string().default("Website"),
  industry: z.string().optional(),
  serviceInterest: z.string().optional(),
  estimatedValue: z.number().nonnegative().default(0),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});

leadsRouter.post("/", requireRole(["SALES", "ADMIN"]), async (c) => {
  const body = await c.req.json();
  const parsed = createLeadSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const authUser = c.get("user");
  const count = await prisma.lead.count();
  const leadNumber = `LEAD-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const lead = await prisma.lead.create({
    data: {
      leadNumber,
      ...parsed.data,
      assignedToId: parsed.data.assignedToId || authUser.userId,
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      leadId: lead.id,
      authorId: authUser.userId,
      type: "STATUS_CHANGE",
      content: `Lead created with status NEW by ${authUser.name}`,
    },
  });

  return c.json({ lead, message: "Lead created successfully" }, 201);
});

// 3. Update Lead Status (Kanban drag-and-drop)
const updateStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "MEETING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]),
});

leadsRouter.patch("/:id/status", requireRole(["SALES", "ADMIN"]), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateStatusSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid status", details: parsed.error.issues }, 400);
  }

  const authUser = c.get("user");
  const previousLead = await prisma.lead.findUnique({ where: { id } });

  if (!previousLead) {
    return c.json({ error: "Lead not found" }, 404);
  }

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: { status: parsed.data.status },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      leadId: id,
      authorId: authUser.userId,
      type: "STATUS_CHANGE",
      content: `Status updated from ${previousLead.status} to ${parsed.data.status} by ${authUser.name}`,
    },
  });

  return c.json({ lead: updatedLead, message: "Status updated successfully" });
});

// 4. Atomic 1-Click "WON" Conversion into Client + Project + Retainer Draft
const convertLeadSchema = z.object({
  gstin: z.string().optional(),
  billingAddress: z.string().min(5),
  projectManagerId: z.string(),
  projectBudget: z.number().nonnegative().optional(),
});

leadsRouter.post("/:id/convert", requireRole(["SALES", "ADMIN"]), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = convertLeadSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const authUser = c.get("user");
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { convertedClient: true },
  });

  if (!lead) {
    return c.json({ error: "Lead not found" }, 404);
  }

  if (lead.convertedClientId) {
    return c.json({ error: "Lead already converted to Client" }, 400);
  }

  // Execute atomic multi-record creation via Prisma Transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Generate Client ID
    const clientCount = await tx.client.count();
    const clientNumber = `CLI-${String(clientCount + 1001).padStart(4, "0")}`;

    // 2. Create Client
    const client = await tx.client.create({
      data: {
        clientNumber,
        companyName: lead.companyName,
        contactPerson: lead.contactPerson,
        email: lead.email,
        phone: lead.phone,
        gstin: parsed.data.gstin,
        billingAddress: parsed.data.billingAddress,
        contacts: {
          create: [
            {
              name: lead.contactPerson,
              email: lead.email,
              phone: lead.phone,
              isPrimary: true,
            },
          ],
        },
      },
    });

    // 3. Mark Lead as WON and link Client
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        status: "WON",
        convertedClientId: client.id,
      },
    });

    // 4. Provision initial Project
    const project = await tx.project.create({
      data: {
        name: `${lead.companyName} - ${lead.serviceInterest || "Engagement"}`,
        clientId: client.id,
        managerId: parsed.data.projectManagerId,
        budget: parsed.data.projectBudget || lead.estimatedValue,
        status: "PLANNING",
        description: `Provisioned from won lead ${lead.leadNumber}.`,
      },
    });

    // 5. Log audit trail
    await tx.auditLog.create({
      data: {
        userId: authUser.userId,
        action: "CONVERT_LEAD",
        entityType: "LEAD",
        entityId: lead.id,
        diffJson: {
          leadId: lead.id,
          clientId: client.id,
          projectId: project.id,
          convertedBy: authUser.name,
        },
      },
    });

    return { client, project };
  });

  return c.json({
    message: "Lead successfully converted to Client and Project provisioned!",
    client: result.client,
    project: result.project,
  });
});

export { leadsRouter };
