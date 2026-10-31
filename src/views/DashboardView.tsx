import React, { useState } from "react";
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  PiggyBank, 
  Percent, 
  Wallet, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { MonthlyFinancialSummary, CategoryBudget, Account } from "../types";
import { formatPaiseToRupees } from "../utils/money";

interface DashboardViewProps {
  summary: MonthlyFinancialSummary;
  categoryBreakdown: { name: string; spentPaise: number; pct: number; color: string }[];
  budgets: CategoryBudget[];
  accounts: Account[];
  accountBalances: Record<string, number>;
  onNavigateToTransactions: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  categoryBreakdown,
  budgets,
  accounts,
  accountBalances,
  onNavigateToTransactions
}) => {
  const [showSafeSpendExplainer, setShowSafeSpendExplainer] = useState(false);

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const currentDateStr = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  const safeAccounts = accounts || [];
  const safeBudgets = budgets || [];
  const safeCategoryBreakdown = categoryBreakdown || [];
  const safeBalances = accountBalances || {};

  // Derive Liquid Cash Position (Bank + Cash) & Credit Card Liabilities
  let liquidCashPaise = 0;
  let creditDebtPaise = 0;

  for (const acc of safeAccounts) {
    const bal = safeBalances[acc.id] ?? acc.startingBalancePaise;
    if (acc.type === "credit") {
      creditDebtPaise += Math.abs(bal);
    } else {
      liquidCashPaise += Math.max(0, bal);
    }
  }

  const netCashPositionPaise = liquidCashPaise - creditDebtPaise;

  // Remaining Category Budget Commitments
  const spentMap = safeCategoryBreakdown.reduce((acc, c) => {
    acc[c.name] = c.spentPaise;
    return acc;
  }, {} as Record<string, number>);

  let remainingBudgetsPaise = 0;
  let overBudgetCount = 0;
  let totalTrackedBudgets = safeBudgets.length;
  let adheringBudgets = 0;

  for (const b of safeBudgets) {
    const spent = spentMap[b.category] || 0;
    if (spent > b.limitPaise) {
      overBudgetCount++;
    } else {
      adheringBudgets++;
      remainingBudgetsPaise += (b.limitPaise - spent);
    }
  }

  // Safe-to-Spend Calculation:
  // Liquid Cash - Recurring Fixed Bills - Remaining Category Allocations
  const safeToSpendPaise = Math.max(
    0,
    liquidCashPaise - summary.recurringCommitmentPaise - remainingBudgetsPaise
  );

  // Cash Runway in Months (Liquid Cash / Outflow)
  const cashRunway = summary.totalOutflowPaise > 0
    ? (liquidCashPaise / summary.totalOutflowPaise).toFixed(1)
    : "12+";

  // Budget Adherence Percentage
  const budgetAdherencePct = totalTrackedBudgets > 0
    ? Math.round((adheringBudgets / totalTrackedBudgets) * 100)
    : 100;

  // Financial Pulse Status Evaluation
  let pulseStatus: "healthy" | "attention" | "action" = "healthy";
  let pulseLabel = "Healthy";
  const runwayNum = parseFloat(cashRunway);
  if (overBudgetCount > 0 || summary.netSavingsPaise < 0) {
    pulseStatus = "action";
    pulseLabel = "Action Needed";
  } else if ((!isNaN(runwayNum) && runwayNum < 2) || budgetAdherencePct < 85) {
    pulseStatus = "attention";
    pulseLabel = "Attention";
  }

  return (
    <div className="view-content-wrapper">
      {/* 1. Contextual Header: Observe financial state in 5-10 seconds */}
      <div className="command-header-row">
        <div>
          <h1 className="greeting-title">{greeting}.</h1>
          <div className="greeting-subtitle">
            <span>{currentDateStr}</span>
            <span>•</span>
            <span style={{ color: "var(--income-emerald)" }}>Household Ledger Verified</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button 
            className="btn-secondary" 
            onClick={onNavigateToTransactions}
            style={{ fontSize: "12px" }}
          >
            Ledger View
            <span className="kbd-chip">T</span>
          </button>
        </div>
      </div>

      {/* 2. Financial Pulse Bar: Clear, high-density health metrics */}
      <div className="financial-pulse-bar" id="financial-pulse-strip">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Financial Pulse:
          </span>
          <span className={`pulse-status-badge ${pulseStatus}`}>
            <span 
              className="status-indicator-dot" 
              style={{ 
                background: pulseStatus === "healthy" ? "var(--income-emerald)" : pulseStatus === "attention" ? "var(--warning-amber)" : "var(--expense-rose)",
                boxShadow: `0 0 6px ${pulseStatus === "healthy" ? "var(--income-emerald)" : pulseStatus === "attention" ? "var(--warning-amber)" : "var(--expense-rose)"}`
              }} 
            />
            {pulseLabel}
          </span>
        </div>

        <div className="pulse-metrics-strip">
          <div className="pulse-metric-item">
            <span className="pulse-metric-label">Cash Runway:</span>
            <span className="pulse-metric-val">{cashRunway} months</span>
          </div>
          <div className="pulse-metric-item">
            <span className="pulse-metric-label">Savings Rate:</span>
            <span className="pulse-metric-val font-mono">{summary.savingsRatePercentage.toFixed(0)}%</span>
          </div>
          <div className="pulse-metric-item">
            <span className="pulse-metric-label">Budget Adherence:</span>
            <span className="pulse-metric-val font-mono">{budgetAdherencePct}%</span>
          </div>
          <div className="pulse-metric-item">
            <span className="pulse-metric-label">Fixed Commitments:</span>
            <span className="pulse-metric-val font-mono">{formatPaiseToRupees(summary.recurringCommitmentPaise)}</span>
          </div>
        </div>
      </div>

      {/* 3. "Needs Attention" Triage Section */}
      {overBudgetCount > 0 ? (
        <div className="needs-attention-box" style={{ borderColor: "var(--expense-border)" }}>
          <div className="needs-attention-icon" style={{ background: "var(--expense-bg)", color: "var(--expense-rose)" }}>
            <AlertTriangle size={17} />
          </div>
          <div className="needs-attention-content">
            <div className="needs-attention-title">
              {overBudgetCount} {overBudgetCount === 1 ? "category exceeds" : "categories exceed"} allocated monthly spending cap
            </div>
            <div className="needs-attention-desc">
              Review recent transactions in Budgets to reconcile overspending before end of month.
            </div>
          </div>
          <button 
            className="btn-secondary" 
            style={{ fontSize: "11.5px", padding: "5px 10px" }}
            onClick={onNavigateToTransactions}
          >
            Review Transactions
          </button>
        </div>
      ) : (
        <div className="needs-attention-box">
          <div className="needs-attention-icon" style={{ background: "var(--income-bg)", color: "var(--income-emerald)" }}>
            <CheckCircle2 size={17} />
          </div>
          <div className="needs-attention-content">
            <div className="needs-attention-title">All financial parameters within nominal targets</div>
            <div className="needs-attention-desc">
              Zero category overruns. Liquid cash reserves fully support upcoming recurring commitments.
            </div>
          </div>
        </div>
      )}

      {/* 4. Hero Section: Total Amount vs Safe-to-Spend */}
      <div className="hero-finance-grid">
        {/* Total Tracked Amount */}
        <div className="hero-finance-card" id="card-net-worth">
          <div className="hero-card-tag">Total Amount / Balance</div>
          <div 
            className="hero-card-amount font-mono" 
            style={{ color: netCashPositionPaise >= 0 ? "var(--text-main)" : "var(--expense-rose)" }}
          >
            {formatPaiseToRupees(netCashPositionPaise)}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "14px" }}>
            Cumulative capital across all tracked inflows and spending
          </div>
          <div className="hero-card-footer">
            <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Total Inflows: </span>
                <span className="font-mono" style={{ fontWeight: 600, color: "var(--income-emerald)" }}>
                  +{formatPaiseToRupees(summary.totalInflowPaise)}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Total Spending: </span>
                <span className="font-mono" style={{ fontWeight: 600, color: "var(--expense-rose)" }}>
                  −{formatPaiseToRupees(summary.totalOutflowPaise)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Safe to Spend */}
        <div className="hero-finance-card" id="card-safe-to-spend">
          <div className="hero-card-tag" style={{ color: "var(--income-emerald)" }}>Safe-to-Spend Margin</div>
          <div className="hero-card-amount font-mono" style={{ color: "var(--income-emerald)" }}>
            {formatPaiseToRupees(safeToSpendPaise)}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "14px" }}>
            Unencumbered capital available for discretionary spending this month
          </div>
          <div className="hero-card-footer">
            <button 
              className="safe-spend-explainer-toggle"
              onClick={() => setShowSafeSpendExplainer(!showSafeSpendExplainer)}
            >
              <Info size={14} />
              <span>{showSafeSpendExplainer ? "Hide calculation math" : "Why this number?"}</span>
              {showSafeSpendExplainer ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {showSafeSpendExplainer && (
            <div className="safe-spend-breakdown-drawer">
              <div className="math-row">
                <span>Available Tracked Amount</span>
                <span className="font-mono">{formatPaiseToRupees(liquidCashPaise)}</span>
              </div>
              <div className="math-row" style={{ color: "var(--expense-rose)" }}>
                <span>− Fixed Recurring Bills</span>
                <span className="font-mono">− {formatPaiseToRupees(summary.recurringCommitmentPaise)}</span>
              </div>
              <div className="math-row" style={{ color: "var(--expense-rose)" }}>
                <span>− Remaining Budget Allocations</span>
                <span className="font-mono">− {formatPaiseToRupees(remainingBudgetsPaise)}</span>
              </div>
              <div className="math-row result">
                <span>= Safe to Spend</span>
                <span className="font-mono" style={{ color: "var(--income-emerald)" }}>
                  {formatPaiseToRupees(safeToSpendPaise)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. 4 Core Monthly Flow Cards */}
      <div className="dashboard-grid">
        {/* Total Inflow */}
        <div className="metric-card" id="card-inflow">
          <div className="metric-header">
            <span className="metric-label">Monthly Inflow</span>
            <div className="metric-icon-bubble" style={{ background: "var(--income-bg)", color: "var(--income-emerald)" }}>
              <ArrowDownRight size={17} />
            </div>
          </div>
          <div className="metric-value income font-mono" id="val-total-inflow">
            {formatPaiseToRupees(summary.totalInflowPaise)}
          </div>
          <div className="metric-subtext">Verified payroll & deposits</div>
        </div>

        {/* Total Spending */}
        <div className="metric-card" id="card-outflow">
          <div className="metric-header">
            <span className="metric-label">Monthly Spending</span>
            <div className="metric-icon-bubble" style={{ background: "var(--expense-bg)", color: "var(--expense-rose)" }}>
              <ArrowUpRight size={17} />
            </div>
          </div>
          <div className="metric-value expense font-mono" id="val-total-outflow">
            {formatPaiseToRupees(summary.totalOutflowPaise)}
          </div>
          <div className="metric-subtext">
            {formatPaiseToRupees(summary.recurringCommitmentPaise)} in recurring bills
          </div>
        </div>

        {/* Net Savings */}
        <div className="metric-card" id="card-net-savings">
          <div className="metric-header">
            <span className="metric-label">Net Retained</span>
            <div className="metric-icon-bubble" style={{ 
              background: summary.netSavingsPaise >= 0 ? "var(--income-bg)" : "var(--expense-bg)", 
              color: summary.netSavingsPaise >= 0 ? "var(--income-emerald)" : "var(--expense-rose)" 
            }}>
              <PiggyBank size={17} />
            </div>
          </div>
          <div 
            className="metric-value font-mono" 
            id="val-net-savings"
            style={{ color: summary.netSavingsPaise >= 0 ? "var(--income-emerald)" : "var(--expense-rose)" }}
          >
            {formatPaiseToRupees(summary.netSavingsPaise)}
          </div>
          <div className="metric-subtext">Retained cash flow</div>
        </div>

        {/* Savings Rate */}
        <div className="metric-card" id="card-savings-rate">
          <div className="metric-header">
            <span className="metric-label">Savings Rate</span>
            <div className="metric-icon-bubble" style={{ background: "var(--warning-bg)", color: "var(--warning-amber)" }}>
              <Percent size={15} />
            </div>
          </div>
          <div 
            className="metric-value font-mono" 
            id="val-savings-rate"
            style={{ color: summary.savingsRatePercentage >= 20 ? "var(--income-emerald)" : "var(--warning-amber)" }}
          >
            {summary.savingsRatePercentage.toFixed(0)}%
          </div>
          <div className="metric-subtext">
            {summary.savingsRatePercentage >= 30 ? "Disciplined surplus (>30%)" : "Target: 20-30%"}
          </div>
        </div>
      </div>

      {/* 6. Accounts Breakdown & Category Spending Allocation */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
        {/* Category Allocation Progress Bars */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <span>Spending by Category</span>
            </div>
            <button 
              className="btn-secondary" 
              style={{ fontSize: "11px", padding: "4px 8px" }}
              onClick={onNavigateToTransactions}
            >
              Filter in Ledger
            </button>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "12.5px", padding: "16px 0" }}>
              No spending recorded yet. Click &quot;Add Transaction&quot; to begin.
            </div>
          ) : (
            <div>
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="category-progress-item">
                  <div className="category-progress-header">
                    <div className="category-name-group">
                      <div className="category-color-dot" style={{ background: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                      {formatPaiseToRupees(cat.spentPaise)} • {cat.pct}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${Math.min(100, cat.pct)}%`, background: cat.color }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Capital & Amount Overview */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <Wallet size={16} color="var(--brand-indigo)" />
              <span>Capital & Amount Overview</span>
            </div>
            <span className="badge-tag badge-income" style={{ fontSize: "10.5px" }}>Reconciled</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div 
              style={{ 
                padding: "12px 14px", 
                background: "var(--bg-card-subtle)", 
                border: "1px solid var(--border-subtle)", 
                borderRadius: "var(--radius-md)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Available Capital (Amount)</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Primary balance ready for allocation
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="font-mono" style={{ 
                  fontSize: "15px", 
                  fontWeight: 700, 
                  color: "var(--text-main)" 
                }}>
                  {formatPaiseToRupees(netCashPositionPaise)}
                </div>
                <div style={{ fontSize: "10px", color: "var(--income-emerald)" }}>
                  Live & Unencumbered
                </div>
              </div>
            </div>

            <div 
              style={{ 
                padding: "12px 14px", 
                background: "var(--bg-card-subtle)", 
                border: "1px solid var(--border-subtle)", 
                borderRadius: "var(--radius-md)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Monthly Net Surplus</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Inflows minus total spending
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="font-mono" style={{ 
                  fontSize: "14px", 
                  fontWeight: 700, 
                  color: summary.netSavingsPaise >= 0 ? "var(--income-emerald)" : "var(--expense-rose)" 
                }}>
                  {summary.netSavingsPaise >= 0 ? "+" : ""}{formatPaiseToRupees(summary.netSavingsPaise)}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  {summary.savingsRatePercentage.toFixed(0)}% retention
                </div>
              </div>
            </div>

            <div 
              style={{ 
                padding: "12px 14px", 
                background: "var(--bg-card-subtle)", 
                border: "1px solid var(--border-subtle)", 
                borderRadius: "var(--radius-md)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>Fixed Commitments</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Recurring monthly obligations
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="font-mono" style={{ 
                  fontSize: "14px", 
                  fontWeight: 700, 
                  color: "var(--text-secondary)" 
                }}>
                  {formatPaiseToRupees(summary.recurringCommitmentPaise)}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  Pre-allocated
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
