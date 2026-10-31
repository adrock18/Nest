# Changelog: Nest

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Travel dashboard with monthly personal shares, group bills, recorded amounts
  paid by you, trips with spending, personal-category breakdown, recent source
  navigation, and all-date per-trip budget check-ins. Added overview entry point.
  Month changes never reset trip budgets; trip search affects only the trip list.
- Six connected monthly spending dashboards: Food & Dining, Subscriptions,
  Transport & Fuel, Home & Utilities, Personal Care & Wellness, and Shopping.
  Category-prefilled recording, merchant/category breakdowns, household plans,
  source/tag search, related trips, and bidirectional source navigation.
- Optional unique account-entry links to travel expenses (SQLite migration 005).
  Personal dashboards count the original trip share once, without changing
  account cash flow. Source references are included in CSV/JSON exports.
- Projection, partial-budget, cross-month source, migration, uniqueness,
  deletion, and browser-storage rollback regression coverage.
- Compact dark/light V1 dashboard with a neutral monthly summary, spending
  distribution ring, budget check-ins, and individual account cards.
- Account-name transaction search, date/amount sorting, useful empty states, and
  a separate budget form for existing expense categories.
- Keyboard-focus containment in transaction/account dialogs, visible focus
  indicators, reduced-motion support, and layouts for the default and minimum
  Windows window sizes.
- Regression coverage for actual finance helpers, browser persistence failures,
  invalid dates, account references, credit balances, and backup verification.

### Fixed
- Trip/source deletion clears ledger references and preserves account payments.
  Native trip deletion is atomic; preview multi-collection errors are surfaced
  and writes are rolled back when browser storage permits.
- Travel save forms await persistence, retain input on errors, and validate
  calendar dates. Trip budget editing preserves exact paise.
- Account balances and Settings exports now use the complete ledger, while
  dashboard cash flow, category spending, and transactions use the selected month.
- Positive credit-card opening amounts represent debt; purchases increase dues,
  repayments reduce them, and card credit is not displayed as debt. Bank
  overdrafts remain visible rather than being clamped away.
- Decimal money parsing uses integer arithmetic and rejects unsafe amounts and
  aggregate totals. Negative savings rates are no longer hidden.
- Native transaction writes validate calendar dates, positive safe whole-paise
  amounts, account references, and matching category flow.
- Failed transaction/account/budget/category saves retain the form and display
  an error. Corrupt browser storage is not replaced with sample data.
- Custom browser categories persist; user accounts are no longer silently
  consolidated or re-created when an empty list is saved.
- Budget warnings use the actual 80% threshold, distinguish a reached limit from
  overspending, and retain utilization percentages above 100%.
- CSV escaping covers all text fields; JSON snapshots include categories and
  existing travel records; download object URLs are released.
- SQLite backups use a bound destination and a read-only integrity check.
  Browser preview no longer claims to create SQLite backups.

### Changed
- Adopted compact layout A: income, expenses, net savings, and savings rate
  appear in equal neutral cards; removed the large green savings hero.
- Colored income green, expenses red, and positive savings/balances blue.
  Account totals remain visible below monthly spending and budget panels.
- Moved appearance control to an accessible icon-only sun/moon header button.
  The sidebar footer now contains only storage/privacy status.
- Split remaining V1 work into independently scoped ledger clarity, category
  spending workspaces, and accounts/data-safety acceptance features.
- Replaced speculative cash-runway and safe-to-spend claims with recorded
  balances and budget remaining. Recurring spending is already included in
  expenses and is not deducted again.
- Budget limits remain recurring monthly templates shared across months;
  month-specific allocations are not introduced by this update.
- Existing Travel trip-wide budgets and splits are preserved; category views
  project personal shares rather than cloning trips or generating account payments.

### Planned (0.1.0)
- Tauri 2 + React + Vite + TypeScript application shell.
- In-memory expense entry, editing, deletion, and category-filtered display.
- Exact paise arithmetic and calendar-date validation.
- Windows desktop installer (`setup.exe`) verification.
