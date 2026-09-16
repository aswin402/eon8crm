# Onpkg Next.js Full-Stack Starter Template 🚀

Welcome to your upgraded, high-performance project template built with the latest modern web technologies. This project is optimized for speed, security, and developer experience.

## ✨ Features

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) utilizing React Canary features (e.g., Server Components, Async Params, Server Functions).
- **Runtime & Bundler**: [Bun](https://bun.sh/) for ultra-fast package install, script runs, and hot reload.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with native OKLCH colors and cascading layers.
- **ORM & Database**: [Prisma v7](https://www.prisma.io/) with native JavaScript driver adapters (`@prisma/adapter-pg` and `pg` pool) for a 90% smaller engine bundle.
- **UI System**: Pre-configured [Shadcn UI](https://ui.shadcn.com/) components.
- **State Management**: Hydration-safe [Zustand](https://docs.pmnd.rs/zustand) stores.
- **Data Fetching**: [TanStack Query v5 (React Query)](https://tanstack.com/query) client provider and cached queries.
- **Validation**: [Zod](https://zod.dev/) type-safe schemas.
- **Authentication**: Secure token-based session handling with `bcryptjs` password hashing, JSON Web Tokens (JWT), and HTTP-only cookies.
- **Structured Logging**: Dual-mode logger (colored server CLI logs + clean group-collapsed browser console entries).

---

## 📂 Documentation

Detailed manuals are available in the `docs/` directory:

1. [Database Setup & Prisma 7 Guide](docs/PRISMA.md) - Deep dive into database config, driver adapters, and schema structure.
2. [Architecture & Auth Layout](docs/ARCHITECTURE.md) - Explains folder hierarchy, global state, React Query hooks, and security flows.
3. [Structured Logging with Pino](docs/LOGGING.md) - High-performance structured logging.
4. [Redis & API Rate Limiting](docs/REDIS.md) - Setup for Redis caching and sliding-window rate limiters.
5. [Transactional SMTP Mailer](docs/MAILER.md) - Dispatching HTML emails using Nodemailer.
6. [Object File Storage (S3 & R2)](docs/STORAGE.md) - Object uploads and client presigned URLs.
7. [Scheduled Background Tasks (Cron)](docs/CRON.md) - Background cron registers utilizing Next.js instrumentation.

---

## 🛠️ Getting Started

### 1. Requirements
Ensure you have [Bun](https://bun.sh/) installed:
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Installation
Install project dependencies:
```bash
bun install
```

### 3. Database & Environment Setup
Open `.env` in the root directory to confirm the default PostgreSQL database credentials match your docker setup:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/onpkg_db?schema=public"
```

Spin up the local PostgreSQL database using Docker Compose:
```bash
docker-compose up -d
```

### 4. Running Database Migrations
Initialize database tables using Prisma CLI scripts:
```bash
bun run db:migrate
```

Re-generate client bindings and seed mock users/posts:
```bash
bun run db:generate
bun run db:seed
```

### 5. Running the Application
Spin up the hot-reload dev server:
```bash
bun run dev
```

Your app will be live at [http://localhost:3000](http://localhost:3000).

---

## 📦 Script Directory

All primary commands are run via Bun:

| Command | Action |
| :--- | :--- |
| `bun run dev` | Starts the Next.js development server |
| `bun run build` | Builds the production bundle |
| `bun run start` | Runs the built production bundle |
| `bun run lint` | Runs ESLint check |
| `bun run db:migrate` | Runs database migrations |
| `bun run db:generate` | Re-generates Prisma type-safe client |
| `bun run db:seed` | Resets database and seeds mock data |
| `bun run db:studio` | Opens interactive database panel in browser |

---

## 📜 License
MIT
