import React from "react";
import { 
  LayoutDashboard, 
  ReceiptText, 
  Target, 
  Compass,
  Settings, 
  Wallet, UtensilsCrossed, Repeat, Car, House, Sparkles, ShoppingBag
} from "lucide-react";
import { isTauriDesktop } from "../services/api";
import { SPENDING_WORKSPACES, type WorkspaceId } from "../utils/workspaces";

export type NavTab = "dashboard" | "transactions" | "budgets" | "travel" | "settings" | WorkspaceId;

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onSelectTab
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
  const workspaceIcons = { food: UtensilsCrossed, subscriptions: Repeat, transport: Car, home: House, care: Sparkles, shopping: ShoppingBag };

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
          if (item.id === "settings") return null;
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
        <div className="nav-section-title">Spending workspaces</div>
        {SPENDING_WORKSPACES.map((workspace) => {
          const Icon = workspaceIcons[workspace.id];
          return <button key={workspace.id} id={`nav-tab-${workspace.id}`} className={`nav-button ${activeTab === workspace.id ? "active" : ""}`}
            aria-current={activeTab === workspace.id ? "page" : undefined} title={workspace.title} onClick={() => onSelectTab(workspace.id)}>
            <Icon size={16} className="nav-icon" /><span className="nav-label">{workspace.title}</span>
          </button>;
        })}
      </nav>

      {/* Local-first status */}
      <div className="sidebar-footer">
        <button id="nav-tab-settings" className={`nav-button ${activeTab === "settings" ? "active" : ""}`}
          aria-current={activeTab === "settings" ? "page" : undefined} title="Settings & backups" onClick={() => onSelectTab("settings")}>
          <Settings size={16} /><span className="nav-label">Settings & backups</span>
        </button>
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
