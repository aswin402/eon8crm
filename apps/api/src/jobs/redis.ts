import Redis from "ioredis";
import { logger } from "../utils/logger";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export const redisConnection = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

redisConnection.on("connect", () => {
  logger.info(`Redis connection established at ${REDIS_HOST}:${REDIS_PORT}`);
});

redisConnection.on("error", (err) => {
  logger.warn(`Redis connection error: ${err.message}`);
});
