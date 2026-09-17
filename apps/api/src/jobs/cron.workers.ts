import { Queue, Worker } from "bullmq";
import { redisConnection } from "./redis";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";

export const systemQueue = new Queue("eon8-system-queue", {
  connection: redisConnection,
});

export async function scheduleSystemCronJobs() {
  try {
    if (redisConnection.status === "wait") {
      await redisConnection.connect();
    }
    logger.info("Scheduling BullMQ recurring system jobs...");

    // 1. Daily Invoice Overdue Monitor (Every day at 00:05 UTC, or every 1 hour in dev)
    await systemQueue.upsertJobScheduler(
      "cron-check-overdue-invoices",
      { pattern: "5 0 * * *" },
      {
        name: "check-overdue-invoices",
        data: {},
      }
    );

    // 2. SLA Breach Watcher (Every 15 minutes)
    await systemQueue.upsertJobScheduler(
      "cron-sla-monitor",
      { pattern: "*/15 * * * *" },
      {
        name: "sla-monitor",
        data: {},
      }
    );

    // 3. Stale Timer Safety Auto-Pause (Every 1 hour)
    await systemQueue.upsertJobScheduler(
      "cron-auto-pause-stale-timers",
      { pattern: "0 * * * *" },
      {
        name: "auto-pause-stale-timers",
        data: {},
      }
    );

    logger.info("BullMQ recurring cron schedules registered successfully.");
  } catch (err: any) {
    logger.warn(`Could not register BullMQ schedules (Redis might be offline or starting): ${err.message}`);
  }
}

// Background Worker Processor
export const systemWorker = new Worker(
  "eon8-system-queue",
  async (job) => {
    logger.info(`[BullMQ Worker] Executing system job: ${job.name}`);

    if (job.name === "check-overdue-invoices") {
      const now = new Date();
      const updated = await prisma.invoice.updateMany({
        where: {
          status: { in: ["SENT", "PARTIAL"] },
          dueDate: { lt: now },
        },
        data: {
          status: "OVERDUE",
        },
      });
      logger.info(`[BullMQ Worker] Flagged ${updated.count} invoices as OVERDUE`);
      return { overdueUpdated: updated.count };
    }

    if (job.name === "sla-monitor") {
      const now = new Date();
      const breachedTickets = await prisma.ticket.findMany({
        where: {
          status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
          slaDueTime: { lt: now },
        },
        select: { id: true, ticketNumber: true, subject: true, clientId: true },
      });

      for (const t of breachedTickets) {
        // Log activity warning if not already logged
        await prisma.activityLog.create({
          data: {
            clientId: t.clientId,
            type: "NOTE",
            content: `⚠️ SLA BREACH ALERT: Ticket ${t.ticketNumber} (${t.subject}) has breached resolution SLA!`,
            isInternalOnly: true,
          },
        });
      }

      logger.info(`[BullMQ Worker] Checked SLA monitor: ${breachedTickets.length} tickets currently breached`);
      return { breachedCount: breachedTickets.length };
    }

    if (job.name === "auto-pause-stale-timers") {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const staleTimers = await prisma.timeEntry.findMany({
        where: {
          endTime: null,
          startTime: { lt: twelveHoursAgo },
        },
      });

      for (const te of staleTimers) {
        // Auto-stop at max 8 hours
        const cappedEnd = new Date(te.startTime.getTime() + 8 * 60 * 60 * 1000);
        await prisma.timeEntry.update({
          where: { id: te.id },
          data: {
            endTime: cappedEnd,
            durationMinutes: 480,
            description: `${te.description || ""} [Auto-capped at 8h by System Safety Worker]`,
          },
        });
      }

      logger.info(`[BullMQ Worker] Auto-paused ${staleTimers.length} abandoned running timers`);
      return { cappedTimers: staleTimers.length };
    }
  },
  {
    connection: redisConnection,
    autorun: false,
  }
);

systemWorker.on("completed", (job) => {
  logger.info(`[BullMQ Worker] Job ${job.id} completed successfully`);
});

systemWorker.on("failed", (job, err) => {
  logger.error(`[BullMQ Worker] Job ${job?.id} failed: ${err.message}`);
});
