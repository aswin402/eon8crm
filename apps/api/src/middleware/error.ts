import type { Context } from "hono";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export const globalErrorHandler = (err: unknown, c: Context) => {
  if (err instanceof ZodError) {
    logger.warn({ err }, "Validation error");
    return c.json(
      {
        error: "Validation failed",
        message: "Validation failed",
        errors: err.flatten().fieldErrors,
      },
      400
    );
  }
  if (err instanceof Error) {
    logger.error({ err }, err.message);
    return c.json({ error: err.message, message: err.message }, 500);
  }
  logger.fatal({ err }, "Unknown error");
  return c.json({ error: "Internal Server Error", message: "Internal Server Error" }, 500);
};
