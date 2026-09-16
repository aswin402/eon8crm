import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { requireAuth, requireRole } from "../../middleware/rbac";

const usersRouter = new Hono();

// All user management routes require ADMIN or SUPER_ADMIN
usersRouter.use("*", requireAuth);

// List active staff members for dropdown selectors (assignee, PM, sales rep)
usersRouter.get("/assignable", async (c) => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
    },
    orderBy: { name: "asc" },
  });

  return c.json({ users });
});

usersRouter.get("/", requireRole(["ADMIN"]), async (c) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      internalCostRate: true,
      billableRate: true,
      createdAt: true,
      _count: {
        select: {
          assignedTasks: true,
          timeEntries: true,
          managedProjects: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ users });
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "SALES", "PROJECT_MANAGER", "EMPLOYEE", "FINANCE"]).optional(),
  phone: z.string().optional(),
  internalCostRate: z.number().nonnegative().optional(),
  billableRate: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

usersRouter.patch("/:id", requireRole(["ADMIN"]), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      internalCostRate: true,
      billableRate: true,
      isActive: true,
    },
  });

  return c.json({ user: updatedUser, message: "User updated successfully" });
});

export { usersRouter };
