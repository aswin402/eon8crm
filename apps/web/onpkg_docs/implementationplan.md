# EON8 CRM — Master Engineering Implementation Plan

**Author:** 15-Year Principal Architect & Engineering Lead  
**Execution Standard:** Test-Driven Development (TDD), Atomic Commits, Modular Monorepo  
**Target Delivery Window:** 6 Execution Sprints (MVP at Sprint 4)  

---

## 1. Engineering Principles & Governance

1. **Strict TypeScript & Shared Contracts:** No `any` types. Backend request/response Zod schemas directly generate TypeScript types consumed by the frontend client.
2. **Server-Side Security Verification:** Every single mutation must execute authorization checks on the server (`requireRole([UserRole.ADMIN, ...])`). Never rely on client-side button hiding.
3. **Immutability of Cleared Financials:** Once an invoice is marked `SENT` or `PAID`, code-level guards reject any `UPDATE` statements on line items or amounts.
4. **Optimistic UI with Background Sync:** Live timer operations and Kanban drag-and-drop state updates immediately in the UI using TanStack Query mutations, rolling back if the server rejects.

---

## 2. Sprint Roadmap Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXECUTION SPRINTS                                │
├──────────────┬───────────────────────────────┬──────────────────────────────┤
│ Sprint 0 & 1 │ • Monorepo Scaffolding & DB   │ Day 1 - Day 5                │
│              │ • Identity, RBAC & Core Shell │                              │
├──────────────┼───────────────────────────────┼──────────────────────────────┤
│ Sprint 2 & 3 │ • Lead Pipeline & Client 360  │ Day 6 - Day 14               │
│              │ • Projects, Tasks & Timer     │                              │
├──────────────┼───────────────────────────────┼──────────────────────────────┤
│ Sprint 4     │ • Financials, GST & Invoices  │ Day 15 - Day 21 (MVP Target) │
├──────────────┼───────────────────────────────┼──────────────────────────────┤
│ Sprint 5 & 6 │ • Support Tickets & Chatter   │ Day 22 - Day 30              │
│              │ • Executive BI & Polish       │                              │
└──────────────┴───────────────────────────────┴──────────────────────────────┘
```

---

## 3. Sprint-by-Sprint Execution Tasks

### Sprint 0: Infrastructure, Database Schema & Monorepo Setup
* **Goal:** Stand up the PostgreSQL & Redis local containers, synchronize the shared Prisma schema across `apps/api` and `apps/web`, and verify end-to-end database connectivity.

#### Task 0.1: Database Container & Prisma Initialization
* **Files:**
  * Create: `docker-compose.yml` (already initialized in root)
  * Modify: `apps/api/prisma/schema.prisma`
  * Modify: `apps/api/.env`
* **Execution Steps:**
  1. Start PostgreSQL 16 and Redis 7:
     ```bash
     docker compose up -d
     ```
  2. Copy production schema from `onpkg_docs/spec.md` into `apps/api/prisma/schema.prisma`.
  3. Execute initial database migration:
     ```bash
     cd apps/api && bunx prisma migrate dev --name init_eon8_crm
     ```
  4. Seed database with initial `SUPER_ADMIN` and test departments:
     ```bash
     cd apps/api && bun run src/db/seed.ts
     ```
  5. **Verification:** Query `User` table to ensure seed admin exists with encrypted password hash.

---

### Sprint 1: Identity, RBAC Middleware & Application Shell
* **Goal:** Complete secure authentication, role verification middleware, and the 4-tier responsive sidebar layout.

#### Task 1.1: Hono Authentication & RBAC Middleware
* **Files:**
  * Create: `apps/api/src/modules/auth/auth.router.ts`
  * Create: `apps/api/src/middleware/rbac.middleware.ts`
  * Create: `apps/api/src/modules/auth/auth.service.ts`
* **Interfaces:**
  * `POST /api/v1/auth/login` ➔ `{ email, password }` ➔ Returns `{ token, user: { id, name, role } }`.
  * `requireRole(allowedRoles: UserRole[])` Hono middleware.
* **Verification:** Run Vitest integration test verifying that an `EMPLOYEE` cannot hit an endpoint protected by `requireRole([UserRole.ADMIN])` (Expect 403 Forbidden).

#### Task 1.2: Next.js Responsive App Shell & Navigation
* **Files:**
  * Create: `apps/web/components/layout/Sidebar.tsx`
  * Create: `apps/web/components/layout/Header.tsx`
  * Create: `apps/web/components/layout/TimerDock.tsx`
  * Modify: `apps/web/app/layout.tsx`
* **Deliverables:**
  * Collapsible sidebar with sections: `CORE`, `FINANCE`, `OPERATIONS`, `MANAGEMENT`.
  * Command palette (`Cmd + K`) global modal launcher.
  * Placeholder container for the floating live timer in the header.

---

### Sprint 2: Sales Pipeline & Client 360 Repository
* **Goal:** Enable sales reps to manage leads through the 7-stage Kanban pipeline and execute the 1-click `WON` conversion into a formal Client record.

#### Task 2.1: Lead Pipeline & Status State Machine
* **Files:**
  * Create: `apps/api/src/modules/leads/leads.router.ts`
  * Create: `apps/web/app/(dashboard)/leads/page.tsx`
  * Create: `apps/web/components/leads/LeadKanbanBoard.tsx`
  * Create: `apps/web/components/leads/LeadCard.tsx`
* **Key Logic:**
  * Drag-and-drop between columns (`NEW` ➔ `CONTACTED` ➔ `QUALIFIED` ➔ `MEETING` ➔ `PROPOSAL` ➔ `NEGOTIATION` ➔ `WON`).
  * Optimistic UI updates with rollback on failure.

#### Task 2.2: 1-Click "WON" Conversion Transaction
* **Files:**
  * Create: `apps/api/src/modules/leads/convert.service.ts`
  * Create: `apps/web/components/leads/ConvertLeadModal.tsx`
* **Key Logic:**
  * Executes a single ACID PostgreSQL transaction via `prisma.$transaction`:
    1. Sets `Lead.status = WON`.
    2. Creates `Client` with company name, primary contact, and billing details.
    3. Creates initial `Project` linked to the client with `managerId`.
    4. Logs conversion event into `AuditLog`.

#### Task 2.3: Client 360 Master View
* **Files:**
  * Create: `apps/web/app/(dashboard)/clients/[id]/page.tsx`
  * Create: `apps/web/components/clients/ClientHeader.tsx`
  * Create: `apps/web/components/clients/ClientTabs.tsx`
* **Tabs:** Projects, Invoices, Contacts, Documents, Support Tickets, Activity Chatter.

---

### Sprint 3: Projects, Tasks & Universal Time Tracking
* **Goal:** Enable project managers to allocate tasks and employees to log billable time using the floating timer dock.

#### Task 3.1: Project & Task Delivery Engine
* **Files:**
  * Create: `apps/api/src/modules/projects/projects.router.ts`
  * Create: `apps/web/app/(dashboard)/projects/page.tsx`
  * Create: `apps/web/components/tasks/TaskTable.tsx`
* **Features:** Priority flags (`Low`, `Medium`, `High`, `Urgent`), assignee pickers, due date indicators, and milestone percentage tracking.

#### Task 3.2: Universal Floating Timer Dock & Costing Engine
* **Files:**
  * Create: `apps/api/src/modules/time/timer.router.ts`
  * Create: `apps/web/store/useTimerStore.ts` (Zustand client store)
  * Create: `apps/web/components/layout/TimerDock.tsx`
* **Key Logic:**
  * `POST /api/v1/time/timer/start`: Writes `{ userId, projectId, taskId, startedAt }` to Redis.
  * `POST /api/v1/time/timer/stop`: Computes duration, queries user's `internalCostRate` and `billableRate`, locks them, and persists a validated `TimeEntry` record in PostgreSQL.
  * Real-time Project Gross Profit Margin calculated on project detail cards.

---

### Sprint 4: Financial Suite: Invoicing, GST & Payments (MVP Milestone)
* **Goal:** Complete the Quote-to-Cash loop with automated billable hour pulling, Indian GST calculations, PDF generation, and payment recording.

#### Task 4.1: Invoice Builder & Automated Billable Pull
* **Files:**
  * Create: `apps/api/src/modules/invoices/invoices.router.ts`
  * Create: `apps/web/app/(dashboard)/invoices/new/page.tsx`
  * Create: `apps/web/components/invoices/InvoiceLineItems.tsx`
* **Key Logic:**
  * *"Pull Unbilled Hours"* queries all approved, unbilled `TimeEntry` records for the project, aggregates them by task/service, and populates invoice line items.
  * GST Engine: Auto-calculates 9% CGST + 9% SGST (or 18% IGST) based on client's GSTIN state code.

#### Task 4.2: PDF Generator & Payment Reconciliation
* **Files:**
  * Create: `apps/api/src/modules/invoices/pdf.service.ts`
  * Create: `apps/web/components/invoices/PaymentRecordModal.tsx`
* **Features:**
  * Generates clean PDF with QR code for UPI payments.
  * Recording payments updates `paidAmount` and transitions invoice status (`PARTIAL` or `PAID`).
  * Enforces immutability: Rejects edits to invoices with status `SENT` or `PAID`.

---

### Sprint 5: Support Ticketing, Universal Chatter & Calendar
* **Goal:** Post-delivery customer service with SLA countdowns and the Odoo-style universal activity stream.

#### Task 5.1: Universal Chatter Component
* **Files:**
  * Create: `apps/api/src/modules/chatter/chatter.router.ts`
  * Create: `apps/web/components/common/Chatter.tsx`
* **Features:** Threaded internal staff notes (yellow tint), client messages, activity follow-up scheduling, and audit log diffs.

#### Task 5.2: Support Ticketing & SLA Breach Monitors
* **Files:**
  * Create: `apps/api/src/modules/tickets/tickets.router.ts`
  * Create: `apps/web/app/(dashboard)/tickets/page.tsx`
* **Features:** Ticket queues, priority routing, and SLA breach countdown timers.

---

### Sprint 6: Executive BI Cockpit, BullMQ Automations & Production Hardening
* **Goal:** Deliver high-level business intelligence, automated overdue invoice reminders, and final security audits.

#### Task 6.1: Executive Analytics Dashboard
* **Files:**
  * Create: `apps/api/src/modules/analytics/analytics.router.ts`
  * Create: `apps/web/app/(dashboard)/analytics/page.tsx`
* **KPIs:** Active Clients, Open Projects, Total Outstanding (₹), Month Revenue (₹), Cash Flow (Income vs Expenses), Project Gross Margin ranking.

#### Task 6.2: BullMQ Background Schedulers
* **Files:**
  * Create: `apps/api/src/jobs/invoice-reminder.job.ts`
  * Create: `apps/api/src/jobs/sla-monitor.job.ts`
* **Features:** Scheduled reminders at D-3, Due Date, and D+7 for pending invoices.
