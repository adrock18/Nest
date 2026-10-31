# Nest Version 1.0: Scope & Technical Specification Document

> **Document Status**: Approved Baseline Scope  
> **Target Release**: Version 1.0.0  
> **Platform**: Windows Desktop (Tauri 2 + React + Rust + Embedded SQLite)  
> **Distribution Model**: 100% Offline, Air-Gapped, Zero-Subscription Personal Application

---

## 1. Executive Summary & Product Statement

**Nest V1** is an installable, private, local-first personal finance application for Windows. It is engineered to give an individual complete visibility, discipline, and sovereignty over their monthly household cash flow, category budgets, and multi-account balances without surrendering financial data or banking credentials to third-party cloud servers.

### The Non-Negotiable Core Principles
1. **Your Data Stays on Your Machine**: 100% offline operation. All financial data resides exclusively in an embedded SQLite database inside the user's local operating system directory (`%LOCALAPPDATA%\Nest\nest.db`). Zero cloud servers, zero telemetry, zero analytics tracking.
2. **Financial Precision (Whole Paise)**: Money is never stored or computed using IEEE 754 floating-point numbers. Every currency value is stored and calculated as positive integer **paise** (`₹12.50 = 1250`). Decimal conversion happens strictly at the display layer.
3. **Zero Recurring Fees**: A permanent, private personal tool—no recurring annual subscriptions, no paywalls.
4. **Strict Architectural Boundary**: Advanced automation (bank cloud scraping, vision AI receipt OCR, autonomous financial agents) is strictly parked in [`docs/IDEAS.md`](IDEAS.md) to ensure Version 1 is rock-solid, fast, and delivered without scope bloat.

---

## 2. In-Scope Functional Deliverables (The 6 Pillars of V1)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                NEST V1 FUNCTIONAL SCOPE                                │
├─────────────────────────┬─────────────────────────┬────────────────────────────────────┤
│ 1. DESKTOP APPLICATION  │ 2. UNIVERSAL ACCOUNTS   │ 3. TRANSACTION WORKSPACE           │
│ - Native Windows Window │ - Bank, Credit, Cash    │ - Inflow & Outflow Logging         │
│ - Copilot/Monarch Theme │ - Available Liquid Cash │ - Multi-Tag Taxonomies (#work)     │
│ - Dark / Light Toggle   │ - Credit Card Dues      │ - Recurring Commitment Markers     │
│ - Sidebar Navigation    │ - Multi-Account Ledger  │ - Real-Time Search & Filtering     │
├─────────────────────────┼─────────────────────────┼────────────────────────────────────┤
│ 4. BUDGET MANAGER       │ 5. EXECUTIVE DASHBOARD  │ 6. DATA SAFETY & EXPORT            │
│ - Category Spending Caps│ - Inflow, Outflow, Net  │ - Embedded SQLite (rusqlite)       │
│ - Live Progress Bars    │ - Savings Rate %        │ - Point-in-Time VACUUM Backup      │
│ - Visual Alert Badges   │ - Category Distribution │ - Multi-Account CSV Ledger Export  │
│ - Overspend Warning GUI │ - Fixed Commitments Sum │ - JSON Portable Snapshot Backup    │
└─────────────────────────┴─────────────────────────┴────────────────────────────────────┘
```

---

### Pillar 1: Native Desktop Application Shell & Design System
* **Native Desktop Window**:
  * Bundled via **Tauri 2** running inside the system WebView2.
  * Window geometry: Default **1120 × 750**, minimum allowable bounds **900 × 600**, centered on monitor.
  * Launches instantly from the Windows Start menu or taskbar as a standalone executable.
* **Copilot & Monarch-Inspired Design System**:
  * Implemented using pure, high-performance **Vanilla CSS** (`src/styles/theme.css`).
  * **Dual-Theme Engine**:
    * **Obsidian Dark Mode**: Layered graphite surfaces (`#0d1117` canvas, `#131822` elevated surfaces), translucent borders, and ambient shadows.
    * **Alabaster Light Mode**: Low-glare canvas (`#f9fafb`), white cards (`#ffffff`), and charcoal typography (`#111827`).
    * **Compact Dashboard (Layout A)**: Neutral four-card monthly summary followed by spending and budget panels, with account balances last. Income figures are green, expenses red, and positive savings/balances blue. Deficits remain red. Motion respects system preferences.
    * **Theme Persistence**: Icon-only sun/moon control in the top header; preference retained in local configuration. The icon indicates the theme the button switches to.
  * **Typography**: Professional typography via **Inter** (clean UI labels) and **JetBrains Mono** (monospace tabular figures for currency).
* **Navigation Architecture**:
  * Scrollable grouped sidebar: **Dashboard**, **Transactions**, **Budgets**,
    **Travel**, and six spending workspaces. **Settings & Backups** stays at the bottom.
  * Dynamic top header displaying current view title, active month pill (`October 2026`), and a persistent `+ Add Transaction` quick-action button.
  * Local-first status badge: *"Offline & Private"*.

---

### Pillar 2: Universal Multi-Account Ledger
* **Account Archetypes**:
  * **Bank Accounts** (e.g. Salary Account, Savings Account)
  * **Credit Cards** (e.g. Credit line cards, statement balance tracking)
  * **Cash in Hand** (e.g. Physical wallet, petty cash)
* **Live Balance Computation**:
  * Derives balances dynamically from initial starting balances combined with recorded inflows and outflows.
  * Separates **Liquid Cash Position** (Bank + Cash, including overdrafts) from **Credit Liabilities** (credit card dues).
  * Balances use all recorded dates, independent of the selected month.
  * Credit starting amounts represent positive outstanding debt; the signed ledger starts negative, expenses increase debt, and income reduces it. A credit surplus is not counted as a liability.
* **Account Attribution**: Every transaction is explicitly tagged with the originating account.

---

### Pillar 3: Transaction Workspace & Precision Management
* **Dual-Flow Recording**:
  * Distinct categorization for **Expenses** (Outflow) and **Income** (Inflow).
  * Strict validation: amounts must be positive numbers; negative numbers are disallowed.
* **Fields Captured**:
  * `Date`: Strict calendar date (`YYYY-MM-DD`).
  * `Amount`: Input in Rupees, converted and persisted as exact integer **paise** (`₹250.50 -> 25050`).
  * `Account`: Dropdown linking to user accounts.
  * `Category`: Standardized household categories.
  * `Notes / Merchant`: Optional payee, store, or description.
  * `Tags`: Multi-dimensional tags (e.g. `#Work`, `#Groceries`, `#TaxDeductible`, `#Weekend`).
  * `Recurring Commitment`: Toggle marking transactions as fixed monthly commitments (Rent, Wi-Fi, Netflix).
* **Workspace Interaction**:
  * Real-time search matching notes, merchants, categories, accounts, or `#tags`.
  * Filter pills: **All Entries**, **Expenses**, **Incomes**, and **Recurring Only**.
  * Monospace table rendering with semantic color tags (Emerald for Inflow, Rose for Outflow).
  * Immediate in-line row deletion with automatic recalculation of all application totals.

---

### Connected Category Dashboards (V1)

- **Food & Dining**: Groceries, Dining Out, and travel food shares.
- **Subscriptions**: Recorded service charges, merchant grouping, recurring
  markers; no inferred renewal dates or automatic billing.
- **Transport & Fuel**: Fuel, Transport, and travel transport/fuel shares.
- **Home & Utilities**: Rent, Utilities, Home, and separately labeled trip stays.
- **Personal Care & Wellness**: Personal Care and existing Healthcare entries.
- **Shopping**: Purchases by merchant and travel shopping shares.
- Classification uses category mappings. Optional tags supply searchable
  context; they never move spending into a category.
- Monthly personal spending equals standalone household expense amounts plus
  `mySharePaise` from original trip expenses dated in that month. Group amounts
  and payer amounts are not substituted for personal shares.
- A nullable unique `Transaction.tripExpenseId` explicitly links an already
  recorded account payment. Linked payments are excluded from personal category
  totals while the original source exists, regardless of payment month. No
  matching by title/date/amount, and no automatic account payment creation.
- Household category plans use the same account-ledger amounts and dates as
  Monthly Budgets, including linked payments, without adding travel shares.
  Remaining allowance is calculated per budgeted category. Unbudgeted spending
  is labeled rather than deducted from other limits.
- Travel retains its trip-wide group budgets and splits. Source navigation
  opens the original trip ledger; category links on trip rows select the expense
  month. Deleting a source/trip clears links but preserves account payments.
- Travel has its own selected-month dashboard: personal shares, group bill
  amounts, recorded amounts paid by Me, trips with expenses, category shares,
  and the latest five expenses linking to the original ledger. All-date per-trip
  budgets distinguish no limit, approaching, reached, and exceeded. The full
  trip list remains independent of the selected month and dashboard totals are
  independent of trip search. Travel totals overlap connected category views;
  they are not an additional spending category or account cash-flow write.
- SQLite migration 005 is additive and atomic. Native deletion clears references
  via a trigger; browser preview performs explicit multi-collection rollback on
  write errors. Browser category defaults migrate once, preserving deletions.
- Shared projection helpers and a scoped workspace stylesheet keep feature
  UX configurable without duplicating finance records. Inventory, billing
  scheduling, automation, and new settlement systems remain out of scope.

### Pillar 4: Category Budgets & Overspend Alert Engine
* **Household Category Taxonomy**:
  * Seeded with common everyday household categories: *Rent, Groceries, Dining Out, Utilities, Fuel, Subscriptions, Healthcare, Salary, Freelance, Other*.
* **Monthly Allocation Ceilings**:
  * Set spending caps per category (e.g. *Groceries: ₹10,000 / month*).
  * Current implementation uses recurring monthly templates, not independent per-month budget records.
* **Dynamic Multi-Threshold Warning Engine**:
  * **Normal / On Target (<80% used)**: Displayed with clean Emerald progress indicators.
  * **Approaching Limit (80% to below 100% used)**: Amber warning, based on actual utilization rather than rounded display values.
  * **Limit Reached (exactly 100%)**: Explicit reached-limit status, with no false overspend amount.
  * **Over Budget (>100%)**: Rose alert with the exact overspend and actual utilization percentage.

---

### Pillar 5: Executive Monthly Analytics Dashboard
* **The 4 Primary Financial Metric Cards**:
  1. **Total Inflow**: Aggregated sum of all verified income sources for the month.
  2. **Total Outflow**: Aggregated sum of all month-to-date spending.
  3. **Net Savings**: Inflow − Outflow (highlighted in Cyan for surplus, Rose for deficit).
  4. **Savings Rate %**: Computed as `(Net Savings / Total Inflow) * 100`, providing an objective indicator of financial health.
* **Account Liquidity Row**: Quick-glance cards showing current liquid cash vs. credit liabilities.
* **Fixed Commitments**: Shows recorded recurring expense totals, already included in spending. Does not infer unpaid future bills, forecast a runway, or claim a guaranteed safe-to-spend amount.
* **Category Allocation Breakdown**: Visual horizontal distribution bars displaying the exact percentage of total outflow consumed by each category.

---

### Pillar 6: Embedded Persistence, Backups & Data Portability
* **Embedded SQLite Database (`rusqlite`)**:
  * Stored in `%LOCALAPPDATA%\Nest\nest.db`.
  * Parameterized SQL queries only (eliminating SQL injection risks).
  * Schema versioning tracked via `PRAGMA user_version = 1`.
  * Atomic transactions for multi-record operations.
* **Point-in-Time SQLite Backup**:
  * Generates a snapshot using SQLite's native `VACUUM INTO` engine with a bound destination and a read-only `quick_check`.
* **Data Portability (Zero Silos)**:
  * **CSV Ledger Export**: Includes all recorded months, accounts, tags, and amounts (INR and Paise), with text fields escaped for CSV.
  * **JSON Snapshot Export**: Includes all accounts, budgets, transactions, categories, and existing travel records. Snapshot export does not imply implemented restore support.
  * Browser preview uses separate localStorage and cannot produce SQLite backups. Corrupt or unwritable storage surfaces an error rather than silently loading sample data.

---

## 3. Explicitly Out of Scope for Version 1.0 (Queued for V2–V6)

To maintain stability and ship a dependable V1, the following features are documented in [`docs/IDEAS.md`](IDEAS.md) and deferred to subsequent phases:

| Feature | Phase | Rationale for Deferral |
|---|---|---|
| **Direct Bank Cloud Sync (Plaid / Account Aggregator)** | Phase 2 | Requires third-party cloud aggregator contracts; V1 must function 100% offline. |
| **Visual Deterministic Rules Engine** | Phase 2 | Automatic IF/THEN categorizers are built once manual baseline data exists. |
| **Cash-Flow Multi-Month Forecasting** | Phase 3 | Requires at least 60–90 days of recorded transaction history to produce reliable models. |
| **First-Class Savings Goal Engine** | Phase 3 | V1 focuses on budget compliance; multi-year goal allocations follow in V2. |
| **Conversational AI Q&A ("Ask Your Budget")** | Phase 4 | Requires local LLM runtime (e.g. Ollama) or private API key integration. |
| **Vision AI Receipt Scanner & OCR** | Phase 4 | Image processing and OCR parsers require standalone model weights or vision APIs. |
| **Autonomous AI Agent & Action Proposals** | Phase 5 | Agentic tool-calling requires a mature, deterministic data engine. |
| **Multi-Device LAN Sync & Mobile Companion** | Phase 6 | Peer-to-peer sync protocols are built once the desktop data schema is finalized. |

---

## 4. Definition of Done (V1.0 Acceptance Criteria)

Version 1.0 is considered complete when:
1. **Compilation**: The Rust backend and React frontend compile cleanly via `npm run tauri build` without warnings or linker errors.
2. **Installer**: A standalone Windows installer (`Nest-Setup.exe`) installs and boots cleanly from the Windows Start menu.
3. **Storage**: All added accounts, transactions, and budgets persist across app restarts inside `%LOCALAPPDATA%\Nest\nest.db`.
4. **Precision**: Arithmetic calculations across Inflow, Outflow, Net, and Budgets match exact integer paise values with zero rounding skew.
5. **Portability**: Generating a CSV export and a point-in-time backup completes successfully without locking the database.
