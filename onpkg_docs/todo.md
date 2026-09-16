# EON8 CRM — Master Sprint Backlog & Task Tracker (TODO)

**Project Lead:** 15-Year Principal Architect & Engineering Manager  
**Status:** Sprint 0 In Progress  
**Active Architecture:** `apps/web` (Next.js 16) + `apps/api` (Hono Bun) + PostgreSQL 16 + Redis 7  

---

## Sprint 0: Foundation, Infrastructure & Database Setup
- [x] Scaffold Next.js 16 frontend in `apps/web` using `onpkg stack add next-template`
- [x] Scaffold Hono API backend in `apps/api` using `onpkg stack add hono-full`
- [x] Establish root Bun monorepo workspace (`package.json`)
- [x] Create root `docker-compose.yml` for PostgreSQL 16 and Redis 7
- [x] Author core documentation suite (`coreidea.md`, `prd.md`, `design.md`, `spec.md`, `implementationplan.md`, `todo.md`)
- [x] Sync shared Prisma schema (`apps/api/prisma/schema.prisma`) with all 18 models
- [x] Spin up local containers and verify PostgreSQL (native port 5432) & Redis (port 6379) connectivity
- [x] Run initial database sync and schema deployment (`eon8crm` database)
- [x] Write and execute seed script (`src/db/seed.ts`) populating all 6 roles, leads, Client 360, projects, time entries, and GST invoices

---

## Sprint 1: Identity, RBAC & Core Application Shell
- [x] Configure JWT authentication endpoints (`/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/logout`)
- [x] Implement Hono RBAC middleware (`requireRole([UserRole.ADMIN, ...])` returning 403 Forbidden for unauthorized roles)
- [x] Build global responsive sidebar (`CORE`, `FINANCE`, `OPERATIONS`, `MANAGEMENT`)
- [x] Build top navigation header with profile dropdown and the Universal Floating Timer Dock
- [x] Build User Management endpoints (`/api/v1/users`) for setting `internalCostRate` and `billableRate`
- [x] Deploy Executive Business Cockpit Dashboard (`apps/web/app/page.tsx`) with real-time gross margin table and sales funnel
- [x] Verified full Next.js 16 production build (`next build`) with 0 errors

---

## Sprint 2: Sales Pipeline & Client 360 Repository
- [x] Create Lead API endpoints (`GET /api/v1/leads`, `POST /api/v1/leads`, `PATCH /api/v1/leads/:id/status`)
- [x] Build 7-stage drag-and-drop Lead Kanban board (`NEW` ➔ `WON`) with aggregate column totals in `apps/web/app/leads/page.tsx`
- [x] Implement Lead Creation modal with auto-incrementing `LEAD-YYYY-XXXX` format
- [x] Engineer atomic 1-Click "WON" conversion transaction (`Lead` ➔ `Client` + `Project` + `Retainer Draft`)
- [x] Build Client 360 Master View (`apps/web/app/clients/page.tsx` and `apps/web/app/clients/[id]/page.tsx`) with tabbed sub-modules (`Projects`, `Invoices`, `Contacts`, `Chatter`)
- [x] Implement Client Contacts manager with primary contact flags and Indian GSTIN validation

---

## Sprint 3: Projects, Tasks & Universal Time Tracking
- [x] Build Project CRUD endpoints with status lifecycle (`PLANNING` ➔ `ACTIVE` ➔ `COMPLETED`)
- [x] Implement Task Board & Task Table with priority badges (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- [x] Build Milestone Tracker with completion percentages and approval checkboxes
- [x] Implement persistent Floating Timer Dock in header with Zustand/local heartbeat
- [x] Create Timer API endpoints (`POST /api/v1/time/timer/start`, `POST /api/v1/time/timer/stop`)
- [x] Engineer gross profit margin calculation engine:
  $$\text{Margin} = \text{Billed Amount} - (\text{Hours} \times \text{costRate}) - \text{Expenses}$$
- [x] Build interactive Project Margin Pill with hover breakdown tooltip in `apps/web/app/projects/page.tsx`
- [x] Build Manager Timesheet Review & Approval endpoints

---

## Sprint 4: Financial Suite: Invoicing, GST & Payments (MVP Milestone 🎯)
- [x] Implement Invoice State Machine (`DRAFT` ➔ `SENT` ➔ `PARTIAL` ➔ `PAID` ➔ `OVERDUE`)
- [x] Build "Pull Unbilled Hours & Milestones" aggregation query (`POST /api/v1/invoices/pull-unbilled`)
- [x] Implement Indian GST calculation engine (CGST/SGST 9%+9% vs. IGST 18% based on state codes)
- [x] Build Invoicing UI (`apps/web/app/invoices/page.tsx`) with line-item creation and unbilled hour pull
- [x] Enforce financial immutability: Lock invoices with status `SENT` or `PAID` from arbitrary updates
- [x] Implement Payment recording modal with partial payment reconciliation and mode selection (`UPI`, `NEFT`, `Cash`)
- [x] Build Expense logger categorized into Salaries, Software, Rent, and Marketing (`apps/web/app/expenses/page.tsx` & `/api/v1/expenses`)
- [x] Build Cleared Payments ledger (`apps/web/app/payments/page.tsx` & `/api/v1/invoices/payments/all`)

---

## Sprint 5: Customer Support, Universal Chatter & Calendar
- [x] Build Universal "Chatter" component (`Internal Notes`, `Client Messages`, `Schedule Activity`, `Audit Diff`) in `apps/web/components/common/Chatter.tsx`
- [x] Mount Chatter on Lead, Client, Project, and Invoice detail pages
- [x] Implement Support Ticket CRUD with priority routing and status workflows (`apps/web/app/tickets/page.tsx` & `/api/v1/tickets`)
- [x] Build SLA breach countdown timers (First Response < 4 hrs, Resolution < 24 hrs)
- [x] Build centralized Operational Calendar displaying client follow-ups, project deadlines, and invoice due dates (`apps/web/app/calendar/page.tsx` & `/api/v1/calendar/events`)
- [x] Build Contract & Document Vault (`apps/web/app/documents/page.tsx` & `/api/v1/clients/documents/all`)

---

## Sprint 6: Executive BI Cockpit, BullMQ Background Jobs & Polish
- [x] Build Executive Dashboard top stat cards (Active Clients, Open Projects, Outstanding ₹, Monthly Revenue ₹) in `apps/web/app/page.tsx`
- [x] Implement Cash Flow Chart: Cleared Revenue vs. Operational Expenses vs. Net Profit in `apps/web/app/analytics/page.tsx` & `/api/v1/analytics/cashflow`
- [x] Implement Receivables Aging breakdown (`Current`, `1-30 Days`, `31-60 Days`, `60+ Days`) in `apps/web/app/analytics/page.tsx` & `/api/v1/analytics/aging`
- [x] Build Team Roster & RBAC Labor Costing editor (`apps/web/app/team/page.tsx` & `/api/v1/users/:id`)
- [x] Build Task Backlog & live timer starter (`apps/web/app/tasks/page.tsx` & `/api/v1/projects/all/tasks`)
- [x] Build Universal Timesheet & Labor Costing Studio (`apps/web/app/time/page.tsx` & `/api/v1/time/entries`)
- [x] Implement BullMQ scheduled cron workers in `apps/api/src/jobs/cron.workers.ts`:
  - Daily invoice overdue monitor & status transition (`check-overdue-invoices`)
  - 15-minute SLA breach warning monitor (`sla-monitor`)
  - 12-hour stale timer auto-pause worker (`auto-pause-stale-timers`)
- [x] End-to-end security audit: Verified RBAC authorization guards and Zod input validation across all routes
- [x] Production build verification: Next.js 16 production build succeeded with **0 errors** across all 15 routes

---

## Sprint 7: Enterprise Polish, Project 360° Cockpit & PDF Tax Invoices 🚀
- [x] Complete UI overhaul across all 18 routes to modern minimal executive SaaS design tokens (Linear/Vercel style, zero AI slop)
- [x] Replace native browser `<select>` with custom floating precision Timer popover and active status indicator
- [x] Build interactive ⌘K Command Palette in top header with keyboard navigation across all modules and quick actions
- [x] Build native HTML5 Drag-and-Drop Kanban pipeline with drop highlighting and 1-click WON conversion
- [x] Build Lead Detail Slide-Over Drawer with stage progression controls and contact shortcuts
- [x] Build Project 360° Single Pane of Glass (`apps/web/app/projects/[id]/page.tsx`) with Scoro/Gauzy live gross margin cockpit, task sprint board, milestones, timesheets, and chatter
- [x] Implement backend project status update and milestone endpoints (`PATCH /api/v1/projects/:id/status`, `POST /api/v1/projects/:id/milestones`, `PATCH /api/v1/projects/milestones/:milestoneId`)
- [x] Build Printable Indian GST Tax Invoice & PDF preview modal (`apps/web/components/invoices/InvoicePreviewModal.tsx`) complying with Section 31 of CGST Act 2017
- [x] Build GSTR-1 Table 4 B2B CSV & Tally Prime / Zoho Sales Register export suite (`/api/v1/invoices/export/gstr1`, `/api/v1/invoices/export/tally`)
- [x] Build Timesheet labor logs & Operational expenses CSV exports (`/api/v1/time/export`, `/api/v1/expenses/export`)
- [x] Build Dynamic Operational Alerts Feed (`GET /api/v1/analytics/alerts`) with live overdue invoices, SLA tickets, unbilled hours, and notification badge in top header
- [x] Integrate Project 360 navigation and embedded invoice preview modals directly inside Client 360 (`apps/web/app/clients/[id]/page.tsx`)
- [x] Author & execute Master Enterprise Lifecycle & Integration Smoke Test Suite (`apps/api/src/db/verify-lifecycle.ts`) with **14/14 test cases passing**
- [x] Zero TypeScript compilation errors (`bun x tsc --noEmit` clean exit code 0 across monorepo)

