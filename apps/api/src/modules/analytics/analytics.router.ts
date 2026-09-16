import { Hono } from "hono";
import { prisma } from "../../utils/prisma";
import { requireAuth, requireRole } from "../../middleware/rbac";

const analyticsRouter = new Hono();
analyticsRouter.use("*", requireAuth);

// 1. Executive Dashboard KPIs
analyticsRouter.get("/dashboard", requireRole(["ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER", "FINANCE"]), async (c) => {
  // 1. KPI Counts
  const [activeClientsCount, openProjectsCount, totalLeadsCount] = await Promise.all([
    prisma.client.count({ where: { isActive: true } }),
    prisma.project.count({ where: { status: { in: ["PLANNING", "ACTIVE", "REVIEW"] } } }),
    prisma.lead.count(),
  ]);

  // 2. Financial Metrics (Outstanding & Cleared Revenue)
  const invoices = await prisma.invoice.findMany({
    where: { status: { not: "CANCELLED" } },
    select: {
      totalAmount: true,
      paidAmount: true,
      status: true,
      dueDate: true,
    },
  });

  let totalOutstanding = 0;
  let totalBilled = 0;
  let totalCollected = 0;
  let overdueAmount = 0;
  const now = new Date();

  for (const inv of invoices) {
    const total = Number(inv.totalAmount);
    const paid = Number(inv.paidAmount);
    const pending = total - paid;

    totalBilled += total;
    totalCollected += paid;
    if (pending > 0) {
      totalOutstanding += pending;
      if (new Date(inv.dueDate) < now) {
        overdueAmount += pending;
      }
    }
  }

  // 3. Lead Funnel Breakdown
  const leadsByStatus = await prisma.lead.groupBy({
    by: ["status"],
    _count: { id: true },
    _sum: { estimatedValue: true },
  });

  // 4. Project Margin Rankings
  const projects = await prisma.project.findMany({
    where: { status: "ACTIVE" },
    include: {
      client: { select: { companyName: true } },
      timeEntries: { select: { durationMinutes: true, costRate: true } },
      invoices: {
        where: { status: { not: "CANCELLED" } },
        select: { totalAmount: true },
      },
    },
    take: 5,
  });

  const projectProfits = projects.map((p) => {
    let laborCost = 0;
    for (const te of p.timeEntries) {
      laborCost += (te.durationMinutes / 60) * Number(te.costRate);
    }
    let billed = 0;
    for (const inv of p.invoices) {
      billed += Number(inv.totalAmount);
    }
    const profit = billed - laborCost;
    const margin = billed > 0 ? Math.round((profit / billed) * 100) : 0;
    return {
      id: p.id,
      name: p.name,
      client: p.client.companyName,
      billed,
      laborCost: Math.round(laborCost),
      profit: Math.round(profit),
      margin,
    };
  });

  return c.json({
    kpis: {
      activeClients: activeClientsCount,
      openProjects: openProjectsCount,
      totalLeads: totalLeadsCount,
      totalOutstanding: Math.round(totalOutstanding),
      overdueAmount: Math.round(overdueAmount),
      totalCollected: Math.round(totalCollected),
      totalBilled: Math.round(totalBilled),
    },
    leadFunnel: leadsByStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
      value: Number(s._sum.estimatedValue || 0),
    })),
    projectProfits,
  });
});

// 2. 6-Month Cash Flow & Profit Trend
analyticsRouter.get("/cashflow", requireRole(["ADMIN", "SUPER_ADMIN", "FINANCE"]), async (c) => {
  const now = new Date();
  const months: Array<{ name: string; year: number; month: number; start: Date; end: Date }> = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    months.push({
      name: d.toLocaleString("default", { month: "short", year: "2-digit" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      start,
      end,
    });
  }

  const [invoices, payments, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        issueDate: { gte: months[0].start },
        status: { not: "CANCELLED" },
      },
      select: { totalAmount: true, issueDate: true },
    }),
    prisma.payment.findMany({
      where: {
        paymentDate: { gte: months[0].start },
      },
      select: { amount: true, paymentDate: true },
    }),
    prisma.expense.findMany({
      where: {
        expenseDate: { gte: months[0].start },
      },
      select: { amount: true, expenseDate: true, category: true },
    }),
  ]);

  const trends = months.map((m) => {
    let billed = 0;
    for (const inv of invoices) {
      if (inv.issueDate >= m.start && inv.issueDate <= m.end) {
        billed += Number(inv.totalAmount);
      }
    }

    let collected = 0;
    for (const pay of payments) {
      if (pay.paymentDate >= m.start && pay.paymentDate <= m.end) {
        collected += Number(pay.amount);
      }
    }

    let totalExpense = 0;
    for (const exp of expenses) {
      if (exp.expenseDate >= m.start && exp.expenseDate <= m.end) {
        totalExpense += Number(exp.amount);
      }
    }

    const netProfit = collected - totalExpense;
    const margin = collected > 0 ? Math.round((netProfit / collected) * 100) : 0;

    return {
      month: m.name,
      billed: Math.round(billed),
      collected: Math.round(collected),
      expenses: Math.round(totalExpense),
      netProfit: Math.round(netProfit),
      margin,
    };
  });

  const totals = trends.reduce(
    (acc, t) => ({
      billed: acc.billed + t.billed,
      collected: acc.collected + t.collected,
      expenses: acc.expenses + t.expenses,
      netProfit: acc.netProfit + t.netProfit,
    }),
    { billed: 0, collected: 0, expenses: 0, netProfit: 0 }
  );

  return c.json({ trends, totals });
});

// 3. Accounts Receivable (AR) Aging Analysis
analyticsRouter.get("/aging", requireRole(["ADMIN", "SUPER_ADMIN", "FINANCE"]), async (c) => {
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
    },
    include: {
      client: { select: { id: true, clientNumber: true, companyName: true, email: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();
  const buckets = {
    current: { label: "Current (Not Due)", total: 0, count: 0 },
    days1to30: { label: "1 - 30 Days", total: 0, count: 0 },
    days31to60: { label: "31 - 60 Days", total: 0, count: 0 },
    days60plus: { label: "60+ Days", total: 0, count: 0 },
  };

  const clientAgingMap = new Map<
    string,
    {
      client: { id: string; clientNumber: string; companyName: string; email: string };
      current: number;
      days1to30: number;
      days31to60: number;
      days60plus: number;
      totalOutstanding: number;
      invoices: Array<{
        id: string;
        invoiceNumber: string;
        dueDate: string;
        daysOverdue: number;
        total: number;
        paid: number;
        balance: number;
        bucket: string;
      }>;
    }
  >();

  for (const inv of unpaidInvoices) {
    const total = Number(inv.totalAmount);
    const paid = Number(inv.paidAmount);
    const balance = total - paid;
    if (balance <= 0) continue;

    const due = new Date(inv.dueDate);
    const diffMs = now.getTime() - due.getTime();
    const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let bucket: "current" | "days1to30" | "days31to60" | "days60plus" = "current";
    if (daysOverdue > 60) {
      bucket = "days60plus";
    } else if (daysOverdue > 30) {
      bucket = "days31to60";
    } else if (daysOverdue > 0) {
      bucket = "days1to30";
    }

    buckets[bucket].total += balance;
    buckets[bucket].count += 1;

    let clientEntry = clientAgingMap.get(inv.clientId);
    if (!clientEntry) {
      clientEntry = {
        client: inv.client,
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days60plus: 0,
        totalOutstanding: 0,
        invoices: [],
      };
      clientAgingMap.set(inv.clientId, clientEntry);
    }

    clientEntry[bucket] += balance;
    clientEntry.totalOutstanding += balance;
    clientEntry.invoices.push({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      dueDate: inv.dueDate.toISOString(),
      daysOverdue: Math.max(0, daysOverdue),
      total,
      paid,
      balance,
      bucket,
    });
  }

  const clientBreakdown = Array.from(clientAgingMap.values()).sort(
    (a, b) => b.totalOutstanding - a.totalOutstanding
  );

  const totalOutstanding =
    buckets.current.total + buckets.days1to30.total + buckets.days31to60.total + buckets.days60plus.total;

  return c.json({
    summary: {
      totalOutstanding: Math.round(totalOutstanding),
      buckets: {
        current: { ...buckets.current, total: Math.round(buckets.current.total) },
        days1to30: { ...buckets.days1to30, total: Math.round(buckets.days1to30.total) },
        days31to60: { ...buckets.days31to60, total: Math.round(buckets.days31to60.total) },
        days60plus: { ...buckets.days60plus, total: Math.round(buckets.days60plus.total) },
      },
    },
    clientBreakdown,
  });
});

// 4. Live Operational Alerts Feed for Notification Bell
analyticsRouter.get("/alerts", async (c) => {
  const now = new Date();

  const [overdueInvoices, urgentTickets, unbilledEntries, newLeads] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        status: { in: ["OVERDUE", "SENT", "PARTIAL"] },
        dueDate: { lt: now },
      },
      include: { client: { select: { companyName: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.ticket.findMany({
      where: {
        status: { notIn: ["RESOLVED", "CLOSED"] },
        priority: { in: ["HIGH", "URGENT"] },
      },
      include: { client: { select: { companyName: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.timeEntry.aggregate({
      where: {
        isBillable: true,
        isBilled: false,
      },
      _count: { id: true },
      _sum: { durationMinutes: true },
    }),
    prisma.lead.count({
      where: { status: "NEW" },
    }),
  ]);

  const alerts: Array<{
    id: string;
    type: "danger" | "warning" | "info" | "neutral";
    title: string;
    description: string;
    href: string;
    timestamp: Date;
  }> = [];

  // Overdue Invoices Alert
  if (overdueInvoices.length > 0) {
    const totalOverdue = overdueInvoices.reduce(
      (acc, inv) => acc + (Number(inv.totalAmount) - Number(inv.paidAmount)),
      0
    );
    alerts.push({
      id: "overdue-invoices",
      type: "danger",
      title: `${overdueInvoices.length} Overdue Invoice${overdueInvoices.length > 1 ? "s" : ""} (₹${totalOverdue.toLocaleString("en-IN")})`,
      description: `Earliest: ${overdueInvoices[0].invoiceNumber} • ${overdueInvoices[0].client.companyName}`,
      href: "/invoices",
      timestamp: overdueInvoices[0].dueDate,
    });
  }

  // Urgent Tickets SLA Alert
  if (urgentTickets.length > 0) {
    alerts.push({
      id: "urgent-tickets",
      type: "warning",
      title: `${urgentTickets.length} SLA High/Urgent Ticket${urgentTickets.length > 1 ? "s" : ""}`,
      description: `Latest: "${urgentTickets[0].subject}" (${urgentTickets[0].client?.companyName || "General"})`,
      href: "/tickets",
      timestamp: urgentTickets[0].createdAt,
    });
  }

  // Unbilled Timesheet Alert
  if ((unbilledEntries._count.id || 0) > 0) {
    const hours = ((unbilledEntries._sum.durationMinutes || 0) / 60).toFixed(1);
    alerts.push({
      id: "unbilled-time",
      type: "info",
      title: `${hours}h Unbilled Timesheet Logs`,
      description: `${unbilledEntries._count.id} billable labor sessions ready for client invoicing`,
      href: "/time",
      timestamp: now,
    });
  }

  // New Leads Alert
  if (newLeads > 0) {
    alerts.push({
      id: "new-leads",
      type: "neutral",
      title: `${newLeads} Unqualified Lead${newLeads > 1 ? "s" : ""}`,
      description: "Inbound leads in pipeline awaiting sales qualification",
      href: "/leads",
      timestamp: now,
    });
  }

  return c.json({
    unreadCount: alerts.length,
    alerts,
    systemHealthy: true,
  });
});

export { analyticsRouter };
