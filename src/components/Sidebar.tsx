import React from "react";
import { 
  LayoutDashboard, 
  ReceiptText, 
  Target, 
  Compass,
  Settings, 
  Wallet,
  Sun,
  Moon
} from "lucide-react";
import { isTauriDesktop } from "../services/api";

export type NavTab = "dashboard" | "transactions" | "budgets" | "travel" | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onSelectTab,
  theme,
  onToggleTheme
}) => {
  const navItems = [
    {
      id: "dashboard" as NavTab,
      label: "Dashboard",
      icon: LayoutDashboard,
      elementId: "nav-tab-dashboard"
    },
    {
      id: "transactions" as NavTab,
      label: "Transactions",
      icon: ReceiptText,
      elementId: "nav-tab-transactions"
    },
    {
      id: "budgets" as NavTab,
      label: "Budgets",
      icon: Target,
      elementId: "nav-tab-budgets"
    },
    {
      id: "travel" as NavTab,
      label: "Travel Expenses",
      icon: Compass,
      elementId: "nav-tab-travel"
    },
    {
      id: "settings" as NavTab,
      label: "Settings",
      icon: Settings,
      elementId: "nav-tab-settings"
    }
  ];

  return (
    <aside className="app-sidebar" aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <Wallet size={20} strokeWidth={2.4} />
        </div>
        <div className="brand-text-col">
          <div className="brand-title">
            Nest <span className="brand-badge">V1</span>
          </div>
          <div className="brand-subtitle">Personal Finance</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Workspace</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const shortcutKey = item.id === "dashboard" ? "D" : item.id === "transactions" ? "T" : item.id === "budgets" ? "B" : item.id === "travel" ? "R" : "S";
          return (
            <button
              key={item.id}
              id={item.elementId}
              className={`nav-button ${isActive ? "active" : ""}`}
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
            >
              <Icon size={16} className="nav-icon" />
              <span className="nav-label" style={{ flex: 1 }}>{item.label}</span>
              <span className="kbd-chip">{shortcutKey}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer: Theme Toggle & Local-First Indicator */}
      <div className="sidebar-footer">
        {/* Theme Switcher Toggle */}
        <div className="theme-toggle-container">
          <span className="theme-toggle-label">Appearance</span>
          <button 
            id="btn-toggle-theme-sidebar"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
          >
            {theme === "dark" ? (
              <>
                <Sun size={13} color="var(--warning-amber)" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={13} color="var(--accent-cyan)" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>

        {/* Local-First Indicator */}
        <div className="status-badge" title={isTauriDesktop() ? "Data is stored in your local SQLite database" : "Browser preview uses localStorage, not the desktop database"}>
          <div className="status-indicator-dot" />
          <div className="status-text">
            <span>{isTauriDesktop() ? "Offline & Private" : "Browser Preview"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
