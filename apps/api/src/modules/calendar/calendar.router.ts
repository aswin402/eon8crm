import { Hono } from "hono";
import { prisma } from "../../utils/prisma";
import { requireAuth } from "../../middleware/rbac";

const calendarRouter = new Hono();
calendarRouter.use("*", requireAuth);

calendarRouter.get("/events", async (c) => {
  const startParam = c.req.query("start");
  const endParam = c.req.query("end");

  // Default range: 30 days past to 60 days future
  const now = new Date();
  const startDate = startParam ? new Date(startParam) : new Date(now.getTime() - 30 * 86400000);
  const endDate = endParam ? new Date(endParam) : new Date(now.getTime() + 60 * 86400000);

  const [projects, invoices, tickets, activities] = await Promise.all([
    // 1. Projects with due dates
    prisma.project.findMany({
      where: {
        dueDate: { gte: startDate, lte: endDate },
      },
      include: {
        client: { select: { companyName: true } },
        manager: { select: { name: true } },
      },
    }),

    // 2. Invoices with payment due dates
    prisma.invoice.findMany({
      where: {
        dueDate: { gte: startDate, lte: endDate },
        status: { not: "CANCELLED" },
      },
      include: {
        client: { select: { companyName: true } },
      },
    }),

    // 3. Tickets with SLA deadlines
    prisma.ticket.findMany({
      where: {
        slaDueTime: { gte: startDate, lte: endDate },
        status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_CLIENT"] },
      },
      include: {
        client: { select: { companyName: true } },
      },
    }),

    // 4. Follow-up Activities & Meetings
    prisma.activityLog.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        author: { select: { name: true } },
        client: { select: { companyName: true } },
        lead: { select: { companyName: true, contactPerson: true } },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const events: Array<{
    id: string;
    title: string;
    type: "PROJECT_DEADLINE" | "INVOICE_DUE" | "TICKET_SLA" | "ACTIVITY";
    date: string;
    status?: string;
    priority?: string;
    amount?: number;
    entityId: string;
    link: string;
    description?: string;
    metadata?: Record<string, any>;
  }> = [];

  // Map Projects
  for (const p of projects) {
    if (p.dueDate) {
      events.push({
        id: `proj-${p.id}`,
        title: `Project Deadline: ${p.name}`,
        type: "PROJECT_DEADLINE",
        date: p.dueDate.toISOString(),
        status: p.status,
        entityId: p.id,
        link: `/projects`,
        description: `Client: ${p.client.companyName} | Lead: ${p.manager.name}`,
        metadata: { client: p.client.companyName, budget: Number(p.budget) },
      });
    }
  }

  // Map Invoices
  for (const inv of invoices) {
    const isOverdue = new Date(inv.dueDate) < now && inv.status !== "PAID";
    events.push({
      id: `inv-${inv.id}`,
      title: `Invoice Due: ${inv.invoiceNumber} (₹${Number(inv.totalAmount).toLocaleString("en-IN")})`,
      type: "INVOICE_DUE",
      date: inv.dueDate.toISOString(),
      status: isOverdue ? "OVERDUE" : inv.status,
      amount: Number(inv.totalAmount) - Number(inv.paidAmount),
      entityId: inv.id,
      link: `/invoices`,
      description: `Client: ${inv.client.companyName} | Balance: ₹${(Number(inv.totalAmount) - Number(inv.paidAmount)).toLocaleString("en-IN")}`,
      metadata: { invoiceNumber: inv.invoiceNumber, client: inv.client.companyName },
    });
  }

  // Map Tickets
  for (const t of tickets) {
    events.push({
      id: `tick-${t.id}`,
      title: `SLA Breach Deadline: ${t.ticketNumber} - ${t.subject}`,
      type: "TICKET_SLA",
      date: t.slaDueTime ? t.slaDueTime.toISOString() : t.createdAt.toISOString(),
      status: t.status,
      priority: t.priority,
      entityId: t.id,
      link: `/tickets`,
      description: `Client: ${t.client.companyName} | Priority: ${t.priority}`,
      metadata: { ticketNumber: t.ticketNumber, priority: t.priority },
    });
  }

  // Map Activities
  for (const a of activities) {
    events.push({
      id: `act-${a.id}`,
      title: `${a.type}: ${a.lead ? a.lead.companyName : a.client?.companyName || "Follow-up"}`,
      type: "ACTIVITY",
      date: a.createdAt.toISOString(),
      entityId: a.id,
      link: a.clientId ? `/clients/${a.clientId}` : `/leads`,
      description: a.content.slice(0, 80),
      metadata: { author: a.author?.name, type: a.type },
    });
  }

  // Sort chronological
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return c.json({ events, total: events.length });
});

export { calendarRouter };
