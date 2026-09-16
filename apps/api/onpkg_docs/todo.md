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
- [ ] Sync shared Prisma schema (`apps/api/prisma/schema.prisma`) with all 18 models
- [ ] Spin up local containers (`docker compose up -d`) and verify PostgreSQL / Redis connectivity
- [ ] Run initial database migration (`bunx prisma migrate dev --name init_eon8`)
- [ ] Write seed script (`src/db/seed.ts`) to populate Super Admin, test roles, and sample service catalog

---

## Sprint 1: Identity, RBAC & Core Application Shell
- [ ] Configure JWT authentication endpoints (`/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/refresh`)
- [ ] Implement Hono RBAC middleware (`requireRole([UserRole.ADMIN, ...])`)
- [ ] Build global responsive sidebar (`CORE`, `FINANCE`, `OPERATIONS`, `MANAGEMENT`)
- [ ] Build top navigation header with profile dropdown and placeholder for floating timer dock
- [ ] Implement Global Command Palette (`Cmd + K`) for instant navigation
- [ ] Build User Management table (Admin only) for staff provisioning and setting `internalCostRate` / `billableRate`

---

## Sprint 2: Sales Pipeline & Client 360 Repository
- [ ] Create Lead API endpoints (`GET /api/v1/leads`, `POST /api/v1/leads`, `PATCH /api/v1/leads/:id/status`)
- [ ] Build 7-stage drag-and-drop Lead Kanban board (`NEW` ➔ `WON`) with aggregate column totals
- [ ] Implement Lead Creation modal with auto-incrementing `LEAD-YYYY-XXXX` format
- [ ] Engineer atomic 1-Click "WON" conversion transaction (`Lead` ➔ `Client` + `Project` + `Retainer Draft`)
- [ ] Build Client 360 Master View with tabbed sub-modules (`Projects`, `Invoices`, `Contacts`, `Documents`, `Tickets`, `Chatter`)
- [ ] Implement Client Contacts manager with primary contact flags and Indian GSTIN validation

---

## Sprint 3: Projects, Tasks & Universal Time Tracking
- [ ] Build Project CRUD endpoints with status lifecycle (`PLANNING` ➔ `ACTIVE` ➔ `COMPLETED`)
- [ ] Implement Task Board & Task Table with priority badges (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- [ ] Build Milestone Tracker with completion percentages and approval checkboxes
- [ ] Implement persistent Floating Timer Dock in header with Zustand store and server heartbeat
- [ ] Create Timer API endpoints (`POST /api/v1/time/timer/start`, `POST /api/v1/time/timer/stop`)
- [ ] Engineer gross profit margin calculation engine:
  $$\text{Margin} = \text{Billed Amount} - (\text{Hours} \times \text{costRate}) - \text{Expenses}$$
- [ ] Build interactive Project Margin Pill with hover breakdown tooltip
- [ ] Build Manager Timesheet Review & Approval grid

---

## Sprint 4: Financial Suite: Invoicing, GST & Payments (MVP Milestone 🎯)
- [ ] Implement Invoice State Machine (`DRAFT` ➔ `SENT` ➔ `PARTIAL` ➔ `PAID` ➔ `OVERDUE`)
- [ ] Build "Pull Unbilled Hours & Milestones" aggregation query
- [ ] Implement Indian GST calculation engine (CGST/SGST 9%+9% vs. IGST 18% based on state codes)
- [ ] Build Split-Screen Invoice Studio (form controls on left, live PDF preview on right)
- [ ] Implement PDF generator service with company branding and UPI payment QR code
- [ ] Enforce financial immutability: Lock invoices with status `SENT` or `PAID` from arbitrary updates
- [ ] Implement Payment recording modal with partial payment reconciliation and mode selection (`UPI`, `NEFT`, `Cash`)
- [ ] Build Expense logger categorized into Salaries, Software, Rent, and Marketing

---

## Sprint 5: Customer Support, Universal Chatter & Calendar
- [ ] Build Universal "Chatter" component (`Internal Notes`, `Client Messages`, `Schedule Activity`, `Audit Diff`)
- [ ] Mount Chatter on Lead, Client, Project, and Invoice detail pages
- [ ] Implement Support Ticket CRUD with priority routing and status workflows
- [ ] Build SLA breach countdown timers (First Response < 4 hrs, Resolution < 24 hrs)
- [ ] Build centralized Operational Calendar displaying client follow-ups, project deadlines, and invoice due dates

---

## Sprint 6: Executive BI Cockpit, BullMQ Background Jobs & Polish
- [ ] Build Executive Dashboard top stat cards (Active Clients, Open Projects, Outstanding ₹, Monthly Revenue ₹)
- [ ] Implement Cash Flow Chart: Cleared Revenue vs. Operational Expenses vs. Net Profit
- [ ] Implement Receivables Aging breakdown (`Current`, `1-30 Days`, `31-60 Days`, `60+ Days`)
- [ ] Implement BullMQ scheduled cron workers:
  - Daily invoice overdue reminders (`D-3`, `Due Date`, `D+7`)
  - 15-minute SLA breach warning monitor
  - 12-hour stale timer auto-pause worker
- [ ] End-to-end security audit: Verify authorization on all API routes and enforce input validation with Zod
- [ ] Mobile browser responsive testing & polish
