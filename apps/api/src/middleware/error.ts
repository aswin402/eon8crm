import type { Context } from "hono";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export const globalErrorHandler = (err: unknown, c: Context) => {
  if (err instanceof ZodError) {
    logger.warn({ err }, "Validation error");
    return c.json({ message: "Validation failed", errors: err.flatten().fieldErrors }, 400);
  }
  if (err instanceof Error) {
    logger.error({ err }, err.message);
    return c.json({ message: err.message }, 500);
  }
  logger.fatal({ err }, "Unknown error");
  return c.json({ message: "Internal Server Error" }, 500);
};
