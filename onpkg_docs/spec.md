# EON8 CRM — Technical Specification & Architecture Blueprint

**Version:** 1.0.0  
**Author:** 15-Year Principal Architect & Engineering Manager  
**Monorepo Structure:** `apps/web` (Next.js 16) + `apps/api` (Hono on Bun) + PostgreSQL 16 + Redis 7  

---

## 1. System Topology & Network Architecture

```
                                  CLIENT BROWSERS
                               (Desktop & Mobile Web)
                                         │
                                         ▼
                               ┌───────────────────┐
                               │     apps/web      │
                               │    Next.js 16     │
                               │   React 19, SSR   │
                               │ Tailwind, shadcn  │
                               └─────────┬─────────┘
                                         │
                                  JSON REST APIs
                             (Bearer Token / Cookie)
                                         │
                                         ▼
                               ┌───────────────────┐
                               │     apps/api      │
                               │    Hono on Bun    │
                               │  Modular Router   │
                               │  Zod Validations  │
                               └─────────┬─────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 │                       │                       │
                 ▼                       ▼                       ▼
       ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
       │   PostgreSQL 16   │   │      Redis 7      │   │   Cloudflare R2   │
       │    Primary DB     │   │    BullMQ Jobs    │   │  Object Storage   │
       │    Prisma ORM     │   │  Timer Heartbeat  │   │   Invoices/Docs   │
       └───────────────────┘   └───────────────────┘   └───────────────────┘
```

---

## 2. Complete Production Database Schema (`prisma/schema.prisma`)

This schema implements all entities from the blueprint and benchmark research:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// 1. IDENTITY & ACCESS CONTROL (RBAC)
// -------------------------------------------------------------
enum UserRole {
  SUPER_ADMIN
  ADMIN
  SALES
  PROJECT_MANAGER
  EMPLOYEE
  FINANCE
}

model User {
  id               String       @id @default(cuid())
  email            String       @unique
  name             String
  passwordHash     String
  role             UserRole     @default(EMPLOYEE)
  phone            String?
  avatarUrl        String?
  isActive         Boolean      @default(true)
  internalCostRate Decimal      @default(0.00) @db.Decimal(10, 2) // Hourly internal cost (Ever Gauzy pattern)
  billableRate     Decimal      @default(0.00) @db.Decimal(10, 2) // Default client billing rate
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  assignedLeads    Lead[]       @relation("AssignedSalesperson")
  managedProjects  Project[]    @relation("ProjectManager")
  assignedTasks    Task[]       @relation("AssignedTasks")
  timeEntries      TimeEntry[]
  activities       ActivityLog[]
  auditLogs        AuditLog[]

  @@index([role, isActive])
}

// -------------------------------------------------------------
// 2. LEAD MANAGEMENT PIPELINE
// -------------------------------------------------------------
enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  MEETING
  PROPOSAL
  NEGOTIATION
  WON
  LOST
}

model Lead {
  id             String       @id @default(cuid())
  leadNumber     String       @unique // e.g. LEAD-2026-0001
  companyName    String
  contactPerson  String
  email          String
  phone          String
  source         String       // Website, LinkedIn, Referral, Inbound
  industry       String?
  serviceInterest String?
  estimatedValue Decimal      @default(0.00) @db.Decimal(12, 2)
  status         LeadStatus   @default(NEW)
  assignedToId   String?
  assignedTo     User?        @relation("AssignedSalesperson", fields: [assignedToId], references: [id])
  convertedClientId String?   @unique
  convertedClient   Client?   @relation(fields: [convertedClientId], references: [id])
  notes          String?      @db.Text
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  activities     ActivityLog[]

  @@index([status, assignedToId])
}

// -------------------------------------------------------------
// 3. CLIENT 360 REPOSITORY
// -------------------------------------------------------------
model Client {
  id             String          @id @default(cuid())
  clientNumber   String          @unique // e.g. CLI-1001
  companyName    String
  contactPerson  String
  email          String
  phone          String
  gstin          String?         // Indian GST Number (15 chars)
  pan            String?         // PAN Number
  billingAddress String          @db.Text
  shippingAddress String?        @db.Text
  paymentTerms   String          @default("Net 30") // Net 15, Net 30, Due on Receipt
  isActive       Boolean         @default(true)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  leadOrigin     Lead?
  contacts       ClientContact[]
  projects       Project[]
  invoices       Invoice[]
  tickets        Ticket[]
  documents      Document[]
  activities     ActivityLog[]

  @@index([companyName, email])
}

model ClientContact {
  id          String   @id @default(cuid())
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  name        String
  email       String
  phone       String?
  designation String?
  isPrimary   Boolean  @default(false)
  createdAt   DateTime @default(now())
}

// -------------------------------------------------------------
// 4. PROJECTS & TASKS
// -------------------------------------------------------------
enum ProjectStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  REVIEW
  COMPLETED
  ARCHIVED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model Project {
  id          String        @id @default(cuid())
  name        String
  clientId    String
  client      Client        @relation(fields: [clientId], references: [id])
  managerId   String
  manager     User          @relation("ProjectManager", fields: [managerId], references: [id])
  budget      Decimal       @default(0.00) @db.Decimal(12, 2)
  status      ProjectStatus @default(PLANNING)
  startDate   DateTime?
  dueDate     DateTime?
  description String?       @db.Text
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  tasks       Task[]
  milestones  Milestone[]
  timeEntries TimeEntry[]
  invoices    Invoice[]

  @@index([clientId, status])
}

model Milestone {
  id             String    @id @default(cuid())
  projectId      String
  project        Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title          String
  description    String?
  amount         Decimal   @default(0.00) @db.Decimal(10, 2)
  completionDate DateTime?
  isApproved     Boolean   @default(false)
  isBilled       Boolean   @default(false)
  createdAt      DateTime  @default(now())
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?      @db.Text
  priority    Priority     @default(MEDIUM)
  isCompleted Boolean      @default(false)
  dueDate     DateTime?
  projectId   String
  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assigneeId  String?
  assignee    User?        @relation("AssignedTasks", fields: [assigneeId], references: [id])
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  timeEntries TimeEntry[]

  @@index([projectId, isCompleted, assigneeId])
}

// -------------------------------------------------------------
// 5. TIME TRACKING & COST ENGINE
// -------------------------------------------------------------
model TimeEntry {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  projectId       String
  project         Project   @relation(fields: [projectId], references: [id])
  taskId          String?
  task            Task?     @relation(fields: [taskId], references: [id])
  description     String    @db.Text
  startTime       DateTime
  endTime         DateTime? // NULL if timer currently ticking
  durationMinutes Int       @default(0)
  isBillable      Boolean   @default(true)
  isBilled        Boolean   @default(false)
  isApproved      Boolean   @default(false)
  costRate        Decimal   @db.Decimal(10, 2) // Snapshotted internal cost rate
  billingRate     Decimal   @db.Decimal(10, 2) // Snapshotted billable client rate
  invoiceId       String?
  createdAt       DateTime  @default(now())

  @@index([userId, projectId, startTime])
}

// -------------------------------------------------------------
// 6. INVOICING, GST & CASH FLOW
// -------------------------------------------------------------
enum InvoiceStatus {
  DRAFT
  SENT
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}

model Invoice {
  id            String        @id @default(cuid())
  invoiceNumber String        @unique // e.g. INV-2026-0001
  clientId      String
  client        Client        @relation(fields: [clientId], references: [id])
  projectId     String?
  project       Project?      @relation(fields: [projectId], references: [id])
  status        InvoiceStatus @default(DRAFT)
  issueDate     DateTime      @default(now())
  dueDate       DateTime
  subTotal      Decimal       @default(0.00) @db.Decimal(12, 2)
  cgstAmount    Decimal       @default(0.00) @db.Decimal(10, 2)
  sgstAmount    Decimal       @default(0.00) @db.Decimal(10, 2)
  igstAmount    Decimal       @default(0.00) @db.Decimal(10, 2)
  totalAmount   Decimal       @default(0.00) @db.Decimal(12, 2)
  paidAmount    Decimal       @default(0.00) @db.Decimal(12, 2)
  notes         String?       @db.Text
  terms         String?       @db.Text
  pdfUrl        String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  items         InvoiceItem[]
  payments      Payment[]

  @@index([clientId, status, dueDate])
}

model InvoiceItem {
  id          String   @id @default(cuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description String
  sacCode     String?  // Indian HSN/SAC code
  quantity    Decimal  @default(1.00) @db.Decimal(8, 2)
  unitPrice   Decimal  @default(0.00) @db.Decimal(10, 2)
  taxRate     Decimal  @default(18.00) @db.Decimal(5, 2) // 18% default GST
  amount      Decimal  @default(0.00) @db.Decimal(10, 2)
}

model Payment {
  id            String   @id @default(cuid())
  paymentNumber String   @unique // PAY-2026-0001
  invoiceId     String
  invoice       Invoice  @relation(fields: [invoiceId], references: [id])
  amount        Decimal  @db.Decimal(12, 2)
  paymentDate   DateTime @default(now())
  paymentMethod String   // UPI, NEFT, RTGS, Credit Card, Cash
  referenceId   String?  // Bank UTR or Gateway Transaction ID
  notes         String?
  createdAt     DateTime @default(now())

  @@index([invoiceId, paymentDate])
}

model Expense {
  id          String   @id @default(cuid())
  category    String   // Salaries, Software, Rent, Marketing, Travel
  description String
  amount      Decimal  @db.Decimal(10, 2)
  expenseDate DateTime @default(now())
  vendor      String?
  receiptUrl  String?
  createdAt   DateTime @default(now())
}

// -------------------------------------------------------------
// 7. SUPPORT TICKETING & COLLABORATIVE CHATTER
// -------------------------------------------------------------
enum TicketStatus {
  OPEN
  ASSIGNED
  IN_PROGRESS
  WAITING_CLIENT
  RESOLVED
  CLOSED
}

model Ticket {
  id             String       @id @default(cuid())
  ticketNumber   String       @unique // TIK-1001
  subject        String
  description    String       @db.Text
  status         TicketStatus @default(OPEN)
  priority       Priority     @default(MEDIUM)
  clientId       String
  client         Client       @relation(fields: [clientId], references: [id])
  assignedToId   String?
  slaDueTime     DateTime?
  firstResponseAt DateTime?
  resolvedAt     DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([clientId, status, priority])
}

model ActivityLog {
  id             String   @id @default(cuid())
  authorId       String?
  author         User?    @relation(fields: [authorId], references: [id])
  leadId         String?
  lead           Lead?    @relation(fields: [leadId], references: [id])
  clientId       String?
  client         Client?  @relation(fields: [clientId], references: [id])
  type           String   // NOTE, CALL, STATUS_CHANGE, EMAIL, TASK
  content        String   @db.Text
  isInternalOnly Boolean  @default(true) // Odoo style internal note vs client msg
  createdAt      DateTime @default(now())

  @@index([leadId, clientId, createdAt])
}

model Document {
  id        String   @id @default(cuid())
  name      String
  fileUrl   String
  fileSize  Int
  mimeType  String
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id])
  createdAt DateTime @default(now())
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String   // CREATE, UPDATE, DELETE, STATUS_CHANGE
  entityType String   // INVOICE, PAYMENT, USER, CLIENT
  entityId   String
  diffJson   Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId, createdAt])
}
```

---

## 3. Hono REST API Contracts (`apps/api`)

All endpoints are strictly validated using **Zod** schemas and protected with JWT RBAC middleware.

### Authentication & RBAC (`/api/v1/auth`)
* `POST /api/v1/auth/login` ➔ Authenticate user, issue HTTP-only JWT cookie.
* `POST /api/v1/auth/refresh` ➔ Rotate refresh token.
* `GET  /api/v1/auth/me` ➔ Return logged-in user profile, role, and permission flags.
* `POST /api/v1/auth/logout` ➔ Invalidate session.

### Lead Pipeline (`/api/v1/leads`)
* `GET  /api/v1/leads` ➔ List leads with pagination, search, and status filtering.
* `POST /api/v1/leads` ➔ Create lead. Generates `LEAD-YYYY-XXXX` auto-identifier.
* `PATCH /api/v1/leads/:id/status` ➔ Update pipeline stage (`NEW` ➔ `WON`).
* `POST /api/v1/leads/:id/convert` ➔ **Atomic transaction:** Converts `WON` lead into a verified `Client`, creates initial `Project`, and drafts retainer invoice.

### Client 360 (`/api/v1/clients`)
* `GET  /api/v1/clients` ➔ List clients with search, GSTIN, and balance filters.
* `GET  /api/v1/clients/:id/360` ➔ Returns aggregated 360 payload (Master details, Projects list, Invoices, Lifetime Value, Open Tickets, Documents).
* `POST /api/v1/clients` ➔ Register new client.
* `PATCH /api/v1/clients/:id` ➔ Update billing and contact details.

### Projects & Tasks (`/api/v1/projects`)
* `GET  /api/v1/projects` ➔ Filter by status, client, or manager.
* `POST /api/v1/projects` ➔ Provision new project with budget and dates.
* `GET  /api/v1/projects/:id/profitability` ➔ Compute real-time gross margin:
  Returns `{ billedRevenue, totalLaborCost, directExpenses, grossProfit, marginPercentage }`.
* `POST /api/v1/projects/:id/tasks` ➔ Create assignable task with priority and due date.
* `PATCH /api/v1/tasks/:id` ➔ Update task completion and description.

### Time Tracking & Timer Engine (`/api/v1/time`)
* `POST /api/v1/time/timer/start` ➔ Start live timer for `[userId, projectId, taskId]`. Stores active timer in Redis.
* `POST /api/v1/time/timer/stop` ➔ Stops running timer, computes duration in minutes, locks user's `costRate` and `billingRate`, and creates `TimeEntry` record in PostgreSQL.
* `GET  /api/v1/time/active` ➔ Fetch currently running timer for the authenticated user.
* `POST /api/v1/time/manual` ➔ Bulk manual timesheet entry.
* `PATCH /api/v1/time/:id/approve` ➔ (Manager only) Approve timesheet entry for billing.

### Invoicing & Indian GST Engine (`/api/v1/invoices`)
* `GET  /api/v1/invoices` ➔ List invoices with status, aging bucket, and client filter.
* `POST /api/v1/invoices` ➔ Create invoice. Calculates CGST/SGST/IGST and updates balances.
* `POST /api/v1/invoices/pull-unbilled` ➔ Fetches approved unbilled `TimeEntry` records and completed `Milestone` items for a project and builds itemized lines.
* `PATCH /api/v1/invoices/:id/send` ➔ Transitions status to `SENT`. **Document becomes immutable**. Dispatches email with PDF attachment.
* `POST /api/v1/invoices/:id/payments` ➔ Record cleared payment against invoice. Recalculates `paidAmount` and updates invoice status to `PARTIAL` or `PAID`.
* `GET  /api/v1/invoices/:id/pdf` ➔ Stream rendered PDF invoice.

### Support & Chatter (`/api/v1/chatter`)
* `GET  /api/v1/chatter/:recordType/:recordId` ➔ Retrieve chronological activity logs.
* `POST /api/v1/chatter` ➔ Post note, client message, or call log.

---

## 4. Background Workers & Redis Queues (BullMQ)

Running 24/7 inside the Bun backend process:

1. **`invoice-reminder-queue`:**
   * Runs daily at `02:00 UTC`.
   * Queries invoices with `status IN ('SENT', 'PARTIAL')`.
   * Sends polite reminder at `dueDate - 3 days`.
   * Sends urgent reminder at `dueDate`.
   * Flags status as `OVERDUE` and alerts finance team at `dueDate + 1 day`.
2. **`sla-monitor-queue`:**
   * Runs every 15 minutes.
   * Scans open `Ticket` records approaching `slaDueTime` and alerts assigned agents before breach.
3. **`timer-heartbeat-worker`:**
   * Cleans stale timer sessions in Redis older than 12 hours (auto-pause safety mechanism).
