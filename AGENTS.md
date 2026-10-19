# Instructions for AI Coding Tools (Nest)

Read by Kiro, Codex, Copilot, Claude Code (via `CLAUDE.md`), and DeepMind Antigravity.

## Project Scope & Identity
- **Nest** is an installable, local-first personal finance application.
- Architecture: **Tauri 2 (Rust) + React (TypeScript, Vite) + local SQLite (`rusqlite`)**.
- Delivery target: Windows desktop first (portable to Linux/macOS). Plus an optional read-only loopback browser dashboard.
- Zero paid cloud services. User financial data stays local on the machine in OS-resolved app data paths.
- Only the **active milestone** is implemented. Next release: **0.1.0** (installed in-memory expense screen with sample data).

## Engineering Standards
1. **Explain the Code**: The user is learning desktop application engineering. Write clean, idiomatic code, name concepts clearly, and explain the "why".
2. **Strict Financial Invariants**:
   - Store money as whole **paise** (`₹12.50` -> `1250`). Never use floating-point numbers for money calculations.
   - Transaction amounts are always positive integers. Income vs. expense is a distinct enum/type.
   - Strict calendar dates formatted as `YYYY-MM-DD` (validate leap years; do not distort via UTC conversions).
3. **Database & Persistence**:
   - Parameterized queries only.
   - Schema versioning via numbered SQL migrations.
   - Atomic database transactions.
   - Consistent snapshot backups via SQLite backup API or `VACUUM INTO`.
4. **Browser Dashboard Security**:
   - Loopback only (`127.0.0.1` / `::1`). Never bind wildcard or 0.0.0.0.
   - Expose read-only summary routes; never expose mutations, file system operations, or native Tauri commands to HTTP.
   - Strict `Host` and `Origin` verification; `Cache-Control: no-store` on private data.
5. **Git & Workflow**:
   - Small, focused feature/fix branches (`feature/<name>`, `fix/<name>`). Never commit application code directly to `main`.
   - Before pushing code, run the understanding check (`skills/understanding-check/SKILL.md`).
   - Ask before adding dependencies; pin exact versions and commit lockfiles.
   - Always ask before committing or pushing. Stage specific files, never `git add .`.
