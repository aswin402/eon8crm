# EON8 CRM — Design System & UI/UX Specification

**Author:** 15-Year Principal Architect & Product Designer  
**Status:** Approved for Component Scaffolding  
**Aesthetic Vision:** High-Density Executive SaaS (Inspired by Linear, Twenty CRM, and Midday.ai)  

---

## 1. Design Philosophy & Creative Direction

Enterprise internal tools often suffer from two extremes: either ugly, cluttered legacy tables (like 2005 SAP) or overly spaced-out, low-density modern UIs with giant whitespace where you can only view 3 rows of data at a time.

**EON8 strikes the sweet spot: High-Density Craftsmanship.**
* **Density with Breathing Room:** Compact typography, 32px table rows, and clean 1px borders allow power users to digest 50+ records on a screen without cognitive overload.
* **Tabular Numbers for Financials:** All monetary amounts (₹), invoice numbers, and timer clocks enforce `font-mono tabular-nums` so numbers align vertically in tables.
* **Instant Visual Semantics:** Colors carry strict, consistent meaning across the entire application:
  * 🟢 **Emerald:** `WON` deals, `PAID` invoices, profitable projects (>40% margin).
  * 🟡 **Amber:** `IN_PROGRESS` tasks, `DRAFT` invoices, projects requiring attention (20-40% margin).
  * 🔴 **Rose/Red:** `OVERDUE` invoices, `URGENT` tickets, unprofitable projects (<20% margin).
  * 🔵 **Indigo:** Active selections, primary actions, running timers.

---

## 2. Design Tokens & Color Palette

The interface is built on **Tailwind CSS v4** utilizing HSL CSS variables for light and dark modes:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EON8 DESIGN PALETTE                               │
├─────────────────────┬───────────────────┬───────────────────────────────────┤
│ Token               │ Light Mode (Hex)  │ Dark Mode (Hex)                   │
├─────────────────────┼───────────────────┼───────────────────────────────────┤
│ Background Primary  │ #FFFFFF (Pure)    │ #090A0F (Deep Obsidian)           │
│ Background Surface  │ #F8FAFC (Slate-50)│ #12141C (Subtle Charcoal)         │
│ Card / Container    │ #FFFFFF           │ #181B26 (Elevated Navy-Zinc)      │
│ Border / Divider    │ #E2E8F0 (Slate-200│ #262B3D (Crisp Edge)              │
│ Primary Brand       │ #4F46E5 (Indigo)  │ #6366F1 (Electric Indigo)         │
│ Text Primary        │ #0F172A (Slate-900│ #F8FAFC (Slate-50)                │
│ Text Muted          │ #64748B (Slate-500│ #94A3B8 (Slate-400)               │
│ Success (Paid/Won)  │ #10B981 (Emerald) │ #34D399 (Vibrant Mint)            │
│ Warning (Pending)   │ #F59E0B (Amber)   │ #FBBF24 (Warm Gold)               │
│ Danger (Overdue)    │ #EF4444 (Rose)    │ #F87171 (Electric Coral)          │
└─────────────────────┴───────────────────┴───────────────────────────────────┘
```

---

## 3. Typography & Hierarchy

* **Primary Font Family:** `Geist Sans`, `Inter`, system-ui fallback.
* **Monospace / Numbers:** `Geist Mono`, `JetBrains Mono`, `ui-monospace`.

| Level | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display KPI** | `32px` | Bold (`700`) | `36px` | `-0.02em` | Dashboard KPI numbers (₹12.5L) |
| **H1 (Page Title)**| `24px` | SemiBold (`600`)| `28px` | `-0.015em`| Screen headers |
| **H2 (Section)** | `18px` | SemiBold (`600`)| `22px` | `-0.01em` | Card headers, Drawer titles |
| **Body Default** | `14px` | Regular (`400`) | `20px` | `normal` | Paragraphs, descriptions |
| **Table / Dense** | `13px` | Medium (`500`)  | `16px` | `normal` | Table rows, badge labels |
| **Caption / Meta**| `11px` | Medium (`500`)  | `14px` | `+0.01em`| Timestamps, sub-labels |

---

## 4. Master Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EON8 CRM █  Search (Cmd+K)        [Timer: 01:24:10 ▶ Project X]  User Menu │ 56px Header
├──────────────┬──────────────────────────────────────────────────────────────┤
│ CORE         │                                                              │
│ • Dashboard  │  BREADCRUMBS: Clients / Acme Corp / Projects                 │
│ • Leads      │  ──────────────────────────────────────────────────────────  │
│ • Clients    │                                                              │
│ • Projects   │  [ MAIN PAGE CONTENT AREA ]                                  │
│ • Tasks      │  High-density grid / table / kanban                          │
│ • Time Track │                                                              │
│ FINANCE      │                                                              │
│ • Invoices   │                                                              │
│ • Payments   │                                                              │
│ • Expenses   │                                                              │
│ OPERATIONS   │                                                              │
│ • Tickets    │                                                              │
│ MANAGEMENT   │                                                              │
│ • Analytics  │                                                              │
├──────────────┴──────────────────────────────────────────────────────────────┤
│ 260px Collapsible Sidebar                                                   │
```

* **Sidebar:** 260px width, collapsible to 64px icon-only rail on compact screens. Organized strictly into the 4 architectural tiers: `CORE`, `FINANCE`, `OPERATIONS`, `MANAGEMENT`.
* **Top Navigation Bar (56px):**
  * Global Search (`Cmd + K`) for instant lookup of any Lead, Client, Invoice, or Task.
  * **The Universal Floating Timer Dock.**
  * Quick Action `+` Menu: Instant creation of Invoice, Client, Lead, or Ticket.
  * Notification Bell & Role Badge.

---

## 5. Signature UI/UX Components

### Component 1: The Universal "Chatter" Component (Odoo-Inspired)
Located on the right-hand drawer or bottom of every entity record (Lead, Client, Project, Invoice):
* **Tab 1: Internal Note (Yellow Tinted):** For private internal team discussion (e.g., *"Client requested 10% discount on redesign"*). Client will never see this.
* **Tab 2: Client Message (White/Neutral Tint):** Outbound communication logged to email or WhatsApp.
* **Tab 3: Activity Scheduler:** Quick date/time picker to schedule calls, proposals, or follow-ups with automatic calendar syncing.
* **Tab 4: Audit Diff:** Automated chronological history showing exact field diffs (`status changed from PROPOSAL to NEGOTIATION by Aswin at 14:20`).

---

### Component 2: The Universal Floating Timer Dock (Midday-Inspired)
* Located permanently in the top navigation bar.
* Features:
  * Select Project dropdown with autocomplete.
  * Select Task dropdown (filtered by chosen project).
  * Big high-contrast counter: `01:42:18` (`tabular-nums font-mono`).
  * Glowing pulse dot (green for active, amber for paused).
  * One-click Play / Pause / Stop & Log buttons.
  * When "Stop" is clicked, an immediate quick-modal prompts: *"Add work summary..."* with a pre-checked *"Billable"* switch.

---

### Component 3: The 7-Stage Sales Kanban Board (Frappe CRM-Inspired)
* Fluid horizontal scrolling column board for the 7 stages:
  `NEW` | `CONTACTED` | `QUALIFIED` | `MEETING` | `PROPOSAL` | `NEGOTIATION` | `WON`
* **Stage Header Summary:** Each column header displays the count of active deals and the total aggregated pipeline value in Indian currency notation (e.g., `PROPOSAL (4 deals • ₹8.50L)`).
* **Card Anatomy:**
  * Company Name & Lead Number (`LEAD-2026-004`)
  * Deal Value badge (e.g., `₹2,50,000`)
  * Days in Stage indicator (`⏱ 3d ago`)
  * Assigned Salesperson Avatar
  * Drag Handle for smooth optimistic drag-and-drop.
* **Moving to `WON`:** Triggers a celebration micro-animation (confetti) and opens the *"Convert to Client & Provision Project"* confirmation modal.

---

### Component 4: The Real-Time Project Gross Margin Pill
Present on every Project card and table row:
* Automatically computes:  
  $$\text{Margin \%} = \frac{\text{Billed Amount} - \text{Total Internal Cost}}{\text{Billed Amount}} \times 100$$
* **Badge Styling:**
  * High Profit: `● 58% Margin` (Green pill with emerald background).
  * Healthy: `● 34% Margin` (Yellow pill with amber background).
  * Danger: `● 12% Margin` (Red pill with crimson background).
* Hovering over the pill reveals an instant popover tooltip:
  * Total Billed: ₹4,50,000
  * Internal Labor Cost: ₹1,89,000 (126 hrs logged)
  * Direct Expenses: ₹45,000
  * **Net Gross Profit: ₹2,16,000**

---

### Component 5: The Invoice Studio & GST Preview
* Split-screen layout:
  * **Left Side (Form Controls):** Client selector, date pickers, GST type toggle (Intra-state CGST/SGST vs. Inter-state IGST), line items with SAC codes, quantities, and rates. Includes the *"Pull Unbilled Hours"* button.
  * **Right Side (Live Rendered PDF Preview):** Instant visual representation of the exact PDF that will be downloaded or emailed, complete with company letterhead, tax tables, bank payment details, and UPI QR code.
