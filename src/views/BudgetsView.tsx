import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Pencil, Check, X, FolderPlus } from "lucide-react";
import { CategoryBudget, Transaction, Category } from "../types";
import { formatPaiseToRupees, parseRupeesToPaise } from "../utils/money";

interface BudgetsViewProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  categories: Category[];
  onOpenAddTransaction: () => void;
  onSetBudget: (budget: CategoryBudget) => void;
  onAddCategory: (category: Category) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  transactions,
  categories: _categories,
  onOpenAddTransaction,
  onSetBudget,
  onAddCategory
}) => {
  const safeTransactions = transactions || [];
  const safeBudgets = budgets || [];

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editLimitInput, setEditLimitInput] = useState("");

  // New category form state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#6366f1");
  const [newCatIsIncome, setNewCatIsIncome] = useState(false);
  const [newCatBudget, setNewCatBudget] = useState("");

  // Compute actual spent per category
  const spentPerCategory = safeTransactions
    .filter((tx) => tx.type === "expense")
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amountPaise;
      return acc;
    }, {} as Record<string, number>);

  const handleStartEdit = (b: CategoryBudget) => {
    setEditingCategory(b.category);
    setEditLimitInput(formatPaiseToRupees(b.limitPaise).replace(/[₹,\s]/g, ""));
  };

  const handleSaveEdit = (b: CategoryBudget) => {
    try {
      const newLimit = parseRupeesToPaise(editLimitInput);
      onSetBudget({ ...b, limitPaise: newLimit });
    } catch {
      // Invalid input — revert
    }
    setEditingCategory(null);
    setEditLimitInput("");
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditLimitInput("");
  };

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    const newCat: Category = {
      id: `cat-${trimmed.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      name: trimmed,
      color: newCatColor,
      isIncome: newCatIsIncome
    };
    onAddCategory(newCat);

    // Also set a budget if amount was provided
    if (newCatBudget && !newCatIsIncome) {
      try {
        const limitPaise = parseRupeesToPaise(newCatBudget);
        onSetBudget({ category: trimmed, limitPaise, color: newCatColor });
      } catch {
        // skip budget if invalid
      }
    }

    setNewCatName("");
    setNewCatColor("#6366f1");
    setNewCatIsIncome(false);
    setNewCatBudget("");
    setShowAddCategory(false);
  };

  return (
    <div className="view-content-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-main)" }}>Monthly Category Allocations</h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Click the pencil icon to edit budget limits. Live tracking from your transactions.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-secondary" onClick={() => setShowAddCategory(true)}>
            <FolderPlus size={15} />
            <span>Add Category</span>
          </button>
          <button className="btn-secondary" onClick={onOpenAddTransaction}>
            <Plus size={15} />
            <span>Record Spending</span>
          </button>
        </div>
      </div>

      {/* Add Category Inline Form */}
      {showAddCategory && (
        <div className="metric-card" style={{ marginBottom: "20px", gap: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)", marginBottom: "4px" }}>New Category</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto", gap: "10px", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>NAME</label>
              <input
                type="text"
                placeholder="e.g. Entertainment"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-main)",
                  fontSize: "13px"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>COLOR</label>
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                style={{ width: "40px", height: "36px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer", padding: "2px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>MONTHLY BUDGET (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Optional"
                value={newCatBudget}
                onChange={(e) => setNewCatBudget(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-main)",
                  fontSize: "13px",
                  fontFamily: "var(--font-mono)"
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button type="button" className="btn-primary" onClick={handleAddCategory} style={{ padding: "8px 12px" }}>
                <Check size={14} />
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowAddCategory(false)} style={{ padding: "8px 12px" }}>
                <X size={14} />
              </button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <input
              type="checkbox"
              checked={newCatIsIncome}
              onChange={(e) => setNewCatIsIncome(e.target.checked)}
              style={{ accentColor: "var(--accent-cyan)" }}
            />
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>This is an income category (e.g. Salary, Freelance)</span>
          </div>
        </div>
      )}

      {/* Grid of Budget Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        {safeBudgets.map((b) => {
          const spentPaise = spentPerCategory[b.category] || 0;
          const pct = b.limitPaise > 0
            ? Math.min(Math.round((spentPaise / b.limitPaise) * 100), 100)
            : (spentPaise > 0 ? 100 : 0);
          const isOver = spentPaise > b.limitPaise;
          const isNear = pct >= 80 && !isOver;
          const isEditingThis = editingCategory === b.category;

          return (
            <div key={b.category} className="metric-card" style={{ gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text-main)" }}>{b.category}</div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Target Ceiling</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
                  {!isEditingThis && (
                    <button
                      onClick={() => handleStartEdit(b)}
                      style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}
                      title="Edit budget limit"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-mono)", color: isOver ? "var(--expense-rose)" : "var(--text-main)", fontWeight: 600 }}>
                    Spent: {formatPaiseToRupees(spentPaise)}
                  </span>
                  {isEditingThis ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "11.5px" }}>Limit: ₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editLimitInput}
                        onChange={(e) => setEditLimitInput(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(b);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        style={{
                          width: "100px",
                          padding: "3px 6px",
                          background: "var(--bg-input)",
                          border: "1px solid var(--accent-cyan)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-main)",
                          fontSize: "12.5px",
                          fontFamily: "var(--font-mono)"
                        }}
                      />
                      <button onClick={() => handleSaveEdit(b)} style={{ background: "transparent", border: "none", color: "var(--income-emerald)", cursor: "pointer", padding: "2px" }}>
                        <Check size={14} />
                      </button>
                      <button onClick={handleCancelEdit} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      Limit: {formatPaiseToRupees(b.limitPaise)}
                    </span>
                  )}
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
