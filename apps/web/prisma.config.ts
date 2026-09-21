import { defineConfig } from "prisma/config";

// Load dotenv if available in local development (Vercel/production environments inject process.env directly)
try {
  await import("dotenv/config");
} catch {
  // dotenv is optional in CI/Vercel environments where environment variables are pre-injected
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
