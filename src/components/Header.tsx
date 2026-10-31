import React from "react";
import { Calendar, Plus, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import { NavTab } from "./Sidebar";
import { formatMonthLabel } from "../utils/dates";

interface HeaderProps {
  activeTab: NavTab;
  onOpenAddTransaction: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  selectedMonth: string; // "YYYY-MM"
  onChangeMonth: (month: string) => void;
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
  theme,
  onToggleTheme,
  selectedMonth,
  onChangeMonth
}) => {
  const titles: Record<NavTab, string> = {
    dashboard: "Overview",
    transactions: "Transactions",
    budgets: "Budgets",
    travel: "Travel",
    settings: "Settings & backups",
    food: "Food & Dining", subscriptions: "Subscriptions", transport: "Transport & Fuel",
    home: "Home & Utilities", care: "Personal Care & Wellness", shopping: "Shopping"
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
        <button
          id="btn-toggle-theme-header"
          className="header-theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
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
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <Calendar size={14} color="var(--brand-nordic)" />
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
            aria-label="Next month"
            disabled={isCurrentMonth}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        {!isCurrentMonth && <button className="text-button month-today" onClick={() => onChangeMonth(currentYM)}>This month</button>}

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
