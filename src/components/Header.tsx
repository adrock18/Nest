import React from "react";
import { Calendar, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { NavTab } from "./Sidebar";

interface HeaderProps {
  activeTab: NavTab;
  onOpenAddTransaction: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  selectedMonth: string; // "YYYY-MM"
  onChangeMonth: (month: string) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatMonthLabel(ym: string): string {
  const [yearStr, monthStr] = ym.split("-");
  const monthIdx = parseInt(monthStr, 10) - 1;
  return `${MONTH_NAMES[monthIdx] ?? monthStr} ${yearStr}`;
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const ny = d.getFullYear();
  const nm = d.getMonth() + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenAddTransaction,
  selectedMonth,
  onChangeMonth
}) => {
  const titles: Record<NavTab, string> = {
    dashboard: "Financial Command Center",
    transactions: "Transaction Workspace",
    budgets: "Monthly Category Budgets",
    travel: "Travel & Trip Workspace",
    settings: "Settings & Local Data Safety"
  };

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = selectedMonth === currentYM;

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-view-title">{titles[activeTab]}</h1>
      </div>

      <div className="header-right">
        {/* Month Selector */}
        <div className="month-picker-pill" style={{ display: "flex", alignItems: "center", gap: "4px", userSelect: "none" }}>
          <button
            onClick={() => onChangeMonth(shiftMonth(selectedMonth, -1))}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              borderRadius: "4px"
            }}
            title="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <Calendar size={14} color="var(--brand-indigo)" />
          <span style={{ minWidth: "130px", textAlign: "center" }}>{formatMonthLabel(selectedMonth)}</span>
          <button
            onClick={() => { if (!isCurrentMonth) onChangeMonth(shiftMonth(selectedMonth, 1)); }}
            style={{
              background: "transparent",
              border: "none",
              color: isCurrentMonth ? "var(--border-subtle)" : "var(--text-muted)",
              cursor: isCurrentMonth ? "default" : "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              borderRadius: "4px"
            }}
            title={isCurrentMonth ? "Current month" : "Next month"}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Quick Add Button */}
        <button
          id="btn-quick-add"
          className="btn-primary"
          onClick={onOpenAddTransaction}
        >
          <Plus size={15} strokeWidth={2.4} />
          <span>Add Transaction</span>
          <span className="kbd-chip" style={{ color: "#ffffff", background: "rgba(255,255,255,0.2)" }}>N</span>
        </button>
      </div>
    </header>
  );
};
