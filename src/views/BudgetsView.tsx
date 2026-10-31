import React from "react";
import { AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { CategoryBudget, Transaction } from "../types";
import { formatPaiseToRupees } from "../utils/money";

interface BudgetsViewProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  onOpenAddTransaction: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  transactions,
  onOpenAddTransaction
}) => {
  const safeTransactions = transactions || [];
  const safeBudgets = budgets || [];

  // Compute actual spent per category
  const spentPerCategory = safeTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amountPaise;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="view-content-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-main)" }}>Monthly Category Allocations</h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Live tracking calculated directly from your recorded transactions.</p>
        </div>
        <button className="btn-secondary" onClick={onOpenAddTransaction}>
          <Plus size={15} />
          <span>Record Spending</span>
        </button>
      </div>

      {/* Grid of Budget Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        {safeBudgets.map((b) => {
          const spentPaise = spentPerCategory[b.category] || 0;
          const pct = b.limitPaise > 0
            ? Math.min(Math.round((spentPaise / b.limitPaise) * 100), 100)
            : (spentPaise > 0 ? 100 : 0);
          const isOver = spentPaise > b.limitPaise;
          const isNear = pct >= 80 && !isOver;

          return (
            <div key={b.category} className="metric-card" style={{ gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text-main)" }}>{b.category}</div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Target Ceiling</div>
                </div>
                {isOver ? (
                  <span className="badge-tag badge-expense" style={{ fontSize: "10.5px" }}>
                    <AlertTriangle size={12} /> Over Limit ({formatPaiseToRupees(spentPaise - b.limitPaise)} over)
                  </span>
                ) : isNear ? (
                  <span className="badge-tag" style={{ background: "var(--warning-bg)", color: "var(--warning-amber)", border: "1px solid var(--warning-border)", fontSize: "10.5px" }}>
                    80%+ Used
                  </span>
                ) : (
                  <span className="badge-tag badge-income" style={{ fontSize: "10.5px" }}>
                    <CheckCircle2 size={12} /> On Target
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", color: isOver ? "var(--expense-rose)" : "var(--text-main)", fontWeight: 600 }}>
                    Spent: {formatPaiseToRupees(spentPaise)}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    Limit: {formatPaiseToRupees(b.limitPaise)}
                  </span>
                </div>
                <div style={{ height: "8px", width: "100%", background: "var(--bg-app)", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: isOver ? "var(--expense-rose)" : isNear ? "var(--warning-amber)" : b.color,
                      borderRadius: "999px"
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
