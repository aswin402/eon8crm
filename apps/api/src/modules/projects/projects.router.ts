import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { requireAuth, requireRole } from "../../middleware/rbac";

const projectsRouter = new Hono();
projectsRouter.use("*", requireAuth);

// 1. List all projects with progress and margin indicator
projectsRouter.get("/", async (c) => {
  const status = c.req.query("status");
  const clientId = c.req.query("clientId");

  const whereClause: any = {};
  if (status) whereClause.status = status;
  if (clientId) whereClause.clientId = clientId;

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      client: { select: { id: true, clientNumber: true, companyName: true } },
      manager: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, timeEntries: true, milestones: true } },
      tasks: {
        select: { isCompleted: true },
      },
      timeEntries: {
        select: {
          durationMinutes: true,
          costRate: true,
          billingRate: true,
          isBillable: true,
        },
      },
      invoices: {
        where: { status: { not: "CANCELLED" } },
        select: { totalAmount: true, paidAmount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const enrichedProjects = projects.map((project) => {
    // Task progress calculation
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.isCompleted).length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Financial & Profitability metrics (Ever Gauzy & Scoro Model)
    let totalLaborCost = 0;
    let totalBillableValue = 0;
    let totalMinutesLogged = 0;

    for (const te of project.timeEntries) {
      totalMinutesLogged += te.durationMinutes;
      const hours = te.durationMinutes / 60;
      totalLaborCost += hours * Number(te.costRate);
      if (te.isBillable) {
        totalBillableValue += hours * Number(te.billingRate);
      }
    }

    let totalBilled = 0;
    let totalPaid = 0;
    for (const inv of project.invoices) {
      totalBilled += Number(inv.totalAmount);
      totalPaid += Number(inv.paidAmount);
    }

    // Benchmark gross profit against billed amount (or billable value if unbilled)
    const effectiveRevenue = totalBilled > 0 ? totalBilled : totalBillableValue;
    const grossProfit = effectiveRevenue - totalLaborCost;
    const marginPercentage =
      effectiveRevenue > 0 ? Math.round((grossProfit / effectiveRevenue) * 100) : 0;

    // Status Pill: High (>40%), Healthy (20-40%), Danger (<20%)
    let marginHealth = "HEALTHY";
    if (marginPercentage >= 40) marginHealth = "HIGH";
    else if (marginPercentage < 20) marginHealth = "DANGER";

    const { tasks, timeEntries, invoices, ...cleanProject } = project;

    return {
      ...cleanProject,
      stats: {
        totalTasks,
        completedTasks,
        progressPercentage,
        totalHoursLogged: (totalMinutesLogged / 60).toFixed(1),
        totalLaborCost: Math.round(totalLaborCost),
        totalBilled: Math.round(totalBilled),
        totalPaid: Math.round(totalPaid),
        grossProfit: Math.round(grossProfit),
        marginPercentage,
        marginHealth,
      },
    };
  });

  return c.json({ projects: enrichedProjects });
});

// 2. Project Detail View
projectsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
      milestones: { orderBy: { createdAt: "asc" } },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      timeEntries: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          task: { select: { id: true, title: true } },
        },
        orderBy: { startTime: "desc" },
        take: 20,
      },
      invoices: {
        orderBy: { issueDate: "desc" },
      },
    },
  });

  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }

  return c.json({ project });
});

// 3. Create Project
const createProjectSchema = z.object({
  name: z.string().min(1),
  clientId: z.string(),
  managerId: z.string(),
  budget: z.number().nonnegative().default(0),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
});

projectsRouter.post("/", requireRole(["PROJECT_MANAGER", "ADMIN"]), async (c) => {
  const body = await c.req.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      clientId: parsed.data.clientId,
      managerId: parsed.data.managerId,
      budget: parsed.data.budget,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      description: parsed.data.description,
    },
    include: {
      client: { select: { companyName: true } },
      manager: { select: { name: true } },
    },
  });

  return c.json({ project, message: "Project created successfully" }, 201);
});

// 4. Create Task under Project
const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

projectsRouter.post("/:id/tasks", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      assigneeId: parsed.data.assigneeId,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  return c.json({ task, message: "Task created successfully" }, 201);
});

// 5. Update Task Status
projectsRouter.patch("/tasks/:taskId", async (c) => {
  const taskId = c.req.param("taskId");
  const body = await c.req.json();

  const task = await prisma.task.update({
    where: { id: taskId },
    data: body,
  });

  return c.json({ task, message: "Task updated successfully" });
});

// 6. List all tasks across projects
projectsRouter.get("/all/tasks", async (c) => {
  const isCompletedParam = c.req.query("isCompleted");
  const priority = c.req.query("priority");
  const projectId = c.req.query("projectId");

  const whereClause: any = {};
  if (isCompletedParam !== undefined) {
    whereClause.isCompleted = isCompletedParam === "true";
  }
  if (priority && priority !== "ALL") {
    whereClause.priority = priority;
  }
  if (projectId) {
    whereClause.projectId = projectId;
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      project: { select: { id: true, name: true, client: { select: { companyName: true } } } },
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return c.json({ tasks });
});

// 7. Update Project Status
const updateProjectStatusSchema = z.object({
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "REVIEW", "COMPLETED", "ARCHIVED"]),
});

projectsRouter.patch("/:id/status", requireRole(["PROJECT_MANAGER", "ADMIN"]), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateProjectStatusSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid status", details: parsed.error.issues }, 400);
  }

  const project = await prisma.project.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return c.json({ project, message: "Project status updated" });
});

// 8. Create Milestone
const createMilestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().nonnegative().default(0),
  completionDate: z.string().optional(),
});

projectsRouter.post("/:id/milestones", requireRole(["PROJECT_MANAGER", "ADMIN"]), async (c) => {
  const projectId = c.req.param("id");
  if (!projectId) {
    return c.json({ error: "Project ID is required" }, 400);
  }

  const body = await c.req.json();
  const parsed = createMilestoneSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      title: parsed.data.title,
      description: parsed.data.description,
      amount: parsed.data.amount,
      completionDate: parsed.data.completionDate ? new Date(parsed.data.completionDate) : undefined,
    },
  });

  return c.json({ milestone, message: "Milestone created" }, 201);
});

// 9. Update Milestone (e.g. approve or mark billed)
projectsRouter.patch("/milestones/:milestoneId", requireRole(["PROJECT_MANAGER", "ADMIN"]), async (c) => {
  const milestoneId = c.req.param("milestoneId");
  if (!milestoneId) {
    return c.json({ error: "Milestone ID is required" }, 400);
  }

  const body = await c.req.json();

  const milestone = await prisma.milestone.update({
    where: { id: milestoneId },
    data: body,
  });

  return c.json({ milestone, message: "Milestone updated" });
});

export { projectsRouter };

