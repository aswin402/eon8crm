import { Hono } from "hono";
import { logger as httpLogger } from "hono/logger";
import { cors } from "hono/cors";
import { logger } from "./utils/logger";
import { globalErrorHandler } from "./middleware/error";

// Domain Modules
import { authRouter } from "./modules/auth/auth.router";
import { usersRouter } from "./modules/users/users.router";
import { leadsRouter } from "./modules/leads/leads.router";
import { clientsRouter } from "./modules/clients/clients.router";
import { projectsRouter } from "./modules/projects/projects.router";
import { timeRouter } from "./modules/time/time.router";
import { invoicesRouter } from "./modules/invoices/invoices.router";
import { expensesRouter } from "./modules/expenses/expenses.router";
import { analyticsRouter } from "./modules/analytics/analytics.router";
import { ticketsRouter } from "./modules/tickets/tickets.router";
import { chatterRouter } from "./modules/chatter/chatter.router";
import { calendarRouter } from "./modules/calendar/calendar.router";
import { settingsRouter } from "./modules/settings/settings.router";
import { scheduleSystemCronJobs, systemWorker } from "./jobs/cron.workers";

const app = new Hono();
const PORT = Number(process.env.PORT) || 3001;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use("*", httpLogger());
app.use(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (c) => {
  return c.json({
    name: "EON8 CRM API",
    version: "1.0.0",
    status: "online",
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      leads: "/api/v1/leads",
      clients: "/api/v1/clients",
      projects: "/api/v1/projects",
      time: "/api/v1/time",
      invoices: "/api/v1/invoices",
      expenses: "/api/v1/expenses",
      analytics: "/api/v1/analytics",
      tickets: "/api/v1/tickets",
      chatter: "/api/v1/chatter",
      calendar: "/api/v1/calendar",
      settings: "/api/v1/settings",
    },
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount All Domain Routes
app.route("/api/v1/auth", authRouter);
app.route("/api/v1/users", usersRouter);
app.route("/api/v1/leads", leadsRouter);
app.route("/api/v1/clients", clientsRouter);
app.route("/api/v1/projects", projectsRouter);
app.route("/api/v1/time", timeRouter);
app.route("/api/v1/invoices", invoicesRouter);
app.route("/api/v1/expenses", expensesRouter);
app.route("/api/v1/analytics", analyticsRouter);
app.route("/api/v1/tickets", ticketsRouter);
app.route("/api/v1/chatter", chatterRouter);
app.route("/api/v1/calendar", calendarRouter);
app.route("/api/v1/settings", settingsRouter);

app.notFound((c) => c.json({ error: "Endpoint not found" }, 404));
app.onError(globalErrorHandler);

// Initialize background schedulers asynchronously
scheduleSystemCronJobs()
  .then(() => {
    systemWorker.run();
  })
  .catch((err) => {
    logger.warn(`BullMQ worker initialization skipped: ${err.message}`);
  });

logger.info(`EON8 CRM API Server initialized on port ${PORT}`);

export { app };
export default {
  port: PORT,
  fetch: app.fetch,
};
