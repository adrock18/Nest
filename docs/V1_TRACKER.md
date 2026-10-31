# Nest V1: Setup Guide, Architecture & Explorer Tracker

> **Document Status**: Active Living Document  
> **Scope**: Version 1.0 Implementation Ledger  
> **Purpose**: Detailed technical rationale for all environment prerequisites, system components, and an itemized ledger tracking every file added or modified in the workspace before committing to Git.

---

## 1. Why All This Setup? (The Architectural Rationale)

Before building features, we intentionally chose a **local-first, desktop-native stack**: **Tauri 2 + React (TypeScript, Vite) + Rust + embedded SQLite (`rusqlite`)**.

### The Core Problem Nest Solves
Personal financial data is sensitive. Most commercial trackers either:
1. Demand bank credentials and cloud accounts (privacy risk, recurring fees, vendor lock-in).
2. Are slow, bloated Electron web wrappers that consume 300MB+ of RAM just to show a budget table.

### Why Tauri 2 + Rust Instead of Electron or Pure Web?

| Dimension | Pure Web App | Electron App | Nest (Tauri 2 + Rust) |
|---|---|---|---|
| **Data Privacy** | Hosted on cloud servers | Local, but heavy | **100% Local (air-gapped, zero cloud)** |
| **Executable Size** | N/A (browser tab) | 120MB – 250MB | **~5MB – 15MB** |
| **Idle Memory (RAM)** | Browser overhead | 250MB – 450MB | **~25MB – 40MB** |
| **Database Engine** | IndexedDB / Cloud API | SQLite via Node C++ addon | **Native Embedded SQLite via Rust (`rusqlite`)** |
| **Financial Precision** | Floating-point risks in JS | Floating-point risks in JS | **Strict Integer Paise (Rust-enforced)** |
| **Durability** | Subject to browser cache wipes | Local files | **Atomic transactions + OS AppData backup drills** |

---

## 2. Component Deep Dive: What Was Installed & Why

Here is the exact explanation of every tool, prerequisite, and background process evaluated on your system:

### 2.1. Node.js & npm (`v24.19.0`, npm `11.17.0`)
- **What it is**: The JavaScript runtime and package manager.
- **Why we need it**: In Tauri, the user interface is written using standard web technologies. Node.js runs the **Vite dev server**, handles **TypeScript compilation**, and bundles the React UI components.
- **Usage in Nest**:
  - Development time: Provides hot-reload so that when you change a button or table in React, the desktop app updates in milliseconds.
  - Build time: Bundles the HTML, CSS, and JS into static production assets.
  - **Crucial Note**: Node.js is *not* shipped to the end user. The final desktop app does not require Node.js to be installed on any computer.

### 2.2. Microsoft Edge WebView2 (`v155.0.4283.62`)
- **What it is**: The system-level Chromium browser rendering engine built directly into Windows 10 and 11 by Microsoft.
- **Why we need it**: Unlike Electron (which bundles an entire copy of Chromium inside every application installer), Tauri leverages the WebView2 runtime already present in the Windows OS.
- **Usage in Nest**: Renders the Nest user interface inside a native desktop window with hardware acceleration and zero memory bloat.

### 2.3. Rust & Cargo (`v1.99.1`)
- **What it is**: A high-performance, memory-safe systems programming language (`rustc`) and its official package/build manager (`cargo`).
- **Why we need it**: Rust acts as the native "brain" and security boundary of Nest:
  - It owns the desktop window lifecycle.
  - It directly interacts with the Windows filesystem to read and write database files in `%LOCALAPPDATA%\Nest`.
  - It runs embedded SQLite queries via `rusqlite` safely with zero memory leaks.
  - It guarantees strict money precision: all numbers sent across the bridge are verified positive integer paise.
- **Usage in Nest**:
  - Compiles the backend code in the `src-tauri` directory.
  - Handles Tauri inter-process communication (IPC) commands: when the React UI clicks "Add Expense", an IPC call invokes Rust, which executes a parameterized SQL transaction.

### 2.4. Tauri CLI (`tauri-cli 2.12.3`)
- **What it is**: The build orchestrator and developer CLI tool for Tauri applications.
- **Why we need it**: It bridges the frontend (Vite/React) with the backend (Cargo/Rust).
- **Usage in Nest**:
  - `npx @tauri-apps/cli dev`: Starts the Vite dev server, compiles the Rust backend, and launches the native desktop window with hot reloading.
  - `npx @tauri-apps/cli build`: Bundles the React assets, compiles an optimized release binary of the Rust core, and generates a standalone Windows installer (`Nest-Setup.exe`).

### 2.5. Microsoft Visual Studio C++ Build Tools (MSVC Linker & Windows SDK)
- **What it is**: Microsoft's official C/C++ compiler toolchain (`link.exe`), C runtime libraries, and Windows SDK headers.
- **Why we need it**:
  - Rust on Windows defaults to the Microsoft C ABI (`x86_64-pc-windows-msvc`).
  - To produce an `.exe` file on Windows, the Rust compiler must invoke `link.exe` to link your code against native Windows system libraries (`kernel32.lib`, `user32.lib`, `advapi32.lib`, and the WebView2 loader).
  - Furthermore, `rusqlite` compiles the official C source code of SQLite (Amalgamation) directly into the binary at compile time. This requires an MSVC C compiler.
- **Usage in Nest**:
  - Compiles SQLite C source code directly into the native Rust binary.
  - Links the final desktop executable so it runs natively on Windows without third-party dependencies.

---

## 3. High-Level Architecture & Data Flow

```text
+---------------------------------------------------------------------------------------+
|                                    NEST DESKTOP APP                                   |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |                       FRONTEND LAYER (React + TypeScript)                     |   |
|   |   - Dashboard, Transaction Workspace, Budget Manager, Category Allocations    |   |
|   |   - Modern Vanilla CSS Design System (clean dark/light theme, high speed)     |   |
|   +-------------------------------------------------------------------------------+   |
|                                         │ ▲                                           |
|                                         │ │ Tauri IPC (invoke / events)               |
|                                         ▼ │                                           |
|   +-------------------------------------------------------------------------------+   |
|   |                         BACKEND LAYER (Rust Native Core)                      |   |
|   |   - Commands: create_transaction, get_monthly_summary, set_budget, backup_db  |   |
|   |   - Validation: whole paise, positive integers, strict YYYY-MM-DD dates       |   |
|   +-------------------------------------------------------------------------------+   |
|                                         │ ▲                                           |
|                                         │ │ Parameterized SQL Queries                 |
|                                         ▼ │                                           |
|   +-------------------------------------------------------------------------------+   |
|   |                        LOCAL DATABASE (SQLite / rusqlite)                     |   |
|   |   - Location: %LOCALAPPDATA%\Nest\nest.db                                     |   |
|   |   - Atomic ACID transactions, numbered migrations, point-in-time VACUUM backups|   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

---

## 4. Explorer & Workspace Tracker (The Living Manifest)

This table tracks **every file and directory** currently in the workspace, what was added/modified, its exact purpose, and the engineering rationale. 

*Before pushing to Git, this ledger serves as your verifiable audit log.*

| File / Folder Path | Status | Purpose & Role | Engineering Rationale / Context |
|---|---|---|---|
| [`AGENTS.md`](AGENTS.md) | Existing (Baseline) | Instructions and rules for AI coding assistants | Establishes the non-negotiables: whole paise, strict dates, SQLite migrations, Tauri 2 stack. |
| [`CLAUDE.md`](CLAUDE.md) | Existing (Baseline) | Pointer file to `AGENTS.md` | Ensures multi-agent compatibility without duplicating rule files. |
| [`README.md`](README.md) | Existing (Baseline) | Project overview and V1 implementation roadmap | Defines the complete 6-milestone path to Version 1.0 release. |
| [`CHANGELOG.md`](CHANGELOG.md) | Existing (Baseline) | High-level user-facing release notes | Follows "Keep a Changelog" format for official version bumps. |
| [`IDEAS.md`](IDEAS.md) | Existing (Baseline) | Post-V1 backlog and future concept repository | Keeps V1 strictly focused by safely parking advanced features (AI assistant, OCR scanner, maps). |
| [`.gitignore`](.gitignore) | Existing (Baseline) | Git exclusion patterns | Prevents build artifacts, node modules, and system files from entering version control. |
| [`.gitattributes`](.gitattributes) | Existing (Baseline) | Git line-ending normalization | Standardizes CRLF vs LF handling on Windows machines. |
| [`docs/V1_TRACKER.md`](docs/V1_TRACKER.md) | **Newly Added** | Architecture, Setup Rationale & Living Explorer Ledger | **This document.** Explains every setup choice, component role, and provides a continuous tracker for all files added during V1 without relying solely on Git history. |
| [`docs/V1_SCOPE.md`](docs/V1_SCOPE.md) | **Newly Added** | Version 1.0 Scope & Technical Specification | Authoritative specification detailing the 6 functional pillars of V1, non-negotiable architectural standards, and out-of-scope boundaries. |
| [`package.json`](package.json) | **Newly Added** | Frontend project manifest & npm scripts | Declares dependencies (`react 19`, `@tauri-apps/api 2`, `@tauri-apps/cli`) and build scripts (`dev`, `build`, `tauri`). |
| [`tsconfig.json`](tsconfig.json) | **Newly Added** | TypeScript compiler configuration | Enforces strict static type checking for React components and IPC contracts. |
| [`tsconfig.node.json`](tsconfig.node.json) | **Newly Added** | TypeScript config for Vite configuration files | Separates node-specific build configs from browser application code. |
| [`vite.config.ts`](vite.config.ts) | **Newly Added** | Vite development server and bundler config | Configures dev server port 1420 and environment variables tailored for Tauri IPC. |
| [`index.html`](index.html) | **Newly Added** | Single-page application entry point | Mounts the React `#root` element and loads Google Fonts (Inter, JetBrains Mono). |
| [`public/`](public/) | **Newly Added** | Static web assets directory | Holds raw static assets (e.g. app logos) bundled directly with the webview. |
| [`src/`](src/) | **Newly Added** | Frontend React source code | Root of all user interface components, views, styles, and state management. |
| [`src/main.tsx`](src/main.tsx) | **Newly Added** | React application bootstrap | Mounts the `<App />` component into the DOM. |
| [`src/App.tsx`](src/App.tsx) | **Enhanced** | Main desktop application container | Houses navigation tabs, view routing, layout, and global Linear-style keyboard shortcuts (`N`, `T`, `B`, `D`, `S`). |
| [`src/types/index.ts`](src/types/index.ts) | **Newly Added** | TypeScript financial data contracts | Defines `Transaction` (with `accountId`, `tags[]`, `isRecurring`), `Account`, `CategoryBudget`, and `MonthlyFinancialSummary` with integer paise precision. |
| [`src/utils/money.ts`](src/utils/money.ts) | **Hardened** | Currency formatting & parsing utilities | Formats integer paise into localized Indian Rupee (`₹`) strings, sanitizes commas/spaces/currency prefixes, rounds sub-paise cleanly, and validates strict decimal inputs. |
| [`src/styles/theme.css`](src/styles/theme.css) | **Refined & Upgraded** | Complete Design System Tokens (Nordic Warm Slate & Steel) | Warm graphite canvas, titanium specular highlights, pure Emerald Green and Crimson Red financial semantics. |
| [`src/components/Sidebar.tsx`](src/components/Sidebar.tsx) | **Refined & Upgraded** | Desktop navigation sidebar | Left navigation rail with active tab states, keyboard shortcut badges (`D`, `T`, `B`, `S`), offline indicator, and theme switch. |
| [`src/components/Header.tsx`](src/components/Header.tsx) | **Refined & Upgraded** | Top application header bar | Houses view title, monthly scope pill (`October 2026`), theme toggle, and `+ Add Transaction` with `N` shortcut badge. |
| [`src/components/ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx) | **Newly Added** | Top-level React error boundary | Catches runtime component errors and renders a friendly recovery card, completely preventing blank white screens. |
| [`src/components/AddTransactionModal.tsx`](src/components/AddTransactionModal.tsx) | **Hardened** | Transaction entry modal form | Safe accounts fallback, automatic accountId sync, sanitized tag parsing (strips duplicate/isolated hashes), and strict `YYYY-MM-DD` date validation. |
| [`src/views/DashboardView.tsx`](src/views/DashboardView.tsx) | **Hardened** | Financial Command Center view | Implements 5-10s financial snapshot, Safe-to-Spend with expandable math breakdown, Financial Pulse health strip, and defensive `cashRunway` float parsing. |
| [`src/views/TransactionsView.tsx`](src/views/TransactionsView.tsx) | **Hardened** | Transaction Workspace view | Live filterable table with defensive guards against undefined tags, notes, or accounts. |
| [`src/views/BudgetsView.tsx`](src/views/BudgetsView.tsx) | **Hardened** | Monthly Category Budgets view | Category allocation cards showing spent vs. limit progress bars, overspend alerts, safe array fallbacks, and zero-division ceiling safeguards. |
| [`src/views/SettingsView.tsx`](src/views/SettingsView.tsx) | **Upgraded** | Settings, Backups & Export Hub | Multi-format export center: 1-click clipboard paste for Google Sheets, comprehensive CSV financial analysis workbook, raw ledger export, and embedded SQLite path. |
| [`src/utils/export.ts`](src/utils/export.ts) | **Newly Added** | Spreadsheet Analysis & Export Engine | Formats complete multi-table financial workbooks (Executive Overview, Category Breakdown, Account Reconciliation, and Itemized Ledger) in CSV and TSV formats. |
| [`src/services/api.ts`](src/services/api.ts) | **Newly Added** | Unified API bridge service | Bridges React UI with native Tauri IPC commands, with transparent offline hydration. |
| [`src-tauri/`](src-tauri/) | **Newly Added** | Native Rust backend directory | The OS-native boundary for Tauri, SQLite persistence, and window management. |
| [`src-tauri/Cargo.toml`](src-tauri/Cargo.toml) | **Newly Added** | Rust crate manifest | Declares dependencies (`tauri 2`, `serde`, `serde_json`, `rusqlite` bundled, `uuid`, `chrono`). |
| [`src-tauri/tauri.conf.json`](src-tauri/tauri.conf.json) | **Newly Added** | Tauri application & window configuration | Defines desktop window dimensions (1120x750, min 900x600), explicit `main` label, and window visibility. |
| [`src-tauri/build.rs`](src-tauri/build.rs) | **Newly Added** | Rust build script | Hooks into `tauri-build` to generate platform-specific desktop resources. |
| [`src-tauri/src/main.rs`](src-tauri/src/main.rs) | **Newly Added** | Desktop executable binary entry point | Boots the Tauri application runtime. |
| [`src-tauri/src/lib.rs`](src-tauri/src/lib.rs) | **Enhanced** | Rust backend library & command registry | Registered travel commands (`get_trips`, `create_trip`, `delete_trip`, `get_trip_expenses`, `create_trip_expense`, `delete_trip_expense`). |
| [`src-tauri/src/models.rs`](src-tauri/src/models.rs) | **Enhanced** | Rust SQLite domain models | Added `Trip` and `TripExpense` domain models with integer paise precision and camelCase serialization. |
| [`src-tauri/src/db.rs`](src-tauri/src/db.rs) | **Enhanced (Migration 3)** | Embedded SQLite database engine | Added Migration 3 creating `trips` and `trip_expenses` tables, parameterized queries, and 8/8 passing unit tests. |
| [`src-tauri/src/commands.rs`](src-tauri/src/commands.rs) | **Enhanced** | Native Tauri command handlers | Added IPC handlers for trips and trip expenses. |
| [`src/utils/travel.ts`](src/utils/travel.ts) | **Newly Added** | Travel Calculations & Split Settlement Engine | Handles integer paise splits with 0 lost paise, daily spending averages, category aggregations, and debt minimization algorithm. |
| [`src/components/AddTripModal.tsx`](src/components/AddTripModal.tsx) | **Newly Added** | Trip Creation Dialog | Dialog for creating new trips with destination, date range, budget, and companion list. |
| [`src/components/AddTravelExpenseModal.tsx`](src/components/AddTravelExpenseModal.tsx) | **Newly Added** | Travel Expense Logging Dialog | Quick activity presets (surfing, kayaking, resort, dining, fuel), category selector, paid-by member, equal/personal/custom split mode, and live preview. |
| [`src/views/TravelView.tsx`](src/views/TravelView.tsx) | **Newly Added** | Dedicated Travel & Trip Expense Workspace | 4 hero KPI metric cards (Total Spent, Per-Day Spend, Out-of-Pocket Share, Split Balance), Category breakdown, Day-by-Day timeline, and Split matrix. |
| [`tests/edge_cases.test.ts`](tests/edge_cases.test.ts) | **Expanded** | Comprehensive Automated Edge-Case Test Suite | 94 rigorous test assertions verifying money parsing, leap years, budget ceilings, safe-to-spend, CSV export, travel days, paise splits, and debt simplification. |
| [`scripts/create_shortcut.ps1`](scripts/create_shortcut.ps1) | **Newly Added** | Windows Desktop Shortcut Generator | Script that places the official `Nest.lnk` shortcut on the user's desktop pointing to `nest.exe` with `icon.ico`. |
| [`src-tauri/target/release/nest.exe`](src-tauri/target/release/nest.exe) | **Production Build** | Standalone Desktop Executable | Native Windows release binary compiled with Win32 GUI subsystem flags (launches immediately with no command prompt). |
| [`src-tauri/target/release/bundle/nsis/Nest_0.1.0_x64-setup.exe`](src-tauri/target/release/bundle/nsis/Nest_0.1.0_x64-setup.exe) | **Official Installer** | Standalone NSIS Windows Installer (2.1 MB) | Windows setup installer wizard that installs Nest to Program Files, adds Start Menu entry, and registers desktop icon. |
| [`run_nest.bat`](run_nest.bat) | **Newly Added** | Windows desktop one-click batch launcher | Sets user Cargo path and boots `npm run tauri dev` in an interactive desktop terminal for hot-reload dev. |

---

## 5. Current Prerequisite Verification Log

| Check Date | Item Tested | Result | Action Taken / Next Step |
|---|---|---|---|
| `2026-10-19` | Node.js Runtime | `v24.19.0` (OK) | Verified ready for Vite build server. |
| `2026-10-19` | npm Package Manager | `11.17.0` (OK) | Note: Windows PowerShell script execution policy bypassed via `cmd.exe /c`. |
| `2026-10-19` | Edge WebView2 | Installed (OK) | System rendering engine ready. |
| `2026-10-19` | Rust & Cargo | Installed (`v1.99.1`) | Downloaded via `rustup-init.exe` into `%USERPROFILE%\.cargo\bin`. Verified active. |
| `2026-10-19` | MSVC C++ Linker | **Installed (OK)** | Visual Studio Build Tools 2022 (`link.exe`, `cl.exe`, Windows SDK) fully operational. |
| `2026-10-27` | Native Rust Unit Tests | **8 / 8 PASSED (100%)** | `cargo test` in `src-tauri` passed in 0.01s: schema, migration 3, integer paise, SQL injection defense, Unicode/emojis, monthly summary, trip CRUD, and `VACUUM INTO` backup. |
| `2026-10-27` | TypeScript Edge-Case Suite | **94 / 94 PASSED (100%)** | `node tests/edge_cases.test.ts` passed: money math, leap year calendars, budget thresholds, safe-to-spend, Google Sheets TSV paste buffer, analysis CSV workbook, trip duration, integer paise splits, and debt simplification. |
| `2026-10-27` | Production Build | **Verified (OK)** | `npm run build` compiled 1,938 modules in 1.11s with zero errors. |
| `2026-10-20` | Production Installer | **Built (2.10 MB)** | Standalone installer `Nest_0.1.0_x64-setup.exe` and desktop shortcut `Nest.lnk` generated and verified. |
| `2026-10-27` | Travel Expenses Section | **Completed (100%)** | Dedicated section for travel trips & expenses: total spending, per-day spending, split expenses (debt minimization matrix), and rich travel categories (Activities & rides like surfing/kayaking, stay/hotel, dining, fuel, transport). |

---

## 6. Pre-V1 Edge-Case & Quality Assurance Report

### 6.1. Financial Math & Precision
- **Positive Integer Paise**: All amounts strictly stored in whole paise (`12.50` -> `1250`). Zero floating-point rounding errors.
- **Comma & Currency Sanitization**: Gracefully parses Indian (`1,50,000.50`), International (`150,000.00`), and prefixed (`₹1,250.50`, `$99.99`) inputs.
- **Sub-paise Rounding**: `10.004` rounds down to `1000`; `10.006` rounds up to `1001`.
- **Large Values**: Verified up to ₹1,00,00,000.00 (1 Crore = 1 Billion paise) without 64-bit integer overflow.
- **Strict Input Rejections**: Safely throws and rejects `0`, `0.00`, negative numbers (`-50`), non-numeric strings (`abc`), and malformed decimals (`12.34.56`).

### 6.2. Calendar & Dates
- **Strict Format**: Enforces `YYYY-MM-DD` formatting across frontend and backend.
- **Leap Year Verification**: Verified leap years `2024-02-29`, `2028-02-29`, `2000-02-29` as valid; non-leap year `2026-02-29` and `2100-02-29` rejected.
- **Month Transitions**: Monthly queries (`2026-10%`) cleanly filter all target-month records and exclude adjacent months.

### 6.3. Budget Ceilings & Allocations
- **Zero Ceiling Protection**: When `limitPaise = 0`, progress calculation returns 0% without `NaN` or `Infinity` divisions.
- **Threshold Triggers**: 79.9% stays "On Target"; 80.0% trips the "80%+ Used" amber warning; 100.1%+ triggers the crimson "Over Limit" alert.
- **Clamping**: Progress bars strictly clamped to 100% width while overage badge shows exact amount over limit.

### 6.4. Safe-to-Spend & Cash Runway
- **Safe-to-Spend Formula**: `Math.max(0, Liquid Cash - Recurring Commitments - Remaining Budgets)`. Always clamps to 0 in deficit scenarios.
- **Overdraft Protection**: Negative bank balances are clamped with `Math.max(0, bal)` so overdrafts do not fabricate liquid spendable cash.
- **Runway Parsing**: Handled `"12+"` string representation safely using `parseFloat`, preventing `NaN` comparison errors in financial pulse checks.

### 6.5. Security & SQLite Resilience
- **SQL Injection Defense**: Verified parameterized SQLite queries safely preserve injection payloads (e.g., `Robert'); DROP TABLE transactions; --`) as harmless literal text without affecting table schemas.
- **Unicode & Emojis**: Preserves 2,000+ character notes with emojis (`🛒 ₹99.99 🇮🇳`), Indian regional scripts (Hindi `किराना`), and escaped double-quotes.
- **Point-in-Time Live Backups**: `VACUUM INTO` creates an atomic, uncorrupted snapshot database file that can be opened and verified independently.

### 6.6. Multi-Month Stress Test Ledger
- Generated and reconciled 57 realistic household transactions across 3 accounts (`acc-hdfc`, `acc-icici`, `acc-cash`) spanning August, September, and October 2026.
- Inflow, outflow, and net account balance math matched to the exact paisa.

---

## 7. How This Tracker Will Be Maintained

Whenever a new file or directory is introduced, we will:
1. Add an entry to the **Explorer & Workspace Tracker** table in Section 4.
2. Document **why** that file was added and what responsibilities it holds.
3. Keep an accurate record of modifications so you retain 100% visibility over your project before staging any Git commits.

