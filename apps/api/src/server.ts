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
import { quotationsRouter } from "./modules/quotations/quotations.router";
import { scheduleSystemCronJobs, systemWorker } from "./jobs/cron.workers";
import { PORT, CORS_ORIGINS } from "./config/env";

const app = new Hono();

app.use("*", httpLogger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "*";
      // Allow localhost and local IP
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return origin;
      }
      // Allow all Vercel domains (production and preview)
      if (origin.endsWith(".vercel.app") || origin.includes("vercel.app")) {
        return origin;
      }
      // Allow configured CORS_ORIGINS
      if (
        CORS_ORIGINS.some(
          (allowed) =>
            allowed === "*" ||
            allowed === origin ||
            (allowed.startsWith("*.") && origin.endsWith(allowed.slice(2)))
        )
      ) {
        return origin;
      }
      return origin;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposeHeaders: ["Set-Cookie"],
    maxAge: 86400,
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
      quotations: "/api/v1/quotations",
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
app.route("/api/v1/quotations", quotationsRouter);

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
