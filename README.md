# Nest (Personal Finance Tracker)

> **A fast, private, local-first desktop application to track daily spending, monitor household income, enforce monthly budgets, and visualize where your money goes.**

[![Status](https://img.shields.io/badge/status-active%20development-blue)](#target-scope-for-version-10)
[![Target](https://img.shields.io/badge/target-Version%201.0-brightgreen)](#target-scope-for-version-10)
[![Platform](https://img.shields.io/badge/platform-Windows%20desktop%20(Tauri%202)-blueviolet)](#technology-stack)

---

## V1 Workspace Improvements

- **Compact monthly overview**: Neutral income, expense, net-savings, and
  savings-rate cards use semantic number colors. Spending and budget panels
  follow, then all-date account balances, in both dark and light mode.
- **Quick appearance control**: The header sun/moon button switches theme and
  retains your preference; Settings and storage status stay at the sidebar bottom.
- **Connected spending dashboards**: Food & Dining, Subscriptions, Transport &
  Fuel, Home & Utilities, Personal Care & Wellness, and Shopping each have
  monthly summaries, relevant breakdowns, category plans, and prefilled entry.
  Travel meals, journeys, stays, and shopping appear in their category views
  using **your share**, not the group bill. Open the original trip from any row.
- **Travel dashboard**: Selected-month personal shares, group bills, payer
  amounts, category breakdown, and recent source expenses sit above the trip
  list. Trip budget check-ins always use full-trip group spending across all
  dates. Travel is also accessible from the overview; its total overlaps the
  connected categories and must not be added to them.
- **No duplicated payments**: Optionally link a trip expense to an existing
  account entry. The personal dashboard counts its trip share once; the account
  ledger and cash-flow totals remain unchanged. Tags supply context, not
  classification. Deleting a trip/source removes the link, not the account payment.
- **Consistent budgets**: Category dashboards and Monthly Budgets use the same
  account-ledger spending, including linked payments. Trip shares are not added
  to household limits. Unbudgeted categories do not consume another category's
  remaining allowance; trips retain their separate group budgets.
- **Correct time scope**: The selected month controls income, spending, and
  transaction views. Account balances and Settings exports always include all
  recorded dates.
- **Dependable entry**: Save errors keep your input visible. Dates are validated
  as calendar dates, money is parsed with integer arithmetic, and zero starting
  balances are allowed.
- **Practical budgets**: Create categories, assign expense-category limits, and
  distinguish approaching, reached, and exceeded limits. Limits repeat each
  month; editing a limit changes the shared monthly template.
- **Honest preview mode**: Browser development uses separate localStorage data,
  with sample data only when storage is absent. SQLite backups require the
  desktop app. A portable JSON snapshot includes all recorded months and
  related categories and existing travel records.

Run `npm test` for finance and browser-storage regressions, `npm run build` for
the frontend, and `cargo test --manifest-path src-tauri/Cargo.toml` for native
SQLite validation. A passing build is not installer/restore-drill acceptance:
those remain separate V1 release checks.
Independent V1 workstreams and their ownership boundaries are tracked in
[`V1_TRACKER.md`](docs/V1_TRACKER.md#8-independent-v1-feature-workstreams).

---

## 1. Project Philosophy

Nest is built for daily, practical personal finance management without relying on third-party cloud servers or monthly software subscriptions:
- **Your Data Stays on Your Machine**: All transactions, accounts, and budgets are stored in an embedded SQLite database on your local drive. It functions 100% offline.
- **Precision First**: Money is stored as exact integer **paise** (₹10.50 = `1050`) to eliminate floating-point arithmetic errors.
- **Laser-Focused V1 Scope**: We are building a dependable, complete **Version 1.0** first. All advanced ideas (AI assistant, receipt OCR, geospatial maps, family splitting) are safely parked in [`IDEAS.md`](docs/IDEAS.md) and will be introduced only after Version 1 is live and actively used.

---

## 2. Target Scope for Version 1.0

Version 1.0 delivers a complete, dependable personal budget tracking workflow:

```text
+------------------------------------------------------------------------------------+
|                                NEST DESKTOP WORKSPACE                              |
|                                                                                    |
|  +------------------------------------------------------------------------------+  |
|  |                           EXECUTIVE MONTHLY DASHBOARD                        |  |
|  |   [Total Inflow: ₹85,000]   [Total Outflow: ₹42,300]   [Net Savings: ₹42,700] |  |
|  |   Category Breakdown Chart & Budget Utilization Gauges                       |  |
|  +------------------------------------------------------------------------------+  |
|                                                                                    |
|  +--------------------------------------+  +------------------------------------+  |
|  |       TRANSACTION WORKSPACE          |  |         BUDGET MANAGER             |  |
|  | - Add / Edit / Delete Expenses       |  | - Set Monthly Category Limits      |  |
|  | - Log Income & Track Net Cashflow    |  | - Visual Overspend Alerts          |  |
|  | - Search, Filter by Month & Category |  | - Target vs. Actual Progress       |  |
|  +--------------------------------------+  +------------------------------------+  |
|                                                                                    |
|  +------------------------------------------------------------------------------+  |
|  |                          DATA SAFETY & PORTABILITY                           |  |
|  |   - One-Click SQLite Backup / Restore Drill   - Export Transactions to CSV   |  |
|  +------------------------------------------------------------------------------+  |
+------------------------------------------------------------------------------------+
```

### Core V1 Features
1. **Desktop Application Experience**:
   - Packaged Windows desktop app built with **Tauri 2**.
   - Launches instantly from the Start menu without needing Node.js, Docker, or terminal commands.
2. **Transaction Management**:
   - Fast, keyboard-friendly entry for both **Expenses** and **Income**.
   - Fields: Amount (₹), Calendar Date (`YYYY-MM-DD`), Category, and Notes.
   - Comprehensive transaction table with sorting and month-scoped filtering.
3. **Category System**:
   - Seeded with essential everyday household categories: *Rent, Groceries, Vegetables, Subscriptions, Utilities/Water, Dining Out, Fuel, Healthcare, Salary, Other*.
   - Create, edit, and archive custom categories.
4. **Monthly Category Budgets**:
   - Set monthly spending limits per category.
   - Visual progress indicators with clear warnings when spending approaches or exceeds 100% of budget.
5. **Executive Analytics Dashboard**:
   - At-a-glance monthly summary: Total Income, Total Expenses, Net Savings, and Savings Rate percentage.
   - Category distribution visualization (see exactly what proportion of income goes to Rent vs. Groceries).
6. **Data Durability & Portability**:
   - Embedded SQLite persistence in the OS user directory (`%LOCALAPPDATA%\Nest`).
   - One-click verified point-in-time database backup and restore.
   - Clean CSV export for spreadsheet auditing.

---

## 3. Technology Stack

| Layer | Choice | Why We Chose It |
|---|---|---|
| **Frontend UI** | **React + TypeScript + Vite** | Modern, declarative component architecture with strong static typing. |
| **Desktop Shell** | **Tauri 2** | Native desktop wrapper using the system WebView; builds tiny, blazingly fast executables compared to heavy Electron apps. |
| **Native Core** | **Rust** | Manages high-performance file operations, native OS dialogs, and atomic database queries. |
| **Database** | **SQLite (`rusqlite`)** | The gold standard for embedded local storage; zero configuration, atomic ACID transactions, and easy backups. |
| **Styling** | **Modern Vanilla CSS** | Clean, fast, custom design system without bloated external utility frameworks. |

---

## 4. Path to Version 1.0 (Implementation Roadmap)

We will build Version 1.0 step-by-step together, testing and understanding each piece before moving to the next:

1. **Milestone 1 — Application Shell & UI Baseline**:
   - Scaffold the Tauri 2 + Vite + React + TypeScript application structure.
   - Build the main window layout, navigation, and theme styling.
2. **Milestone 2 — Transaction Management & Local Persistence**:
   - Create SQLite schema and Rust database connection.
   - Build the Expense & Income entry forms with validation.
   - Implement the transaction list with edit, delete, and month filtering.
3. **Milestone 3 — Categories & Monthly Budgets**:
   - Category management (default seed + custom categories).
   - Monthly budget allocation and overspend alert logic.
4. **Milestone 4 — Monthly Analytics Dashboard**:
   - Summary metric cards (Inflow, Outflow, Net, Savings Rate).
   - Visual category breakdown chart and spending distribution.
5. **Milestone 5 — Backup, Restore & Data Export**:
   - CSV export functionality.
   - Point-in-time database backup snapshot and safe restore drill.
6. **Milestone 6 — Hardening & Windows Installer Delivery**:
   - End-to-end testing, error boundary checks, and keyboard shortcuts.
   - Generate and test the standalone Windows installer (`setup.exe`).
   - Tag **Version 1.0.0** and begin daily real-world use!

---

## 5. Post-V1 Backlog

All advanced capabilities—including **Conversational AI Q&A ("Ask Your Budget")**, **Vision AI Receipt Scanner**, **Geospatial Spending Maps**, and **Family Multi-Account Splitting**—are documented in detail in [`IDEAS.md`](docs/IDEAS.md). Once Version 1.0 is shipped, we will pull the next milestone directly from that backlog.
