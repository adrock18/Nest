import React, { useState } from "react";
import { Database, ShieldCheck, Download, HardDrive, CheckCircle2, Copy, FileSpreadsheet, Plus, Trash2, Pencil, Landmark, CreditCard, Banknote, Save } from "lucide-react";
import { Transaction, Account, CategoryBudget, Category, Trip, TripExpense } from "../types";
import { buildAnalysisSheet, exportTransactionsToCsv } from "../utils/export";
import { formatPaiseToRupees } from "../utils/money";
import { api, isTauriDesktop } from "../services/api";

interface SettingsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  budgets?: CategoryBudget[];
  categories: Category[];
  trips: Trip[];
  tripExpenses: TripExpense[];
  databasePath?: string;
  onAddAccount: () => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
}

const ACCOUNT_ICONS: Record<string, React.ReactNode> = {
  bank: <Landmark size={16} />,
  credit: <CreditCard size={16} />,
  cash: <Banknote size={16} />,
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  transactions,
  accounts,
  budgets = [],
  categories,
  trips,
  tripExpenses,
  databasePath = "%LOCALAPPDATA%\\Nest\\nest.db",
  onAddAccount,
  onEditAccount,
  onDeleteAccount
}) => {
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState("");
  const [isBackingUp, setIsBackingUp] = useState(false);

  const safeAccounts = accounts || [];
  const safeTransactions = transactions || [];
  const safeBudgets = budgets || [];

  const accountMap = React.useMemo(() => {
    return safeAccounts.reduce((acc, a) => {
      acc[a.id] = a.name;
      return acc;
    }, {} as Record<string, string>);
  }, [safeAccounts]);

  // 1-Click Copy for Google Sheets
  const handleCopyForGoogleSheets = async () => {
    setBackupError("");
    const sheetContent = buildAnalysisSheet({
      accounts: safeAccounts,
      transactions: safeTransactions,
      budgets: safeBudgets
    }, "\t");

    try {
      await navigator.clipboard.writeText(sheetContent);
      setBackupMessage("Copied to clipboard! Open Google Sheets and press Ctrl+V to paste your complete revenue, spending & ledger analysis.");
    } catch (error) {
      setBackupMessage("");
      setBackupError(`Clipboard copy failed. Use the CSV export instead: ${String(error)}`);
    }
    setTimeout(() => setBackupMessage(""), 6000);
  };

  // Analysis CSV Export
  const handleExportAnalysisCSV = () => {
    setBackupError("");
    const csvContent = buildAnalysisSheet({
      accounts: safeAccounts,
      transactions: safeTransactions,
      budgets: safeBudgets
    }, ",");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nest_analysis_workbook_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupMessage("Comprehensive Revenue & Spending analysis exported for Excel / Google Sheets!");
    setTimeout(() => setBackupMessage(""), 5000);
  };

  // Raw CSV
  const handleExportRawCSV = () => {
    setBackupError("");
    const csvContent = exportTransactionsToCsv(safeTransactions, accountMap);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nest_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupMessage("Raw itemized ledger exported successfully!");
    setTimeout(() => setBackupMessage(""), 4000);
  };

  // JSON Snapshot
  const handleDownloadBackup = () => {
    setBackupError("");
    const backupData = {
      schemaVersion: "1.1.0",
      timestamp: new Date().toISOString(),
      metadata: {
        totalAccounts: safeAccounts.length,
        totalTransactions: safeTransactions.length,
        totalBudgets: safeBudgets.length
      },
      accounts: safeAccounts,
      budgets: safeBudgets,
      transactions: safeTransactions,
      categories,
      trips,
      tripExpenses
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nest_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupMessage("JSON snapshot backup with Accounts, Budgets & Tags exported!");
    setTimeout(() => setBackupMessage(""), 4000);
  };

  // VACUUM Backup
  const handleVacuumBackup = async () => {
    if (isBackingUp) return;
    setBackupMessage("");
    setBackupError("");
    setIsBackingUp(true);
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T").join("_");
      // Use the same directory as the database
      const dbDir = databasePath.replace(/[/\\][^/\\]+$/, "");
      const targetPath = `${dbDir}\\nest_backup_${timestamp}.db`;
      await api.backupDatabase(targetPath);
      setBackupMessage(`SQLite VACUUM backup created: ${targetPath}`);
    } catch (err) {
      setBackupError(`Backup failed: ${err}`);
    } finally {
      setIsBackingUp(false);
    }
    setTimeout(() => setBackupMessage(""), 8000);
  };

  return (
    <div className="view-content-wrapper" style={{ maxWidth: "840px" }}>
      <div className="view-heading"><div><div className="eyebrow">YOUR DATA, YOUR DEVICE</div><h2>Settings & backups</h2>
        <p>Manage accounts and export your complete history, across all months.</p></div></div>
      {backupError && <div className="form-error" role="alert">{backupError}</div>}
      {backupMessage && (
        <div role="status" style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 16px",
          background: "var(--income-bg)",
          border: "1px solid var(--income-border)",
          borderRadius: "var(--radius-md)",
          color: "var(--income-emerald)",
          fontSize: "13px",
          marginBottom: "20px"
        }}>
          <CheckCircle2 size={16} />
          <span>{backupMessage}</span>
        </div>
      )}

      {/* Account Management */}
      <div className="panel-card" style={{ marginBottom: "20px" }}>
        <div className="panel-header">
          <div className="panel-title">
            <Landmark size={18} color="var(--brand-indigo)" />
            <span>Accounts & Wallets</span>
          </div>
          <button className="btn-primary" onClick={onAddAccount} style={{ fontSize: "12px", padding: "6px 12px" }}>
            <Plus size={14} />
            <span>Add Account</span>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {safeAccounts.map((acc) => (
            <div
              key={acc.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "var(--bg-card-subtle)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ color: "var(--accent-cyan)" }}>
                  {ACCOUNT_ICONS[acc.type] || <Landmark size={16} />}
                </div>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-main)" }}>{acc.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>{acc.type} Account</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ textAlign: "right" }}>
                  <div className="font-mono" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>
                    {formatPaiseToRupees(acc.startingBalancePaise)}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Starting Balance</div>
                </div>
                <button onClick={() => onEditAccount(acc)} style={{ background: "transparent", border: "none", color: "var(--accent-cyan)", cursor: "pointer", padding: "4px" }} title="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onDeleteAccount(acc.id)} style={{ background: "transparent", border: "none", color: "var(--expense-rose)", cursor: "pointer", padding: "4px" }} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {safeAccounts.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No accounts yet. Add your first bank account, credit card, or cash wallet.
            </div>
          )}
        </div>
      </div>

      {/* Google Sheets & Excel Export Hub */}
      <div className="panel-card" style={{ marginBottom: "20px" }}>
        <div className="panel-header">
          <div className="panel-title">
            <FileSpreadsheet size={18} color="var(--income-emerald)" />
            <span>Google Sheets & Excel Financial Analysis</span>
          </div>
          <span className="badge-tag badge-income">
            <ShieldCheck size={12} /> Spreadsheet Ready
          </span>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: "1.6" }}>
          Export your complete financial history into a structured workbook containing <strong>Executive Revenue & Spending Overview</strong>, <strong>Category Budget Utilization</strong>, <strong>Account Reconciliation</strong>, and the <strong>Itemized Transaction Ledger</strong>.
        </p>

        <div style={{
          background: "var(--bg-app)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
          marginBottom: "16px",
          fontSize: "12px",
          color: "var(--text-muted)"
        }}>
          💡 <strong>Tip for Google Sheets:</strong> Click <em>&quot;Copy for Google Sheets&quot;</em>, open any new spreadsheet (<code style={{ color: "var(--accent-cyan)" }}>sheets.new</code>), and press <kbd style={{ padding: "2px 5px", background: "var(--bg-surface)", border: "1px solid var(--border-medium)", borderRadius: "4px" }}>Ctrl+V</kbd>. All tables and numbers will format into columns instantly!
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <button className="btn-primary" id="btn-copy-sheets" onClick={handleCopyForGoogleSheets} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Copy size={15} />
            <span>Copy for Google Sheets (Instant Paste)</span>
          </button>
          <button className="btn-secondary" id="btn-export-analysis-csv" onClick={handleExportAnalysisCSV} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Download size={15} />
            <span>Export Analysis Workbook (.csv)</span>
          </button>
        </div>
      </div>

      {/* Raw Ledger & Database Snapshots */}
      <div className="panel-card" style={{ marginBottom: "20px" }}>
        <div className="panel-header">
          <div className="panel-title">
            <Database size={18} color="var(--accent-cyan)" />
            <span>Data Portability & Database Snapshots</span>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Export raw transaction data, generate portable JSON snapshots, or create atomic SQLite backups using the native VACUUM engine.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <button className="btn-secondary" id="btn-export-raw-csv" onClick={handleExportRawCSV}>
            <Download size={15} />
            <span>Export Raw Ledger (.csv)</span>
          </button>
          <button className="btn-secondary" id="btn-backup-now" onClick={handleDownloadBackup}>
            <Download size={15} />
            <span>Export Portable Snapshot (.json)</span>
          </button>
          <button className="btn-primary" id="btn-vacuum-backup" onClick={handleVacuumBackup} disabled={isBackingUp || !isTauriDesktop()}
            title={isTauriDesktop() ? "Create a verified SQLite backup" : "Available in the desktop app only"} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Save size={15} />
            <span>{isBackingUp ? "Creating backup..." : "SQLite VACUUM Backup (.db)"}</span>
          </button>
        </div>
      </div>

      {/* Local-First Architecture */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <HardDrive size={18} color="var(--income-emerald)" />
            <span>Local Database & Storage</span>
          </div>
          <span className="badge-tag badge-income">
            <ShieldCheck size={12} /> {isTauriDesktop() ? "Local & Offline" : "Browser preview"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <p>
            {isTauriDesktop() ? "Nest operates offline. Transactions, accounts, and budgets are stored in your local SQLite database without cloud servers."
              : "This browser preview stores data in localStorage, separately from the desktop app. Export a JSON snapshot before clearing browser data. SQLite backups require the desktop app."}
          </p>
          <div style={{
            padding: "10px 14px",
            background: "var(--bg-app)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-main)",
            border: "1px solid var(--border-subtle)",
            wordBreak: "break-all"
          }}>
            {databasePath}
          </div>
        </div>
      </div>
    </div>
  );
};
