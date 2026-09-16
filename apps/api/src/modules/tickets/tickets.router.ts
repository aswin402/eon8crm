import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { requireAuth, requireRole } from "../../middleware/rbac";

const ticketsRouter = new Hono();
ticketsRouter.use("*", requireAuth);

// 1. List all tickets
ticketsRouter.get("/", async (c) => {
  const status = c.req.query("status");
  const priority = c.req.query("priority");
  const clientId = c.req.query("clientId");

  const whereClause: any = {};
  if (status) whereClause.status = status;
  if (priority) whereClause.priority = priority;
  if (clientId) whereClause.clientId = clientId;

  const tickets = await prisma.ticket.findMany({
    where: whereClause,
    include: {
      client: { select: { id: true, clientNumber: true, companyName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate SLA countdown status
  const now = new Date();
  const enrichedTickets = tickets.map((t) => {
    let isSlaBreached = false;
    let slaTimeRemainingMinutes = null;

    if (t.slaDueTime && t.status !== "RESOLVED" && t.status !== "CLOSED") {
      const diffMs = new Date(t.slaDueTime).getTime() - now.getTime();
      slaTimeRemainingMinutes = Math.round(diffMs / (1000 * 60));
      if (slaTimeRemainingMinutes < 0) {
        isSlaBreached = true;
      }
    }

    return {
      ...t,
      sla: {
        isBreached: isSlaBreached,
        timeRemainingMinutes: slaTimeRemainingMinutes,
      },
    };
  });

  return c.json({ tickets: enrichedTickets });
});

// 2. Create Ticket
const createTicketSchema = z.object({
  clientId: z.string(),
  subject: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

ticketsRouter.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createTicketSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const count = await prisma.ticket.count();
  const ticketNumber = `TIK-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  // SLA due time calculation based on priority
  // URGENT: 4 hours, HIGH: 8 hours, MEDIUM: 24 hours, LOW: 48 hours
  const slaHours =
    parsed.data.priority === "URGENT"
      ? 4
      : parsed.data.priority === "HIGH"
      ? 8
      : parsed.data.priority === "MEDIUM"
      ? 24
      : 48;

  const slaDueTime = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      clientId: parsed.data.clientId,
      subject: parsed.data.subject,
      description: parsed.data.description,
      priority: parsed.data.priority,
      slaDueTime,
    },
    include: {
      client: { select: { companyName: true } },
    },
  });

  return c.json({ ticket, message: "Support ticket opened successfully" }, 201);
});

// 3. Update Ticket Status
const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_CLIENT", "RESOLVED", "CLOSED"]),
});

ticketsRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateTicketSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const dataToUpdate: any = { status: parsed.data.status };
  if (parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED") {
    dataToUpdate.resolvedAt = new Date();
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: dataToUpdate,
  });

  return c.json({ ticket, message: "Ticket status updated successfully" });
});

export { ticketsRouter };
