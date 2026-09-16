import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { requireAuth } from "../../middleware/rbac";

const chatterRouter = new Hono();
chatterRouter.use("*", requireAuth);

// 1. Get activities for lead or client
chatterRouter.get("/", async (c) => {
  const leadId = c.req.query("leadId");
  const clientId = c.req.query("clientId");

  const whereClause: any = {};
  if (leadId) whereClause.leadId = leadId;
  if (clientId) whereClause.clientId = clientId;

  const activities = await prisma.activityLog.findMany({
    where: whereClause,
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return c.json({ activities });
});

// 2. Post new activity
const createActivitySchema = z.object({
  type: z.enum(["NOTE", "CALL", "STATUS_CHANGE", "EMAIL", "TASK"]).default("NOTE"),
  content: z.string().min(1),
  isInternalOnly: z.boolean().default(true),
  leadId: z.string().optional(),
  clientId: z.string().optional(),
});

chatterRouter.post("/", async (c) => {
  const authUser = c.get("user");
  const body = await c.req.json();
  const parsed = createActivitySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.issues }, 400);
  }

  const activity = await prisma.activityLog.create({
    data: {
      authorId: authUser.userId,
      type: parsed.data.type,
      content: parsed.data.content,
      isInternalOnly: parsed.data.isInternalOnly,
      leadId: parsed.data.leadId,
      clientId: parsed.data.clientId,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return c.json({ activity, message: "Activity posted successfully" }, 201);
});

export { chatterRouter };
