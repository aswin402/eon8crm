# EON8 CRM — Product Requirements Document (PRD)

**Version:** 1.0.0-PROD  
**Author:** 15-Year Principal Architect & Product Lead  
**Status:** Approved for Scaffolding & Sprint 0  
**Stack Alignment:** Next.js 16 (App Router) + Hono REST API (Bun) + PostgreSQL 16 (Prisma) + Redis 7 + Cloudflare R2  

---

## 1. Document Control & Executive Summary

EON8 CRM is a custom internal enterprise operating system built to streamline end-to-end agency operations—from initial sales lead prospecting through service project execution, real-time billable time tracking, GST-compliant invoicing, payment collections, and executive business intelligence.

### High-Level Success Metrics
* **Lead Conversion Velocity:** Reduce lead-to-client onboarding time from days to under 60 seconds via 1-click WON conversion.
* **Zero Billing Leakage:** 100% of billable project hours accounted for in invoicing workflows.
* **Profit Margin Visibility:** Real-time visibility into project gross profit margins available immediately upon task time entry.
* **Receivables Aging Reduction:** Reduce Days Sales Outstanding (DSO) by 35% through automated invoice reminders at D-3, D-Day, and D+7.

---

## 2. User Personas & Permissions Matrix (RBAC)

The system enforces 6 discrete roles:

| Role | Core Purpose | Permissions & Scope |
| :--- | :--- | :--- |
| **Super Admin** | Platform owner / CTO | Unrestricted root access, tenant settings, RBAC management, global audit logs, data exports. |
| **Admin** | Managing Director / COO | Full visibility into all modules, finance dashboards, project delivery, client master data, and analytics. |
| **Sales Executive** | Business Development | Create and manage Leads, Kanban pipeline, call logs, proposals, and client conversion. |
| **Project Manager** | Operations & Delivery | Create Projects, assign Tasks to Employees, track Milestones, review and approve weekly Timesheets. |
| **Employee** | Engineers & Designers | View assigned Tasks, update task statuses, operate the live Time Tracker, log support tickets. |
| **Finance Officer** | Accounting & Billing | Draft and issue Invoices, record Payments, track Expenses, monitor GST compliance and Cash Flow. |

---

## 3. Functional Requirements (Module-by-Module)

### Module 1: Authentication, Identity & RBAC (FR-AUTH)
* **FR-1.1 Session Security:** JWT authentication with HTTP-only, secure cookies, refresh token rotation, and optional 2FA / OTP verification.
* **FR-1.2 Role Verification:** Server-side RBAC middleware on every API route and server action.
* **FR-1.3 User Profile:** Store user profile, departmental assignment, `internalCostRate` (company hourly cost), and default `billableRate`.

### Module 2: Lead Management & Pipeline (FR-LEAD)
* **FR-2.1 Lead Capture:** Capture Lead ID (auto-increment format `LEAD-YYYY-XXXX`), Company, Contact Person, Phone, Email, Source, Industry, Estimated Value, and Assigned Rep.
* **FR-2.2 7-Stage Sales Pipeline:** Visual Kanban and dense tabular view supporting stages:
  `NEW` ➔ `CONTACTED` ➔ `QUALIFIED` ➔ `MEETING` ➔ `PROPOSAL` ➔ `NEGOTIATION` ➔ `WON` (plus `LOST`).
* **FR-2.3 1-Click Client Handshake:** Moving a deal to `WON` triggers an atomic transaction that:
  1. Instantiates a new `Client` record with contact and billing details pre-filled.
  2. Creates the initial `Project` linked to the client with the proposal scope.
  3. Pre-drafts an initial Advance / Retainer invoice.
* **FR-2.4 Deal Reminders:** System notifies reps if an active lead has had no activity for > 72 hours.

### Module 3: Client 360° Repository (FR-CLI)
* **FR-3.1 Master Profile:** Company Name, Client ID (`CLI-XXXX`), Primary/Secondary Contacts, Phone, Email, Billing Address, Payment Terms (Net 15, Net 30, Due on Receipt), and Indian GSTIN.
* **FR-3.2 360° Connected Tabs:** Single pane of glass displaying:
  * **Projects:** List of active, completed, and archived delivery projects.
  * **Invoices & Billing:** History of issued invoices, overdue amounts, and total lifetime value (LTV).
  * **Payments:** Itemized ledger of all cleared transactions and payment modes.
  * **Contracts & Documents:** PDF agreements, proposals, and NDAs stored securely in Cloudflare R2.
  * **Support Tickets:** Current and resolved service requests.
  * **Activity Stream (Chatter):** Chronological log of emails, internal staff notes, and call logs.

### Module 4: Project & Task Management (FR-PROJ)
* **FR-4.1 Project Profile:** Project Name, Client ID, Assigned Project Manager, Budget (₹), Start Date, Target Delivery Date, and Status (`Planning`, `Active`, `On Hold`, `Review`, `Completed`, `Archived`).
* **FR-4.2 Task Breakdown:** Tasks assigned to one or more employees with Priority flags (`Low`, `Medium`, `High`, `Urgent`), due date, rich-text instructions, sub-task checklists, and file attachments.
* **FR-4.3 Milestones & Deliverables:** Definition of project milestones with completion percentages (`0% - 100%`) and formal client approval checkboxes.

### Module 5: Universal Time Tracking & Cost Accounting (FR-TIME)
* **FR-5.1 Persistent Floating Timer Dock:** Global header widget accessible on any page. Select `[Project] ➔ [Task]`, click "Start", and let the timer run. Periodic heartbeat syncs elapsed time to the server.
* **FR-5.2 Manual Timesheet Logging:** Bulk entry modal allowing employees to log past hours with date, task reference, work description, and billable toggle (`isBillable: boolean`).
* **FR-5.3 Manager Timesheet Approval:** Project Managers receive a weekly timesheet grid to review, edit, approve, or reject employee hours before they can be billed.
* **FR-5.4 Gross Profit Margin Engine:** Each logged hour captures the user's locked `costRate` and `billingRate` at the exact time of entry, enabling real-time project profitability calculations:
  $$\text{Project Cost} = \sum (\text{Hours} \times \text{costRate})$$

### Module 6: Invoicing & Indian GST Engine (FR-INV)
* **FR-6.1 Invoice Lifecycle State Machine (ERPNext Style):**  
  `DRAFT` ➔ `SENT` ➔ `PARTIAL` ➔ `PAID` ➔ `OVERDUE` (and `CANCELLED`).
  * Invoices in `SENT` or `PAID` status are **immutable**. Corrections require an official cancellation or credit note.
* **FR-6.2 Automated Billable Pull:** Ability to select a Project and click *"Pull Unbilled Hours & Completed Milestones"*, which automatically creates itemized invoice line items.
* **FR-6.3 Indian GST Calculation:**
  * Support for HSN/SAC service codes.
  * Intra-state billing (same state): Auto-calculate 9% CGST + 9% SGST.
  * Inter-state billing (different state): Auto-calculate 18% IGST.
* **FR-6.4 PDF Generation:** Server-side generation of branded, professional PDF invoices with QR codes for UPI payments and downloadable via secure pre-signed URLs.

### Module 7: Payments, Expenses & Cash Flow (FR-PAY)
* **FR-7.1 Multi-Mode Payments:** Record payments against invoices with transaction reference (UTR/Transaction ID), payment date, and method (`UPI`, `NEFT/RTGS`, `Payment Gateway`, `Cash`).
* **FR-7.2 Partial Payment Reconciliation:** Record multiple partial payments against a single invoice, automatically recalculating the remaining balance until fully cleared.
* **FR-7.3 Expense Logging:** Track operational expenses categorized into Salaries, Software Licenses, Rent, Marketing, and Client Reimbursables.
* **FR-7.4 Net Cash Flow KPI:** Real-time ledger showing:  
  $$\text{Net Cash Flow} = \text{Cleared Invoiced Payments} - \text{Total Operational Expenses}$$

### Module 8: Customer Support & SLA Ticketing (FR-TICK)
* **FR-8.1 Ticket Lifecycle:** `OPEN` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `WAITING_CLIENT` ➔ `RESOLVED` ➔ `CLOSED`.
* **FR-8.2 SLA Timers:** Configurable First-Response SLA (e.g., < 4 hours) and Resolution SLA (e.g., < 24 hours) with visual breach countdown timers.
* **FR-8.3 Omnichannel Thread:** Support tickets allow threaded discussions between support staff and client contacts, with an option for private internal notes.

### Module 9: Executive Dashboard & Business Intelligence (FR-BI)
* **FR-9.1 At-a-Glance Executive Cards:**
  1. Active Retainer / Client Count
  2. Active Projects in Progress
  3. Total Outstanding Accounts Receivable (₹)
  4. Current Month Revenue Cleared (₹)
* **FR-9.2 Visual Analytics Charts:**
  * Monthly Revenue vs. Expenses vs. Net Profit (Bar / Line chart).
  * Lead Conversion Funnel and Source Efficiency (Pie / Donut).
  * Project Gross Profitability Matrix (identifying unprofitable client projects).
  * Receivables Aging Breakdown (`Current`, `1-30 Days Overdue`, `31-60 Days`, `60+ Days`).

---

## 4. Non-Functional Requirements (NFRs)

* **Performance:** 95% of API requests must complete in `< 80ms`. Initial page load must achieve `< 1.2s` LCP.
* **Concurrency:** Support concurrent live timer operations for 200+ simultaneous staff members via Redis caching and PostgreSQL optimistic locking.
* **Data Integrity:** Strict relational foreign keys with cascading delete rules disabled on financial tables (`Invoice`, `Payment`, `TimeEntry`) to prevent accidental record destruction.
* **Security & Auditing:** Every mutation on financial records or RBAC privileges writes an immutable record to the `AuditLog` table containing user ID, IP address, timestamp, and field diff.
* **Browser Compatibility:** Full responsive support on modern desktop browsers (Chrome, Edge, Safari, Firefox) and mobile views for time logging and approval.
