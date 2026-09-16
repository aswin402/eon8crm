# EON8 CRM — Enterprise Operations & Financial Command Center 🚀

> **Next-Generation B2B Custom ERP & Agency CRM Architecture**  
> Built for executive precision, high-margin project delivery, real-time labor costing, and statutory Indian Goods and Services Tax (GST) compliance.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black.svg)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-Bun%20Runtime-orange.svg)](https://hono.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-1B222D.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg)](https://redis.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

---

## 🏛️ System Architecture

```
eon8crm/
├── apps/
│   ├── web/                    # Next.js 16 Executive Frontend
│   │   ├── app/                # App Router (18 Enterprise Routes)
│   │   │   ├── page.tsx        # Executive Business Cockpit & Cash Flow
│   │   │   ├── leads/          # 7-Stage Drag-and-Drop Sales Pipeline
│   │   │   ├── clients/        # Client 360 Repository & Financial Vault
│   │   │   ├── projects/       # Project 360 Single Pane of Glass
│   │   │   ├── tasks/          # Sprint Board & Task Backlog
│   │   │   ├── time/           # Universal Timesheet & Labor Costing Studio
│   │   │   ├── invoices/       # Section 31 CGST/SGST/IGST Billing Engine
│   │   │   ├── payments/       # Payment Ledger & Reconciliation
│   │   │   ├── expenses/       # Operational Overheads & Margin Analyzer
│   │   │   ├── tickets/        # Customer Support SLA Ticketing
│   │   │   ├── calendar/       # Operational Milestones & Event Radar
│   │   │   ├── analytics/      # Receivables Aging & BI Profitability
│   │   │   └── team/           # RBAC Roster & Labor Rate Matrix
│   │   └── components/         # Minimalist Executive SaaS Design Tokens
│   │       ├── layout/         # Precision Header, ⌘K Command Palette, Timer Dock
│   │       ├── invoices/       # Printable GST Tax Invoice Modal (A4 / PDF)
│   │       └── common/         # Multi-Tab Chatter & Audit Trail Stream
│   │
│   └── api/                    # High-Throughput Hono API Backend (Bun)
│       ├── prisma/             # 18 Relational Enterprise Models & Postgres Driver
│       ├── src/
│       │   ├── modules/        # Domain Routers (Leads, Projects, Invoices, Time, etc.)
│       │   ├── jobs/           # BullMQ Scheduled Cron Monitors (SLA, Overdue, Timers)
│       │   ├── middleware/     # RBAC Security Guards & JWT Middleware
│       │   └── db/
│       │       ├── seed.ts     # Master Seed Script with Demo Data
│       │       └── verify-lifecycle.ts # Automated 14-Step End-to-End Smoke Test
│
├── docker-compose.yml          # PostgreSQL 16 & Redis 7 Infrastructure
├── onpkg.json                  # AI Agent & Package Workspace Manifest
└── onpkg_docs/                 # Product Specifications, PRD, & Sprint Tracker
```

---

## ⚡ Key Highlights & Capabilities

- **Project 360° Mission Control (`/projects/[id]`)**: Live Scoro/Gauzy-style gross margin cockpit with real-time labor costing:
  $$\text{Margin} = \text{Billed Amount} - (\text{Hours} \times \text{Internal Cost Rate}) - \text{Direct Expenses}$$
- **Statutory Indian GST Invoicing**: Full Section 31 CGST Act 2017 compliant tax invoice generator featuring dynamic state code POS detection (Intra-state CGST 9% + SGST 9% vs. Inter-state IGST 18%), HDFC bank wire remittance instructions, and 1-click printable PDF rendering.
- **Accounting & Tax Export Suite**:
  - **GSTR-1 Table 4 B2B CSV**: Direct export for official GST Portal filings.
  - **Tally Prime & Zoho Books Sales Register CSV**: Ready-to-import sales vouchers with party ledgers.
  - **Payroll Timesheet Logs CSV**: Complete billable/cost duration exports.
  - **Operational Expenses CSV**: Categorized overhead logs.
- **Atomic 1-Click "WON" Conversion**: Seamlessly converts qualified leads into an active Client 360 profile, provisions a client project with budget, and logs an initial retainer draft.
- **Universal Persistent Timer Dock & ⌘K Palette**: Global floating precision timer with heartbeat sync and full-keyboard executive navigation across all CRM entities.
- **Live Operational Intelligence Feed**: Header alert badge actively tracking overdue invoices, high-priority SLA ticket breach count, unbilled labor sessions, and unassigned leads.

---

## 🛠️ Quickstart & Local Setup

### 1. Prerequisites
- **Bun** (>= 1.2.0)
- **Docker & Docker Compose** (for PostgreSQL 16 & Redis 7)

### 2. Infrastructure
Clone the repository and launch the local containers:
```bash
git clone https://github.com/aswin402/eon8crm.git
cd eon8crm

# Start PostgreSQL and Redis
docker compose up -d
```

### 3. Environment Configuration
Copy the example environment files:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 4. Database Setup & Seeding
```bash
cd apps/api
bun run prisma db push
bun src/db/seed.ts
```

### 5. Run the End-to-End Test Suite
Verify that all 14 lifecycle checkpoints pass:
```bash
bun src/db/verify-lifecycle.ts
```

### 6. Start Development Servers
In two separate terminals:

**Backend Server (Port 3001):**
```bash
cd apps/api
bun run dev
```

**Frontend Application (Port 3000):**
```bash
cd apps/web
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Default Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@eon8crm.internal` | `admin123` |
| **Project Manager** | `pm@eon8crm.internal` | `admin123` |
| **Finance Manager** | `finance@eon8crm.internal` | `admin123` |
| **Sales Executive** | `sales@eon8crm.internal` | `admin123` |

---

## 📜 License
Proprietary & Confidential. Built by Celestial Labs for EON8 Operations.
