# Changelog: Nest

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Expressive dark/light V1 dashboard with a monthly cash-flow hero, spending
  distribution ring, budget check-ins, and individual account cards.
- Account-name transaction search, date/amount sorting, useful empty states, and
  a separate budget form for existing expense categories.
- Keyboard-focus containment in transaction/account dialogs, visible focus
  indicators, reduced-motion support, and layouts for the default and minimum
  Windows window sizes.
- Regression coverage for actual finance helpers, browser persistence failures,
  invalid dates, account references, credit balances, and backup verification.

### Fixed
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
- Replaced speculative cash-runway and safe-to-spend claims with recorded
  balances and budget remaining. Recurring spending is already included in
  expenses and is not deducted again.
- Budget limits remain recurring monthly templates shared across months;
  month-specific allocations are not introduced by this update.
- Existing Travel functionality is preserved, not expanded.

### Planned (0.1.0)
- Tauri 2 + React + Vite + TypeScript application shell.
- In-memory expense entry, editing, deletion, and category-filtered display.
- Exact paise arithmetic and calendar-date validation.
- Windows desktop installer (`setup.exe`) verification.
