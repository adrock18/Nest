# Instructions for AI Coding Tools (Nest)

Read by Kiro, Codex, Copilot, Claude Code (via `CLAUDE.md`), and DeepMind Antigravity.

## Project Scope & Identity
- **Nest** is an installable, local-first personal finance application for personal use.
- Architecture: **Tauri 2 (Rust) + React (TypeScript, Vite) + local SQLite (`rusqlite`)**.
- Target: Windows desktop first, operating 100% offline.
- Zero paid cloud services. Financial data stays on the local device in the OS app data directory.
- Build iteratively toward **Version 1.0**.

## Engineering Standards
1. **Clean, Readable Code**: Write idiomatic TypeScript and Rust. Keep components focused and state management simple.
2. **Financial Precision**:
   - Store money as whole **paise** (`₹12.50` -> `1250`). Never use floating-point numbers for money calculations.
   - Transaction amounts are always positive integers. Income vs. expense is a distinct enum/type.
   - Strict calendar dates formatted as `YYYY-MM-DD` (validate leap years; avoid timezone skew).
3. **Database & Persistence**:
   - Parameterized queries only.
   - Schema versioning via numbered SQL migrations.
   - Atomic database transactions.
   - One-click backups via SQLite backup API or `VACUUM INTO`.
4. **Git & Workflow**:
   - Commit changes cleanly with descriptive messages.
   - Ask before adding new external dependencies.
