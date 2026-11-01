# Personal Finance OS: Master Roadmap & Feature Specification

> **Document Status**: Living Master Backlog & North-Star Specification  
> **Target Vision**: Monarch's breadth + YNAB's budgeting discipline + Copilot's UX + Rocket Money's automation + Empower's wealth analytics + Tiller's data ownership + an AI-native financial agent.  
> **Core Architecture Guarantee**: Local-first, privacy-guaranteed, user-owned SQLite ledger (`rusqlite`) running on desktop with zero mandatory cloud dependencies.

---

## 0. Product Philosophy & North Star

The application answers five fundamental human questions:
1. **Where am I?** *(Current net worth, cash position, debt burden, asset allocation)*
2. **Where is my money going?** *(Categorization, merchants, subscriptions, leaks)*
3. **Where am I heading?** *(Cash-flow forecast, runway, goal timelines, retirement probability)*
4. **What should I do?** *(Actionable AI insights, debt snowball/avalanche, budget adjustments)*
5. **Can the system do it for me?** *(Automated rules, agentic tool workflows, subscription negotiation drafts)*

```text
THE EVOLUTIONARY LADDER:
Expense Tracker ──> Financial Data Platform ──> Financial Intelligence ──> Financial Copilot ──> Autonomous Financial Agent
```

---

## 1. Competitive Architecture Benchmark

| Capability | Monarch Money | YNAB | Copilot Money | Rocket Money | Tiller Money | Actual Budget | Nest (Target Vision) |
|---|---|---|---|---|---|---|---|
| **Platform Model** | Cloud SaaS ($99/yr) | Cloud SaaS ($99/yr) | Apple/Web ($95/yr) | Freemium ($36-$144/yr) | Google Sheets/Excel ($79/yr) | Local-first Open Source | **Local-First Native Desktop (Zero Subscription)** |
| **Data Privacy** | Cloud servers (SOC 2) | Cloud servers | Cloud servers | Cloud servers | User spreadsheet | 100% Local (E2EE sync) | **100% Local Machine (`%LOCALAPPDATA%`, Air-Gapped)** |
| **Financial Precision**| Standard Float | Standard Float | Standard Float | Standard Float | Spreadsheet cells | Integer Cents | **Strict Integer Paise (Rust Enforced)** |
| **Budgeting Style** | Category targets | Zero-based envelope | Flexible monthly | Bill/Subscription focus | Custom formulas | Zero-based envelope | **Multi-System (Envelope, Zero-Based, 50/30/20, Flexible)** |
| **Account Sync** | Plaid + MX + Finicity | Plaid + MX | Plaid + MX | Plaid | Plaid + Yodlee | Plaid (SimpleFIN) | **Hybrid: Manual Ledger V1 $\rightarrow$ Indian Account Aggregator (AA) / Plaid V2** |
| **AI Architecture** | Cloud LLM Assistant | None | Basic ML categorize | Auto bill negotiation | AI-Ready Sheet export | None | **Privacy Gateway + Local Models + MCP Tool Calling Agent** |
| **Extensibility** | Closed | Closed | Closed | Closed | Formulas / Python | Community Extensions | **Developer Mode + SQLite Access + MCP Server + Plugin API** |

---

## 2. Master Feature Specification (48 Dimensions)

### System 1: Financial Command Center & Unified Home
* **01. Dynamic Modular Dashboard**: Drag-and-drop, resizable, hideable widgets: Net Worth, Cash Position, Liquid Runway, Debt Burn, Monthly Surplus, Savings Rate %, Goal Progress, and AI Action Feed.
* **02. Multi-Context Dashboards**: Separate views for Personal, Household, and Freelance/Business.

### System 2: Universal Account & Ledger Infrastructure
* **03. Universal Account Coverage**:
  * Banking: Checking, Savings, Cash in hand, Fixed Deposits (FDs), Recurring Deposits (RDs).
  * Credit: Credit cards, store charge cards.
  * Loans: Mortgages, auto loans, personal loans, student debt, credit lines.
  * Investments: Stocks, Mutual Funds, ETFs, Bonds, EPF/PPF, Crypto, Gold.
  * Real Assets: Real estate, vehicles, physical assets.
* **04. Multi-Aggregator Architecture**: Provider-agnostic ingestion (Indian Account Aggregator NBFC-AA framework, Plaid, MX, manual CSV/QIF/OFX drag-and-drop).
* **05. Universal Normalized Ledger Schema**:
  ```text
  Transaction ├── ID ├── AccountID ├── Date ├── PostedDate ├── AmountPaise ├── Currency ├── Merchant
              ├── CategoryID ├── SubcategoryID ├── Tags[] ├── Type (Income/Expense/Transfer/Refund/Investment)
              ├── IsRecurring ├── SubscriptionID ├── Location ├── ReceiptImagePath ├── Notes ├── Payer ├── Source
  ```
* **06. Event-Sourced Balance Reconciliation**: Ledger stores atomic immutable events; balances are computed derivatives, allowing point-in-time state reconstruction.
* **07. Data Quality & Health Center**: Dedicated UI for duplicate detection, orphaned records, unlinked transfers, and bank-vs-ledger balance reconciliation audits.

### System 3: AI Intelligence, Rules Engine & Categorization
* **08. Multi-Layer Categorization Pipeline**:
  `1. User Deterministic Rules` $\rightarrow$ `2. Merchant Pattern Dictionary` $\rightarrow$ `3. Historical User Memory` $\rightarrow$ `4. Local Fast Classifier` $\rightarrow$ `5. Cloud LLM Fallback (Zero Data Retention)`.
* **09. Personalization Engine**: Learns user preferences over time with explicit confidence scores and "Always apply this rule" prompts.
* **10. Visual Deterministic Rules Engine**: Complex conditional rules: `IF Merchant contains "Uber" AND Amount < ₹800 THEN Category = "Transit" AND Tag = "#Commute"`.
* **11. Multi-Dimensional Tagging**: Arbitrary tag taxonomies (`#TaxDeductible`, `#Trip2026`, `#Reimbursable`, `#Gift`).

### System 4: Multi-Method Budgeting & Goals
* **12. Multi-Paradigm Budget Engine**:
  * Traditional budget (Income − Expense = Target Savings).
  * Zero-based envelope budgeting (Every rupee gets a job).
  * Percentage allocation (50% Needs, 30% Wants, 20% Savings).
  * Safe-to-Spend flexible burn rate ("You can spend ₹1,200/day for the next 14 days").
* **13. Goal Progression Engine**: First-class goal models: Emergency Fund, Down Payment, Travel, Retirement targets with dynamic monthly funding shortfall alerts.

### System 5: Forecasting, Scenarios & Simulation
* **14. Multi-Horizon Cash-Flow Forecasting**: Deterministic 7-day, 30-day, 90-day, 1-year, and 5-year cash projections based on known recurring income and bills.
* **15. "Can I Afford It?" Scenario Simulator**:
  * User inputs: *"Can I buy a ₹2,00,000 laptop in December?"*
  * Engine computes: `Projected Cash + Inflow − Outflow − Commitment`.
  * Output: Impact on emergency buffer and downstream goal completion delay in months.
* **16. Life Event Modeling**: Simulate career change, home purchase, marriage, sabbatical, early retirement (FIRE calculations).

### System 6: Analytics, Metrics & Financial Health
* **17. Advanced Visualizations**: Sankey income-to-expense cash flow diagrams, category treemaps, spending heatmaps, and rolling 3-month burn rate waterfalls.
* **18. Objective Financial Health Score (0–100)**: Transparent, un-gamified score built on 6 sub-indexes: Emergency Runway, Savings Rate, Debt-to-Income, Budget Adherence, Investment Diversification, and Cash-Flow Stability.
* **19. Credit Card Intelligence**: Utilization percentages, statement billing cycle warnings, payoff interest calculators, and annual fee renewal alerts.
* **20. Debt Payoff Strategies**: Visual comparison of Avalanche (highest interest first) vs. Snowball (smallest balance first) with exact interest savings calculations.

### System 7: Subscriptions, Recurring Bills & Ingestion
* **21. Recurring & Subscription Intelligence**: Automated cadenced billing detection, annual frequency normalization, price hike alerts, and cancellation candidate flagging.
* **22. Multi-Modal Receipt Intelligence & Itemized Dish Split (Version 2.0)**:
  * Scan or paste group bills (e.g. 9-person dining out, water sports, shopping, tolls).
  * Interactive checklist allowing the user to select what specific dishes or items they ate/participated in.
  * Multi-tier split rules: Personal items (100% mine), Shared items (basket of naans, boat charter divided by group), and custom sub-group sharing.
  * Proportional distribution of taxes (GST) and service charges across consumed items with zero lost paise.
  * Auto-generates exact settlement debts for WhatsApp sharing.
* **23. Bank SMS & Notification Parser**: Fast clipboard parser for bank debit alerts and UPI SMS confirmations.

### System 8: Family, Business & Globalization
* **24. Household Finance & Multi-Payer Split**: Attribution for who paid and who benefited; automated monthly partner settlement calculations.
* **25. Personal vs. Freelance Separation**: Separate personal living expenses from deductible freelance business expenses and tax reporting.
* **26. Multi-Currency & FX Engine**: Accounts in INR, USD, EUR, GBP with historical exchange rate normalization.

### System 9: Autonomous AI Agent & Tool Ecosystem
* **27. AI Agent Tool System (MCP Compliant)**:
  * Native tool-calling API: `get_transactions()`, `get_budget_variance()`, `simulate_purchase()`, `forecast_runway()`.
  * Strict security gate: AI can propose actions; human must confirm execution.
* **28. AI Privacy & Model Gateway**: Router supporting local small models (Ollama/Llama 3 locally) or cloud models (Claude, Gemini, OpenAI) with explicit zero-retention flags.
* **29. Proactive Anomaly Detection**: High utility bill alerts, double-charging detection, missing regular salary alerts.
* **30. Daily/Weekly Financial Briefs**: Automated recaps delivered in-app or via local notifications.

### System 10: Platform, Extensibility & Safety
* **31. Point-in-Time SQLite Backups**: Atomic `VACUUM INTO` snapshots, rolling daily/weekly archives, and one-click database restore drills.
* **32. 100% Data Portability**: Unrestricted export to CSV, JSON, and XLSX.
* **33. Developer Mode & Model Context Protocol (MCP)**: Exposes a read-only local MCP server so users can query their private finance database directly from Claude Desktop, Cursor, or local Python scripts.

---

## 3. Strategic Phased Implementation Roadmap

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: FINANCIAL CORE (Current V1 Milestone)                                                  │
│ - Local-First Shell + Dark/Light Theme System                                                   │
│ - Exact Integer Paise Calculations & Currency Formatting                                        │
│ - Multi-Account Tracking (Bank, Credit Card, Cash)                                             │
│ - Transaction Workspace (Add, Edit, Delete, Filter, Search, Tags)                              │
│ - Monthly Category Budgets & Overspend Alert Thresholds                                         │
│ - Executive Summary Dashboard (Inflow, Outflow, Net Savings, Rate %)                            │
│ - Embedded SQLite Engine (rusqlite) + Atomic Migrations                                          │
│ - Data Portability (CSV Export & JSON Snapshot Backup)                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: AUTOMATION & MULTI-ACCOUNT HYDRATION (V1.5)                                            │
│ - Visual Deterministic Rules Engine (IF/THEN pattern matchers)                                  │
│ - Recurring Transaction & Subscription Tracker                                                  │
│ - Bank SMS & Notification Clipboard Parser                                                      │
│ - Indian Account Aggregator (AA) / OFX / QIF file import wizards                                │
│ - Optional Live Google Sheets API Cloud Sync (OAuth 2.0 direct cloud synchronization)           │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: FINANCIAL INTELLIGENCE & GOALS (V2.0)                                                  │
│ - Multi-Horizon Cash-Flow Forecasting (30-day / 90-day runway)                                   │
│ - First-Class Goal Engine (Emergency Fund, Down Payment, Vacations)                             │
│ - Debt Payoff Simulator (Snowball vs. Avalanche)                                                │
│ - Multi-Paradigm Budgeting (50/30/20, Envelope, Zero-Based)                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 4: AI COPILOT & VISION INGESTION (V2.5)                                                   │
│ - Local/Hybrid Natural Language Q&A ("Ask Your Budget")                                         │
│ - Vision AI Receipt Scanner & Line-Item Itemization                                             │
│ - Proactive Anomaly Detection (Double charge, price hike, unusual surge)                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 5: AUTONOMOUS AI FINANCIAL AGENT (V3.0)                                                   │
│ - "Can I Afford It?" Purchase Simulator with Goal Impact Analysis                               │
│ - AI Agent Action Proposals (Subscription cancellations, budget rebalancing)                    │
│ - Household Multi-Payer Split & Settlement Calculator                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 6: PLATFORM & POWER USER ECOSYSTEM (V3.5)                                                 │
│ - Model Context Protocol (MCP) Server for Cursor / Claude Desktop                               │
│ - Developer SQL Query Explorer & Custom Formulas                                                │
│ - Multi-Currency & Historical FX Conversion                                                     │
│ - Mobile Companion Client (Local LAN P2P Encrypted Sync)                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Scout — Items & Purchases (Unscheduled)

> **Status**: Future backlog idea only. Not part of any current release and carries **no version
> number** until a deliberate scope decision schedules it. Nest and Realm release numbering must be
> reconciled before an actual version is proposed. This is personal-possession tracking inside the one
> Nest app as internal modules — not a separate inventory application, and not business inventory.

A dedicated **Items & Purchases** workspace for personal possessions, purchase evidence, warranties
and consumable expiry. Transaction entry stays quick; this is a separate workspace, not a change to
the finance ledger. It builds on shared purchase/possession infrastructure with small optional
type-specific fields — not a generic configurable tracking platform.

### Must-have foundations (when selected)

- **Purchases and store locations**: purchase date, merchant, specific branch/address, invoice
  reference, and lines with quantities, prices and discounts. Preserve the original purchased
  description and store snapshot when catalog or merchant details later change.
- **Personal possessions**: register items from purchases, gifts, or unknown history. Optional
  product/model, serial number, location, condition and acquired date; support archived, returned,
  sold, donated and disposed lifecycle states without erasing financial history.
- **Payment links (no double-count)**: optionally associate a purchase/item with an existing ledger
  transaction without creating another expense. Distinguish payment account from optional method
  (UPI/card/cash) and reference; never store card credentials. One bill may hold several items. Count
  ledger money only once. Purchase cost is historical, not current asset valuation.
- **Photos and evidence**: multiple item photos, invoices and warranty documents via a managed
  attachment foundation. One original may serve several records without copying it per record.
- **Warranties and return deadlines**: provider, explicit confirmed start/end dates, terms and
  evidence; distinguish manufacturer/extended coverage from return windows. Unknown and
  not-applicable are explicit states, kept distinct from real dates. Display recorded coverage only,
  never a guarantee of claim eligibility.
- **In-app attention list**: upcoming, due and overdue recorded deadlines, recalculated on launch and
  after edits. Snoozing or dismissing a reminder does not alter its source date. No closed-app
  notifications without a separately approved background-execution design.
- **Finding records**: search/filter by item, merchant/branch, purchase date, type, location and
  lifecycle; navigate from payments to purchases/items and back to source evidence.

### Concrete examples the design must cover

- **Clothes**: one invoice for a shirt and two trousers; purchase date and store branch, per-item
  quantities/prices/discounts, optional size/color/material, individual photos, and a linked payment.
  Returns, donation or sale are tracked without changing the original purchase history.
- **SSD**: brand/model/capacity and individual serial number; seller/branch, purchase date, invoice,
  payment account versus method, and warranty evidence. A relationship can later identify the computer
  it is installed in; replacement history preserves the old SSD rather than overwriting it.

### Deferred increments

- **Consumable lots and expiry**: exact quantities/units, batch reference, optional opened date, and
  explicitly labelled expiry/use-by/best-before meaning. The same product can have different dates per
  lot; never attach one expiry to the catalog definition or infer food/medicine safety from a date.
- **Typed item relationships**: accessory-of, part-of, installed-in, replacement-for; reject invalid
  self-links, duplicates and containment cycles. Kits and replacements keep explicit history.
- **Purchase/payment complexity**: partial payments, multiple-payment allocations, partial returns and
  linked refunds beyond the initial simple linking scope.
- **Warranty claims and repairs**: claim status, communications, service evidence and replacement
  history, preserving the original item and coverage records.
- **Shopping insights**: store statistics, product price history, price tracking and deal scoring from
  comparable recorded purchases (the original Scout concept).
- **Per-expense location / spend map**: optional GPS or place capture on an individual purchase or
  travel expense so spending can later be shown on a map. Needs its own privacy, permission and
  platform decision; location is never required to record money.
- **Automation and capture**: barcode scanning, human-reviewed receipt/OCR drafts (drafts only, never
  auto-recorded money), closed-app reminders, mobile capture and sync — each needs its own scope and
  platform decision.
- **Out of scope for Scout**: business inventory, multiple operators, and warehouse/sales workflows
  are never implied by this module.

### Data, recovery and delivery boundaries

- Distinguish reusable **products**, **purchase lines**, individual **owned items** and **consumable
  lots**. Warranties usually belong to an owned item; expiry belongs to a lot. Stable IDs, foreign
  keys, indexes, native validation, SQLite constraints, and exact integer-paise / scaled-quantity
  arithmetic under the approved money contract.
- Removing a payment must not delete a possession; archiving/disposing an item must not erase
  financial history; removing one attachment link must not delete an original still referenced
  elsewhere.
- **Rust owns file imports and persistent writes.** Store managed originals in OS app-data storage
  outside the repo and install folder, with portable relative references, validated formats/sizes and
  checksums. Originals are durable; thumbnails are rebuildable. Handle interrupted imports, missing
  files, permission failures and disk-full errors explicitly — filesystem and SQL changes are not one
  atomic transaction.
- Backups include a coherent SQLite snapshot, referenced originals, a format/schema manifest and
  checksums. Restore validates in a separate location and preserves current data until replacement
  succeeds; reject unsupported future schemas clearly. Prove recovery with synthetic records before
  relying on real data.
- Deliver as small approved increments, roughly: (1) stabilize persistence + verified recovery,
  (2) managed attachments, (3) basic purchases/possessions + payment links, (4) warranties + attention
  list, (5) consumable lots + expiry meanings, (6) typed relationships + restricted read-only
  dashboard summaries. Implement only the approved increment, end-to-end, with tests.
- Tests must cover: multiple items on one invoice and gifts without payments; no double-counting
  across finance and item views; same product in different lots; calendar boundaries and unknown
  dates; deletion/archive/link behavior; shared attachments and interrupted imports; missing files and
  failed saves; upgrade, unsupported schema and full restore; restart/offline and installed Windows
  behavior; reminder recomputation without duplicate delivery.
