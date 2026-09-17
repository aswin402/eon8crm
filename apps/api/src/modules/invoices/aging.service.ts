import { prisma } from "../../utils/prisma";

export interface AgingBucketDetail {
  amount: number;
  count: number;
}

export interface DebtorEntry {
  client: {
    id: string;
    clientNumber: string;
    companyName: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    paymentTerms?: string | null;
  };
  totalOutstanding: number;
  current: number;
  overdue1to30: number;
  overdue31to60: number;
  overdue61to90: number;
  overdue90Plus: number;
  days1to30: number;
  days31to60: number;
  days60plus: number;
  totalOverdue: number;
  maxDaysOverdue: number;
  oldestDueDate: string | Date;
  invoicesCount: number;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    issueDate: Date | string;
    dueDate: Date | string;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    daysOverdue: number;
    bucket: string;
    status: string;
    projectName?: string;
  }>;
}

export async function getAccountsReceivableAging() {
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

  let totalOutstanding = 0;
  let currentAmount = 0;
  let overdue1to30Amount = 0;
  let overdue31to60Amount = 0;
  let overdue61to90Amount = 0;
  let overdue90PlusAmount = 0;

  let currentCount = 0;
  let overdue1to30Count = 0;
  let overdue31to60Count = 0;
  let overdue61to90Count = 0;
  let overdue90PlusCount = 0;

  const clientMap = new Map<string, DebtorEntry>();

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
          days1to30: 0,
          days31to60: 0,
          days60plus: 0,
          maxDaysOverdue: 0,
          oldestDueDate: inv.dueDate,
          totalOverdue: 0,
          invoicesCount: 0,
          invoices: [],
        });
      }

      const clientEntry = clientMap.get(cId)!;
      clientEntry.totalOutstanding += balance;
      if (bucket === "CURRENT") {
        clientEntry.current += balance;
      } else if (bucket === "1-30") {
        clientEntry.overdue1to30 += balance;
        clientEntry.days1to30 += balance;
      } else if (bucket === "31-60") {
        clientEntry.overdue31to60 += balance;
        clientEntry.days31to60 += balance;
      } else if (bucket === "61-90") {
        clientEntry.overdue61to90 += balance;
        clientEntry.days60plus += balance;
      } else if (bucket === "90+") {
        clientEntry.overdue90Plus += balance;
        clientEntry.days60plus += balance;
      }

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

  const debtors = Array.from(clientMap.values())
    .map((entry) => ({
      ...entry,
      totalOutstanding: Math.round(entry.totalOutstanding),
      current: Math.round(entry.current),
      overdue1to30: Math.round(entry.overdue1to30),
      overdue31to60: Math.round(entry.overdue31to60),
      overdue61to90: Math.round(entry.overdue61to90),
      overdue90Plus: Math.round(entry.overdue90Plus),
      days1to30: Math.round(entry.days1to30),
      days31to60: Math.round(entry.days31to60),
      days60plus: Math.round(entry.days60plus),
      totalOverdue: Math.round(
        entry.overdue1to30 + entry.overdue31to60 + entry.overdue61to90 + entry.overdue90Plus
      ),
      invoicesCount: entry.invoices.length,
    }))
    .sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  return {
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
    legacyBuckets: {
      current: { label: "Current (Not Due)", total: Math.round(currentAmount), count: currentCount },
      days1to30: { label: "1 - 30 Days", total: Math.round(overdue1to30Amount), count: overdue1to30Count },
      days31to60: { label: "31 - 60 Days", total: Math.round(overdue31to60Amount), count: overdue31to60Count },
      days60plus: {
        label: "60+ Days",
        total: Math.round(overdue61to90Amount + overdue90PlusAmount),
        count: overdue61to90Count + overdue90PlusCount,
      },
    },
    debtors,
    processedInvoices,
  };
}
