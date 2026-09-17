import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { requireAuth, requireRole } from "../../middleware/rbac";
import { generateCsv } from "../../utils/csv";

const expensesRouter = new Hono();
expensesRouter.use("*", requireAuth);

// 1. List Expenses with aggregation
expensesRouter.get("/", async (c) => {
  const category = c.req.query("category");
  const search = c.req.query("search");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  const whereClause: any = {};
  if (category && category !== "ALL") {
    whereClause.category = category;
  }
  if (search) {
    whereClause.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { vendor: { contains: search, mode: "insensitive" } },
    ];
  }
  if (startDate || endDate) {
    whereClause.expenseDate = {};
    if (startDate) whereClause.expenseDate.gte = new Date(startDate);
    if (endDate) whereClause.expenseDate.lte = new Date(endDate);
  }

  const [expenses, categoryTotals] = await Promise.all([
    prisma.expense.findMany({
      where: whereClause,
      orderBy: { expenseDate: "desc" },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const totalAmount = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);

  return c.json({
    expenses,
    summary: {
      totalAmount: Math.round(totalAmount),
      count: expenses.length,
      byCategory: categoryTotals.map((cat) => ({
        category: cat.category,
        total: Number(cat._sum.amount || 0),
        count: cat._count.id,
      })),
    },
  });
});

// 1.1 Export Expenses to CSV
expensesRouter.get("/export", async (c) => {
  const expenses = await prisma.expense.findMany({
    orderBy: { expenseDate: "desc" },
  });

  const headers = [
    "Date",
    "Category",
    "Description",
    "Vendor / Payee",
    "Amount (INR)",
  ];

  const rows = expenses.map((exp) => {
    const formattedDate = new Date(exp.expenseDate).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return [
      formattedDate,
      exp.category,
      exp.description,
      exp.vendor || "",
      Number(exp.amount).toFixed(2),
    ];
  });

  const csvContent = generateCsv(headers, rows);

  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", `attachment; filename="operational_expenses_${new Date().getFullYear()}.csv"`);
  return c.body(csvContent);
});

// 2. Create Expense
const createExpenseSchema = z.object({
  category: z.string().min(2),
  description: z.string().min(2),
  amount: z.number().positive("Amount must be greater than 0"),
  expenseDate: z.string().optional(),
  vendor: z.string().optional(),
  receiptUrl: z.string().url().optional().or(z.literal("")),
});

expensesRouter.post("/", requireRole(["FINANCE", "ADMIN"]), async (c) => {
  const body = await c.req.json();
  const parsed = createExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const { category, description, amount, expenseDate, vendor, receiptUrl } = parsed.data;

  const expense = await prisma.expense.create({
    data: {
      category,
      description,
      amount,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      vendor: vendor || null,
      receiptUrl: receiptUrl || null,
    },
  });

  return c.json({ expense, message: "Expense logged successfully" }, 201);
});

// 3. Delete Expense
expensesRouter.delete("/:id", requireRole(["FINANCE", "ADMIN"]), async (c) => {
  const id = c.req.param("id");

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Expense not found" }, 404);
  }

  await prisma.expense.delete({ where: { id } });

  return c.json({ message: "Expense deleted successfully" });
});

export { expensesRouter };
