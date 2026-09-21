/* eslint-disable no-console */
/**
 * Enterprise Frontend Logger with Structured Telemetry & DevTools Buffer
 * Provides clean, color-coded diagnostic logs for both humans and AI inspectors.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogCategory = "AUTH" | "API" | "NAV" | "UI" | "DATA" | "SYS" | "FORM";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
}

// In-memory buffer of recent logs (capped at 100 entries)
const MAX_LOG_BUFFER = 100;
const logBuffer: LogEntry[] = [];

// Augment window interface for clean type safety
declare global {
  interface Window {
    __EON8_LOGS__?: LogEntry[];
    __EON8_GET_LOGS__?: () => string;
  }
}

// Expose buffer to window for automated debugging or AI inspection
if (typeof window !== "undefined") {
  window.__EON8_LOGS__ = logBuffer;
  window.__EON8_GET_LOGS__ = () => JSON.stringify(logBuffer, null, 2);
}

const BADGE_COLORS: Record<LogCategory, string> = {
  AUTH: "background: #7c3aed; color: #fff; border-radius: 3px; padding: 1px 4px; font-weight: bold;",
  API: "background: #0284c7; color: #fff; border-radius: 3px; padding: 1px 4px; font-weight: bold;",
  NAV: "background: #059669; color: #fff; border-radius: 3px; padding: 1px 4px; font-weight: bold;",
  UI: "background: #d97706; color: #fff; border-radius: 3px; padding: 1px 4px; font-weight: bold;",
  DATA: "background: #4b5563; color: #fff; border-radius: 3px; padding: 1px 4px; font-weight: bold;",
  SYS: "background: #e11d48; color: #fff; border-radius: 3px; padding: 1px 4px; font-weight: bold;",
  FORM: "background: #f59e0b; color: #000; border-radius: 3px; padding: 1px 4px; font-weight: bold;",
};

function formatTime(): string {
  return new Date().toISOString().substring(11, 23);
}

function recordLog(level: LogLevel, category: LogCategory, message: string, data?: unknown) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
  };

  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_BUFFER) {
    logBuffer.shift();
  }

  // Print nicely to browser console
  if (typeof window !== "undefined") {
    const badgeStyle = BADGE_COLORS[category] || "";
    const resetStyle = "background: transparent; color: inherit;";
    const prefix = `%c[${category}]%c [${formatTime()}] ${message}`;

    switch (level) {
      case "debug":
        if (process.env.NODE_ENV !== "production") {
          console.debug(prefix, badgeStyle, resetStyle, data !== undefined ? data : "");
        }
        break;
      case "info":
        console.info(prefix, badgeStyle, resetStyle, data !== undefined ? data : "");
        break;
      case "warn":
        console.warn(prefix, badgeStyle, resetStyle, data !== undefined ? data : "");
        break;
      case "error":
        // In dev, Next.js Turbopack intercepts console.error and prints stack frames to the terminal.
        // We use console.warn in non-production to keep the CLI clean while preserving DevTools logs.
        if (process.env.NODE_ENV !== "production") {
          console.warn(prefix, badgeStyle, resetStyle, data !== undefined ? data : "");
        } else {
          console.error(prefix, badgeStyle, resetStyle, data !== undefined ? data : "");
        }
        break;
    }
  }
}

export const logger = {
  debug: (category: LogCategory, message: string, data?: unknown) =>
    recordLog("debug", category, message, data),
  info: (category: LogCategory, message: string, data?: unknown) =>
    recordLog("info", category, message, data),
  warn: (category: LogCategory, message: string, data?: unknown) =>
    recordLog("warn", category, message, data),
  error: (category: LogCategory, message: string, data?: unknown) =>
    recordLog("error", category, message, data),
  getHistory: () => [...logBuffer],
  clearHistory: () => {
    logBuffer.length = 0;
  },
};

export default logger;

