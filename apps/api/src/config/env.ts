/**
 * Centralized Environment Configuration for EON8 CRM API
 */

export const JWT_SECRET =
  process.env.JWT_SECRET || "eon8crm-super-secret-jwt-key-change-in-production-2026";

export const PORT = Number(process.env.PORT) || 3001;

export const CORS_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

export const REDIS_CONFIG = {
  url: process.env.REDIS_URL,
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
