import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { requireAuth, requireRole } from "../../middleware/rbac";
import { generateCsv } from "../../utils/csv";

const timeRouter = new Hono();
timeRouter.use("*", requireAuth);

// In-memory / fast active timer cache (syncs with Redis)
interface ActiveTimer {
  userId: string;
  projectId: string;
  taskId?: string;
  description: string;
  startTime: string; // ISO string
}

// 1. Get currently running timer for logged-in user
timeRouter.get("/timer/active", async (c) => {
  const authUser = c.get("user");
  const active = await prisma.timeEntry.findFirst({
    where: {
      userId: authUser.userId,
      endTime: null,
    },
    include: {
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  });

  if (!active) {
    return c.json({ activeTimer: null });
  }

  return c.json({
    activeTimer: {
      id: active.id,
      userId: active.userId,
      projectId: active.projectId,
      projectName: active.project.name,
      taskId: active.taskId,
      taskTitle: active.task?.title,
      description: active.description,
      startTime: active.startTime.toISOString(),
    },
  });
});

// 2. Start Live Timer
const startTimerSchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  description: z.string().default("General task work"),
});

timeRouter.post("/timer/start", async (c) => {
  const authUser = c.get("user");
  const body = await c.req.json();
  const parsed = startTimerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  // Prevent multiple concurrent active timers per user
  const existingTimer = await prisma.timeEntry.findFirst({
    where: {
      userId: authUser.userId,
      endTime: null,
    },
  });

  if (existingTimer) {
    return c.json(
      {
        error: "Timer already running. Stop the current timer before starting a new one.",
        activeTimer: existingTimer,
      },
      400
    );
  }

  // Fetch current user rates
  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { internalCostRate: true, billableRate: true },
  });

  const costRate = user?.internalCostRate || 0;
  const billingRate = user?.billableRate || 0;
  const startTime = new Date();

  const activeTimer = await prisma.timeEntry.create({
    data: {
      userId: authUser.userId,
      projectId: parsed.data.projectId,
      taskId: parsed.data.taskId || null,
      description: parsed.data.description,
      startTime,
      endTime: null, // Marks timer as currently running
      durationMinutes: 0,
      isBillable: true,
      costRate,
      billingRate,
    },
  });

  return c.json({
    message: "Timer started successfully",
    activeTimer: {
      id: activeTimer.id,
      userId: activeTimer.userId,
      projectId: activeTimer.projectId,
      taskId: activeTimer.taskId,
      description: activeTimer.description,
      startTime: activeTimer.startTime.toISOString(),
    },
  });
});

// 3. Stop Live Timer & Persist Duration
const stopTimerSchema = z.object({
  description: z.string().optional(),
  isBillable: z.boolean().default(true),
});

timeRouter.post("/timer/stop", async (c) => {
  const authUser = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const parsed = stopTimerSchema.safeParse(body);

  const activeTimer = await prisma.timeEntry.findFirst({
    where: {
      userId: authUser.userId,
      endTime: null,
    },
  });

  if (!activeTimer) {
    return c.json({ error: "No active timer running for this user" }, 400);
  }

  const endTime = new Date();
  const diffMs = endTime.getTime() - activeTimer.startTime.getTime();
  const durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  const updatedEntry = await prisma.timeEntry.update({
    where: { id: activeTimer.id },
    data: {
      endTime,
      durationMinutes,
      description: parsed.data?.description || activeTimer.description,
      isBillable: parsed.data?.isBillable ?? true,
    },
    include: {
      project: { select: { name: true } },
      task: { select: { title: true } },
    },
  });

  return c.json({
    message: "Timer stopped and time entry logged successfully",
    timeEntry: updatedEntry,
  });
});

// 4. List Time Entries
timeRouter.get("/entries", async (c) => {
  const projectId = c.req.query("projectId");
  const userId = c.req.query("userId");
  const isBilled = c.req.query("isBilled");

  const whereClause: any = {};
  if (projectId) whereClause.projectId = projectId;
  if (userId) whereClause.userId = userId;
  if (isBilled !== undefined) whereClause.isBilled = isBilled === "true";

  const entries = await prisma.timeEntry.findMany({
    where: whereClause,
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { startTime: "desc" },
    take: 50,
  });

  return c.json({ entries });
});

// 5. Manager Timesheet Approval
timeRouter.patch("/entries/:id/approve", requireRole(["PROJECT_MANAGER", "ADMIN"]), async (c) => {
  const id = c.req.param("id");

  const entry = await prisma.timeEntry.update({
    where: { id },
    data: { isApproved: true },
  });

  return c.json({ entry, message: "Timesheet entry approved" });
});

// 6. Manual Time Entry Creation
const manualTimeEntrySchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  description: z.string().min(2),
  startTime: z.string(),
  durationMinutes: z.number().positive(),
  isBillable: z.boolean().default(true),
});

timeRouter.post("/entries", async (c) => {
  const authUser = c.get("user");
  const body = await c.req.json();
  const parsed = manualTimeEntrySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { internalCostRate: true, billableRate: true },
  });

  const costRate = user?.internalCostRate || 0;
  const billingRate = user?.billableRate || 0;

  const start = new Date(parsed.data.startTime);
  const end = new Date(start.getTime() + parsed.data.durationMinutes * 60000);

  const timeEntry = await prisma.timeEntry.create({
    data: {
      userId: authUser.userId,
      projectId: parsed.data.projectId,
      taskId: parsed.data.taskId || null,
      description: parsed.data.description,
      startTime: start,
      endTime: end,
      durationMinutes: parsed.data.durationMinutes,
      isBillable: parsed.data.isBillable,
      costRate,
      billingRate,
    },
    include: {
      project: { select: { name: true } },
      task: { select: { title: true } },
    },
  });

  return c.json({ timeEntry, message: "Time entry logged successfully" }, 201);
});

// 7. Export Timesheets to CSV
timeRouter.get("/export", async (c) => {
  const entries = await prisma.timeEntry.findMany({
    include: {
      user: { select: { name: true, email: true } },
      project: { select: { name: true, client: { select: { companyName: true } } } },
      task: { select: { title: true } },
    },
    orderBy: { startTime: "desc" },
  });

  const headers = [
    "Date",
    "Team Member",
    "Email",
    "Client",
    "Project",
    "Task",
    "Duration (Hours)",
    "Duration (Minutes)",
    "Cost Rate (INR/hr)",
    "Labor Cost (INR)",
    "Billable Rate (INR/hr)",
    "Billable Total (INR)",
    "Is Billable",
    "Status",
  ];

  const rows = entries.map((e) => {
    const formattedDate = new Date(e.startTime).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const hours = (e.durationMinutes / 60).toFixed(2);
    const laborCost = ((e.durationMinutes / 60) * Number(e.costRate)).toFixed(2);
    const billableVal = e.isBillable ? ((e.durationMinutes / 60) * Number(e.billingRate)).toFixed(2) : "0.00";

    return [
      formattedDate,
      e.user.name,
      e.user.email,
      e.project.client?.companyName || "",
      e.project.name,
      e.task?.title || e.description || "",
      hours,
      e.durationMinutes,
      Number(e.costRate).toFixed(2),
      laborCost,
      Number(e.billingRate).toFixed(2),
      billableVal,
      e.isBillable ? "Yes" : "No",
      e.isApproved ? "Approved" : "Pending",
    ];
  });

  const csvContent = generateCsv(headers, rows);

  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", `attachment; filename="timesheet_labor_logs_${new Date().getFullYear()}.csv"`);
  return c.body(csvContent);
});

export { timeRouter };

