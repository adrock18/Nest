import React from "react";
import { Calendar, Plus } from "lucide-react";
import { NavTab } from "./Sidebar";

interface HeaderProps {
  activeTab: NavTab;
  onOpenAddTransaction: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onOpenAddTransaction 
}) => {
  const titles: Record<NavTab, string> = {
    dashboard: "Financial Command Center",
    transactions: "Transaction Workspace",
    budgets: "Monthly Category Budgets",
    travel: "Travel & Trip Workspace",
    settings: "Settings & Local Data Safety"
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-view-title">{titles[activeTab]}</h1>
      </div>

      <div className="header-right">
        {/* Month Selector Pill */}
        <div className="month-picker-pill">
          <Calendar size={14} color="var(--brand-indigo)" />
          <span>October 2026</span>
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
