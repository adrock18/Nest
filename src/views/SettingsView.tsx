import React, { useState } from "react";
import { Database, ShieldCheck, Download, HardDrive, CheckCircle2, Copy, FileSpreadsheet } from "lucide-react";
import { Transaction, Account, CategoryBudget } from "../types";
import { buildAnalysisSheet } from "../utils/export";

interface SettingsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  budgets?: CategoryBudget[];
  databasePath?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  transactions, 
  accounts,
  budgets = [],
  databasePath = "%LOCALAPPDATA%\\Nest\\nest.db"
}) => {
  const [backupMessage, setBackupMessage] = useState("");

  const safeAccounts = accounts || [];
  const safeTransactions = transactions || [];
  const safeBudgets = budgets || [];

  const accountMap = React.useMemo(() => {
    return safeAccounts.reduce((acc, a) => {
      acc[a.id] = a.name;
      return acc;
    }, {} as Record<string, string>);
  }, [safeAccounts]);

  // 1-Click Copy for Google Sheets (Tab-Separated Multi-Table Dashboard)
  const handleCopyForGoogleSheets = async () => {
    const sheetContent = buildAnalysisSheet({
      accounts: safeAccounts,
      transactions: safeTransactions,
      budgets: safeBudgets
    }, "\t");

    try {
      await navigator.clipboard.writeText(sheetContent);
      setBackupMessage("Copied to clipboard! Open Google Sheets and press Ctrl+V to paste your complete revenue, spending & ledger analysis.");
    } catch {
      // Fallback for environments where navigator.clipboard is unavailable
      const textArea = document.createElement("textarea");
      textArea.value = sheetContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setBackupMessage("Copied to clipboard! Open Google Sheets and press Ctrl+V to paste.");
    }
    setTimeout(() => setBackupMessage(""), 6000);
  };

  // Comprehensive Multi-Section Analysis CSV Export (for Excel & Google Sheets Import)
  const handleExportAnalysisCSV = () => {
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
    setBackupMessage("Comprehensive Revenue & Spending analysis exported for Excel / Google Sheets!");
    setTimeout(() => setBackupMessage(""), 5000);
  };

  // Raw Itemized Ledger CSV
  const handleExportRawCSV = () => {
    const headers = [
      "ID", 
      "Date", 
      "Flow Type", 
      "Account", 
      "Category", 
      "Tags", 
      "Recurring", 
      "Notes / Merchant", 
      "Amount (INR)", 
      "Amount (Paise)"
    ];

    const rows = safeTransactions.map((t) => [
      t.id,
      t.date,
      t.type,
      `"${accountMap[t.accountId] || "Primary Account"}"`,
      `"${t.category || ""}"`,
      `"${(t.tags || []).join(" ")}"`,
      t.isRecurring ? "YES" : "NO",
      `"${(t.notes || "").replace(/"/g, '""')}"`,
      ((t.amountPaise || 0) / 100).toFixed(2),
      (t.amountPaise || 0).toString()
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nest_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setBackupMessage("Raw itemized ledger exported successfully!");
    setTimeout(() => setBackupMessage(""), 4000);
  };

  const handleDownloadBackup = () => {
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
      transactions: safeTransactions
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nest_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setBackupMessage("JSON snapshot backup with Accounts, Budgets & Tags exported!");
    setTimeout(() => setBackupMessage(""), 4000);
  };

  return (
    <div className="view-content-wrapper" style={{ maxWidth: "840px" }}>
      {backupMessage && (
        <div style={{
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
          💡 <strong>Tip for Google Sheets:</strong> Click <em>"Copy for Google Sheets"</em>, open any new spreadsheet (<code style={{ color: "var(--accent-cyan)" }}>sheets.new</code>), and press <kbd style={{ padding: "2px 5px", background: "var(--bg-surface)", border: "1px solid var(--border-medium)", borderRadius: "4px" }}>Ctrl+V</kbd>. All tables and numbers will format into columns instantly!
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <button 
            className="btn-primary" 
            id="btn-copy-sheets" 
            onClick={handleCopyForGoogleSheets}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Copy size={15} />
            <span>Copy for Google Sheets (Instant Paste)</span>
          </button>

          <button 
            className="btn-secondary" 
            id="btn-export-analysis-csv" 
            onClick={handleExportAnalysisCSV}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Download size={15} />
            <span>Export Analysis Workbook (.csv)</span>
          </button>
        </div>
      </div>

      {/* Raw Ledger & Disaster Recovery Snapshots */}
      <div className="panel-card" style={{ marginBottom: "20px" }}>
        <div className="panel-header">
          <div className="panel-title">
            <Database size={18} color="var(--accent-cyan)" />
            <span>Data Portability & Database Snapshots</span>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Export raw single-table transaction data or generate an unencrypted portable JSON snapshot of your entire workspace.
        </p>

        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn-secondary" id="btn-export-raw-csv" onClick={handleExportRawCSV}>
            <Download size={15} />
            <span>Export Raw Ledger (.csv)</span>
          </button>

          <button className="btn-secondary" id="btn-backup-now" onClick={handleDownloadBackup}>
            <Download size={15} />
            <span>Export Portable Snapshot (.json)</span>
          </button>
        </div>
      </div>

      {/* Local-First Architecture Guarantee */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <HardDrive size={18} color="var(--income-emerald)" />
            <span>Local Database & Storage</span>
          </div>
          <span className="badge-tag badge-income">
            <ShieldCheck size={12} /> Air-Gapped (100% Offline)
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <p>
            Nest operates 100% offline. All financial transactions, accounts, and category budgets are persisted in your local SQLite database without third-party cloud servers.
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

