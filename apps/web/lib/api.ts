import axios from "axios";
import { logger } from "./logger";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Intercept requests: inject token and attach start time for latency telemetry
api.interceptors.request.use((config) => {
  (config as any).__startTime = performance.now();

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("eon8_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  logger.debug(
    "API",
    `→ ${config.method?.toUpperCase()} ${config.url}`,
    config.data ? { body: config.data } : config.params ? { params: config.params } : undefined
  );

  return config;
});

// Intercept responses: log duration and handle 401 unauthenticated
api.interceptors.response.use(
  (response) => {
    const startTime = (response.config as any).__startTime;
    const duration = startTime ? Math.round(performance.now() - startTime) : 0;

    logger.info(
      "API",
      `✔ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`
    );

    return response;
  },
  (error) => {
    const startTime = (error.config as any)?.__startTime;
    const duration = startTime ? Math.round(performance.now() - startTime) : 0;
    const status = error.response?.status || "NETWORK_ERR";

    const isExpectedAuthCheck =
      (error.response?.status === 401 || error.response?.status === 404) &&
      error.config?.url?.includes("/auth/me");

    if (isExpectedAuthCheck) {
      logger.info("AUTH", `Unauthenticated visitor on ${error.config?.url} (${status})`);
    } else {
      logger.warn(
        "API",
        `✖ ${status} ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms) - ${error.message}`,
        error.response?.data
      );
    }

    if (typeof window !== "undefined" && error.response?.status === 401) {
      localStorage.removeItem("eon8_token");
      if (window.location.pathname !== "/login" && !window.location.pathname.startsWith("/p/")) {
        logger.warn("AUTH", "Session expired or invalid token (401). Redirecting to /login...");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
