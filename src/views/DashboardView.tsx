import { ArrowDownLeft, ArrowUpRight, ArrowRight, PiggyBank, Percent, Wallet,
  CreditCard, Landmark, Banknote, Target, AlertTriangle, Plus } from "lucide-react";
import type { MonthlyFinancialSummary, CategoryBudget, Account } from "../types";
import { formatPaiseToRupees, addPaise } from "../utils/money";
import { formatMonthLabel } from "../utils/dates";
import { calculateCashPosition, computeBudgetProgress } from "../utils/finance";
import type { WorkspaceId } from "../utils/workspaces";

interface DashboardViewProps {
  summary: MonthlyFinancialSummary;
  categoryBreakdown: { name: string; spentPaise: number; pct: number; color: string }[];
  budgets: CategoryBudget[];
  accounts: Account[];
  accountBalances: Record<string, number>;
  selectedMonth: string;
  transactionCount: number;
  onNavigateToTransactions: () => void;
  onNavigateToBudgets: () => void;
  onOpenAddTransaction: () => void;
  workspaceSummaries: { id: WorkspaceId; title: string; totalPaise: number; travelPaise: number }[];
  onNavigateToWorkspace: (workspaceId: WorkspaceId) => void;
  travelPersonalPaise: number;
  onNavigateToTravel: () => void;
}

export function DashboardView({ summary, categoryBreakdown, budgets, accounts, accountBalances,
  selectedMonth, transactionCount, onNavigateToTransactions, onNavigateToBudgets,
  onOpenAddTransaction, workspaceSummaries, onNavigateToWorkspace, travelPersonalPaise, onNavigateToTravel }: DashboardViewProps) {
  const { liquidCashPaise, creditDebtPaise, netCashPositionPaise } = calculateCashPosition(accounts, accountBalances);
  const budgetRows = budgets.map((budget) => {
    const spent = categoryBreakdown.find((category) => category.name === budget.category)?.spentPaise || 0;
    return { ...budget, spent, ...computeBudgetProgress(spent, budget.limitPaise) };
  }).sort((a, b) => b.pct - a.pct);
  const alerts = budgetRows.filter((budget) => budget.isOver || budget.isAtLimit || budget.isNear);
  const remainingPaise = budgetRows.reduce((total, budget) => addPaise(total, budget.remainingPaise), 0);
  const allocatedPaise = budgets.reduce((total, budget) => addPaise(total, budget.limitPaise), 0);
  const hasActivity = transactionCount > 0;
  const deficit = summary.netSavingsPaise < 0;
  const status = !hasActivity ? "No activity yet" : deficit || alerts.some((b) => b.isOver) ? "Needs attention"
    : alerts.length > 0 ? "Limits in sight" : "Within your budgets";
  const ringSegments = categoryBreakdown.reduce<{ stops: string[]; offset: number }>((result, category) => {
    result.stops.push(`${category.color} ${result.offset}% ${result.offset + category.pct}%`);
    result.offset += category.pct;
    return result;
  }, { stops: [], offset: 0 }).stops.join(", ");

  return (
    <div className="view-content-wrapper dashboard-workspace">
      <div className="dashboard-heading">
        <div>
          <div className="eyebrow">YOUR MONTH, AT A GLANCE</div>
          <h2>{formatMonthLabel(selectedMonth)}</h2>
          <p>{transactionCount} recorded {transactionCount === 1 ? "entry" : "entries"} · Monthly income, expenses, and savings.</p>
        </div>
        <div className="dashboard-heading-actions">
          <button className="text-button" onClick={onNavigateToTransactions}>View entries <ArrowRight size={14} /></button>
          <span className={`dashboard-status ${!hasActivity ? "neutral" : deficit || alerts.some((b) => b.isOver) ? "danger" : alerts.length > 0 ? "warning" : "healthy"}`}>
          <span className="status-indicator-dot" />{status}
          </span>
        </div>
      </div>

      {!hasActivity && (
        <div className="dashboard-welcome">
          <div className="welcome-icon"><Wallet size={22} /></div>
          <div><h3>Start with one transaction</h3><p>Record an income or expense to bring this month into focus.</p></div>
          <button className="btn-primary" onClick={onOpenAddTransaction}><Plus size={16} />Record transaction</button>
        </div>
      )}

      <section className="dashboard-grid monthly-summary" aria-label="Monthly cash flow">
        <div className="metric-card accent-income">
          <div className="metric-header"><span className="metric-label">Income</span><ArrowDownLeft size={17} /></div>
          <div className="metric-value income" id="val-total-inflow">{formatPaiseToRupees(summary.totalInflowPaise)}</div>
          <div className="metric-subtext">Money received this month</div>
        </div>
        <div className="metric-card accent-expense">
          <div className="metric-header"><span className="metric-label">Expenses</span><ArrowUpRight size={17} /></div>
          <div className="metric-value expense" id="val-total-outflow">{formatPaiseToRupees(summary.totalOutflowPaise)}</div>
          <div className="metric-subtext">Money spent this month</div>
        </div>
        <div className={`metric-card accent-savings ${deficit ? "has-deficit" : ""}`}>
          <div className="metric-header"><span className="metric-label">Net savings</span><PiggyBank size={17} /></div>
          <div className={`metric-value ${deficit ? "expense" : "savings"}`} id="val-net-savings">{formatPaiseToRupees(summary.netSavingsPaise)}</div>
          <div className="metric-subtext">{deficit ? "Expenses exceed income" : "Income minus expenses"}</div>
        </div>
        <div className={`metric-card accent-rate ${deficit ? "has-deficit" : ""}`}>
          <div className="metric-header"><span className="metric-label">Savings rate</span><Percent size={17} /></div>
          <div className={`metric-value ${deficit ? "expense" : "savings"}`} id="val-savings-rate">
            {summary.totalInflowPaise > 0 ? `${summary.savingsRatePercentage.toFixed(1)}%` : "—"}
          </div>
          <div className="metric-subtext">{summary.totalInflowPaise > 0 ? "Net savings as a share of income" : "Record income to calculate this"}</div>
        </div>
      </section>

      <section className="panel-card workspace-launcher">
        <div className="panel-header"><h3 className="panel-title">Explore your spending</h3><span className="panel-caption">Household + your travel shares</span></div>
        <p className="panel-note">These personal-spending views include trip shares. They are not extra expenses in the cash-flow summary above.</p>
        <div className="workspace-launch-grid">{workspaceSummaries.map((workspace) =>
          <button className={`workspace-launch-card workspace-${workspace.id}`} key={workspace.id} onClick={() => onNavigateToWorkspace(workspace.id)}>
            <span>{workspace.title}<ArrowRight size={14} /></span><strong className="font-mono">{formatPaiseToRupees(workspace.totalPaise)}</strong>
            <small>{workspace.travelPaise > 0 ? `${formatPaiseToRupees(workspace.travelPaise)} from travel` : "Open monthly dashboard"}</small>
          </button>)}
          <button className="workspace-launch-card workspace-travel" onClick={onNavigateToTravel}>
            <span>Travel Expenses<ArrowRight size={14} /></span><strong className="font-mono">{formatPaiseToRupees(travelPersonalPaise)}</strong>
            <small>Your trip shares · Overlaps category views</small>
          </button>
        </div>
      </section>

      {(alerts.length > 0 || deficit) && (
        <div className="budget-alert">
          <AlertTriangle size={20} />
          <div><strong>{deficit ? "This month's spending is above income" : `${alerts.length} ${alerts.length === 1 ? "budget needs" : "budgets need"} a closer look`}</strong>
            <p>{alerts.length > 0 ? alerts.map((b) => b.category).join(", ") : "Review the ledger to understand your monthly deficit."}</p></div>
          <button className="btn-secondary" onClick={alerts.length > 0 ? onNavigateToBudgets : onNavigateToTransactions}>
            {alerts.length > 0 ? "Review budgets" : "Review ledger"}<ArrowRight size={14} />
          </button>
        </div>
      )}

      <div className="dashboard-detail-grid">
        <section className="panel-card spending-panel">
          <div className="panel-header"><h3 className="panel-title">Where your money went</h3><span className="panel-caption">This month</span></div>
          {categoryBreakdown.length === 0 ? (
            <div className="empty-state"><PiggyBank size={28} /><h3>No spending recorded</h3><p>Your category breakdown will appear here.</p></div>
          ) : (
            <>
              <div className="spending-overview">
                <div className="spending-ring" role="img" aria-label="Expense distribution by category" style={{ background: `conic-gradient(${ringSegments})` }}>
                  <div><span>SPENT</span><strong>{formatPaiseToRupees(summary.totalOutflowPaise)}</strong></div>
                </div>
                <div className="spending-insight"><span className="eyebrow">TOP CATEGORY</span>
                  <h4>{categoryBreakdown[0].name}</h4><p>{categoryBreakdown[0].pct.toFixed(1)}% of monthly spending</p>
                  <strong className="font-mono">{formatPaiseToRupees(categoryBreakdown[0].spentPaise)}</strong>
                </div>
              </div>
              <div className="category-list">
                {categoryBreakdown.map((category) => (
                  <div key={category.name} className="category-progress-item">
                    <div className="category-progress-header">
                      <div className="category-name-group"><span className="category-color-dot" style={{ background: category.color }} />{category.name}</div>
                      <span className="font-mono">{formatPaiseToRupees(category.spentPaise)} <small>{category.pct.toFixed(1)}%</small></span>
                    </div>
                    <div className="progress-track"><div className="progress-bar" style={{ width: `${category.pct}%`, background: category.color }} /></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="panel-card">
          <div className="panel-header"><h3 className="panel-title">Budget check-in</h3>
            <button className="text-button" onClick={onNavigateToBudgets}>Manage <ArrowRight size={14} /></button></div>
          {budgets.length > 0 && <div className="budget-remaining-summary">
            <span>Remaining in category budgets</span><strong className="font-mono">{formatPaiseToRupees(remainingPaise)}</strong>
            <small>Of {formatPaiseToRupees(allocatedPaise)} planned for the month</small>
          </div>}
          {budgetRows.length === 0 ? (
            <div className="empty-state"><Target size={28} /><h3>Give your spending a plan</h3><p>Add your first category budget.</p>
              <button className="btn-secondary" onClick={onNavigateToBudgets}>Set a budget</button></div>
          ) : budgetRows.slice(0, 5).map((budget) => {
            const status = budget.isOver ? "danger" : budget.isAtLimit || budget.isNear ? "warning" : "healthy";
            return (
              <div className={`budget-check-row ${status}`} key={budget.category}>
                <div className="budget-check-header"><strong>{budget.category}</strong>
                  <span>{budget.isOver ? `${formatPaiseToRupees(budget.spent - budget.limitPaise)} over`
                    : budget.isAtLimit ? "Limit reached" : `${formatPaiseToRupees(budget.remainingPaise)} left`}</span></div>
                <div className="progress-track" role="progressbar" aria-label={`${budget.category} budget used`}
                  aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, budget.pct)}
                  aria-valuetext={`${budget.pct.toFixed(1)}% used`}>
                  <div className="progress-bar" style={{ width: `${Math.min(100, budget.pct)}%` }} />
                </div>
                <small>{formatPaiseToRupees(budget.spent)} of {formatPaiseToRupees(budget.limitPaise)}</small>
              </div>
            );
          })}
          <div className="recurring-note"><span>Recurring spending recorded</span><strong className="font-mono">{formatPaiseToRupees(summary.recurringCommitmentPaise)}</strong></div>
          <p className="panel-note">These bills are already included in money out, not deducted again.</p>
        </section>
      </div>

      <section className="panel-card accounts-panel">
        <div className="panel-header"><div><h3 className="panel-title">Your accounts</h3><p className="panel-note">Current balances across all recorded dates, independent of the selected month.</p></div>
          <div className="account-net"><span>Net position</span><strong className={`font-mono ${netCashPositionPaise < 0 ? "number-expense" : "number-balance"}`}>{formatPaiseToRupees(netCashPositionPaise)}</strong></div></div>
        <div className="account-position-summary">
          <span>Bank + cash <strong className={`font-mono ${liquidCashPaise < 0 ? "number-expense" : "number-balance"}`}>{formatPaiseToRupees(liquidCashPaise)}</strong></span>
          <span>Card dues <strong className="font-mono number-expense">{formatPaiseToRupees(creditDebtPaise)}</strong></span>
        </div>
        <div className="account-card-grid">
          {accounts.map((account) => {
            const Icon = account.type === "credit" ? CreditCard : account.type === "bank" ? Landmark : Banknote;
            const balance = accountBalances[account.id];
            return <div className={`account-summary ${account.type}`} key={account.id}>
              <div className="account-summary-title"><Icon size={18} /><span>{account.name}</span></div>
              <strong className={`font-mono ${account.type === "credit" || balance < 0 ? "number-expense" : "number-balance"}`}>{formatPaiseToRupees(account.type === "credit" ? Math.max(0, -balance) : balance)}</strong>
              <small>{account.type === "credit" ? balance > 0 ? `${formatPaiseToRupees(balance)} card credit` : "Outstanding dues" : account.type === "bank" ? "Bank balance" : "Cash in hand"}</small>
            </div>;
          })}
          {accounts.length === 0 && <p className="panel-note">Add an account in Settings to start tracking balances.</p>}
        </div>
      </section>
    </div>
  );
}
