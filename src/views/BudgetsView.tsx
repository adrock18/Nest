import { useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Plus, Pencil, Check, X, FolderPlus, Target } from "lucide-react";
import type { CategoryBudget, Transaction, Category } from "../types";
import { formatPaiseToRupees, formatPaiseToDecimal, parseRupeesToPaise, addPaise } from "../utils/money";
import { computeBudgetProgress } from "../utils/finance";

interface BudgetsViewProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  categories: Category[];
  onOpenAddTransaction: () => void;
  onSetBudget: (budget: CategoryBudget) => Promise<void>;
  onAddCategory: (category: Category) => Promise<void>;
}

export function BudgetsView({ budgets, transactions, categories, onOpenAddTransaction, onSetBudget, onAddCategory }: BudgetsViewProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editLimitInput, setEditLimitInput] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#6366f1");
  const [newCatIsIncome, setNewCatIsIncome] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState("");
  const [newBudgetLimit, setNewBudgetLimit] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const spentPerCategory: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type === "expense") spentPerCategory[tx.category] = addPaise(spentPerCategory[tx.category] || 0, tx.amountPaise);
  }
  const unbudgeted = categories.filter((c) => !c.isIncome && !budgets.some((b) => b.category === c.name));
  const totalLimit = budgets.reduce((sum, b) => addPaise(sum, b.limitPaise), 0);
  const totalSpent = budgets.reduce((sum, b) => addPaise(sum, spentPerCategory[b.category] || 0), 0);

  async function saveBudget(budget: CategoryBudget, input: string) {
    if (isSaving) return;
    setError("");
    setIsSaving(true);
    try {
      await onSetBudget({ ...budget, limitPaise: parseRupeesToPaise(input) });
      setEditingCategory(null);
      setNewBudgetCategory("");
      setNewBudgetLimit("");
    } catch (error) { setError(String(error)); }
    finally { setIsSaving(false); }
  }

  async function addCategory(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setError("");
    const name = newCatName.trim();
    if (!name) { setError("Enter a category name."); return; }
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setError("A category with this name already exists."); return;
    }
    setIsSaving(true);
    try {
      await onAddCategory({ id: `cat-${crypto.randomUUID()}`, name, color: newCatColor, isIncome: newCatIsIncome });
      setNewCatName("");
      setShowAddCategory(false);
    } catch (error) { setError(String(error)); }
    finally { setIsSaving(false); }
  }

  return (
    <div className="view-content-wrapper">
      <div className="view-heading">
        <div><div className="eyebrow">MAKE ROOM FOR WHAT MATTERS</div><h2>Monthly budgets</h2>
          <p>Recurring category limits, compared with spending in the selected month.</p></div>
        <div className="toolbar-actions">
          <button className="btn-secondary" onClick={() => setShowAddCategory(true)}><FolderPlus size={15} />Add category</button>
          <button className="btn-secondary" onClick={onOpenAddTransaction}><Plus size={15} />Record spending</button>
        </div>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="budget-summary-strip">
        <div><span>Monthly plan</span><strong>{formatPaiseToRupees(totalLimit)}</strong></div>
        <div><span>Spent in budgeted categories</span><strong>{formatPaiseToRupees(totalSpent)}</strong></div>
        <div><span>Categories with a plan</span><strong>{budgets.length}</strong></div>
      </div>

      {showAddCategory && (
        <form className="panel-card inline-category-form" onSubmit={addCategory}>
          <div className="panel-header"><h3 className="panel-title">New category</h3>
            <button type="button" className="btn-close" aria-label="Cancel new category" disabled={isSaving} onClick={() => setShowAddCategory(false)}><X size={16} /></button></div>
          <div className="inline-form-grid">
            <label className="form-group"><span className="form-label">Name</span><input className="form-input" required autoFocus
              placeholder="e.g. Entertainment" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} /></label>
            <label className="form-group"><span className="form-label">Color</span><input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} /></label>
            <label className="category-income-toggle"><input type="checkbox" checked={newCatIsIncome} onChange={(e) => setNewCatIsIncome(e.target.checked)} />Income category</label>
            <button className="btn-primary" type="submit" disabled={isSaving}><Check size={15} />{isSaving ? "Saving..." : "Create category"}</button>
          </div>
          <p className="panel-note">Expense categories can be assigned a budget below after saving.</p>
        </form>
      )}

      {unbudgeted.length > 0 && (
        <form className="budget-create-form" onSubmit={(e) => {
          e.preventDefault();
          const category = unbudgeted.find((c) => c.name === (newBudgetCategory || unbudgeted[0]?.name));
          if (category) void saveBudget({ category: category.name, color: category.color, limitPaise: 0 }, newBudgetLimit);
        }}>
          <label className="form-group"><span className="form-label">Add a category budget</span>
            <select className="form-input" value={newBudgetCategory || unbudgeted[0].name} onChange={(e) => setNewBudgetCategory(e.target.value)}>
              {unbudgeted.map((c) => <option key={c.id}>{c.name}</option>)}</select></label>
          <label className="form-group"><span className="form-label">Monthly limit (₹)</span>
            <input type="number" min="0.01" step="0.01" required className="form-input" placeholder="0.00"
              value={newBudgetLimit} onChange={(e) => setNewBudgetLimit(e.target.value)} /></label>
          <button className="btn-primary" disabled={isSaving}><Plus size={15} />Set budget</button>
        </form>
      )}
      <div className="budget-card-grid">
        {budgets.map((budget) => {
          const spent = spentPerCategory[budget.category] || 0;
          const progress = computeBudgetProgress(spent, budget.limitPaise);
          const status = progress.isOver ? "danger" : progress.isNear || progress.isAtLimit ? "warning" : "healthy";
          return (
            <section className={`metric-card budget-card ${status}`} key={budget.category}>
              <div className="budget-check-header"><h3>{budget.category}</h3>
                <button className="btn-close" title={`Edit ${budget.category} budget`} aria-label={`Edit ${budget.category} budget`} disabled={isSaving}
                  onClick={() => { setEditingCategory(budget.category); setEditLimitInput(formatPaiseToDecimal(budget.limitPaise)); setError(""); }}><Pencil size={15} /></button></div>
              <div className="budget-used"><strong className="font-mono">{formatPaiseToRupees(spent)}</strong><span>{progress.pct.toFixed(1)}% used</span></div>
              <div className="progress-track" role="progressbar" aria-label={`${budget.category} budget used`} aria-valuemin={0}
                aria-valuemax={100} aria-valuenow={Math.min(100, progress.pct)} aria-valuetext={`${progress.pct.toFixed(1)}% used`}>
                <div className="progress-bar" style={{ width: `${Math.min(100, progress.pct)}%` }} /></div>
              {editingCategory === budget.category ? (
                <form className="budget-edit-form" onSubmit={(e) => { e.preventDefault(); void saveBudget(budget, editLimitInput); }}>
                  <input className="form-input" type="number" min="0.01" step="0.01" required autoFocus aria-label={`${budget.category} monthly limit`}
                    value={editLimitInput} onChange={(e) => setEditLimitInput(e.target.value)} />
                  <button className="btn-secondary" disabled={isSaving} aria-label="Save budget"><Check size={15} /></button>
                  <button className="btn-secondary" disabled={isSaving} type="button" aria-label="Cancel budget edit" onClick={() => setEditingCategory(null)}><X size={15} /></button>
                </form>
              ) : <p className="panel-note">Monthly limit: <span className="font-mono">{formatPaiseToRupees(budget.limitPaise)}</span></p>}
              <div className="budget-status-label">{status === "healthy" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                {progress.isOver ? `${formatPaiseToRupees(spent - budget.limitPaise)} over budget` : progress.isAtLimit ? "Limit reached"
                  : `${formatPaiseToRupees(progress.remainingPaise)} left${progress.isNear ? " · Approaching limit" : ""}`}</div>
            </section>
          );
        })}
      </div>
      {budgets.length === 0 && <div className="empty-state"><Target size={32} /><h3>No budgets yet</h3><p>Choose an expense category and a monthly limit above.</p></div>}
    </div>
  );
}
