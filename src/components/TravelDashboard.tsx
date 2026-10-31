import { ArrowRight, Compass } from "lucide-react";
import type { Trip, TripExpense } from "../types";
import { computeTravelDashboard, TRAVEL_CATEGORIES } from "../utils/travel";
import { formatPaiseToRupees } from "../utils/money";
import { formatMonthLabel } from "../utils/dates";
import { workspaceForTravelCategory, type WorkspaceId } from "../utils/workspaces";

interface Props {
  trips: Trip[];
  expenses: TripExpense[];
  month: string;
  onOpenTrip: (tripId: string, expenseId?: string) => void;
  onNavigateToWorkspace: (id: WorkspaceId, month?: string) => void;
}

export function TravelDashboard({ trips, expenses, month, onOpenTrip, onNavigateToWorkspace }: Props) {
  const summary = computeTravelDashboard(trips, expenses, month);
  return <section className="travel-dashboard workspace-travel" aria-label="Travel dashboard">
    <div className="spending-scope-note">
      Monthly figures follow expense dates. Your share is personal spending; group bills and amounts paid by you are separate views of the same expenses, not extra costs.
      Recording travel does not create an account payment.
    </div>
    <section className="workspace-metrics" aria-label="Travel monthly summary">
      <div className="metric-card"><span className="metric-label">Your travel spending</span><strong className="metric-value expense">{formatPaiseToRupees(summary.personalPaise)}</strong><small>Your shares in {formatMonthLabel(month)}</small></div>
      <div className="metric-card"><span className="metric-label">Group bills recorded</span><strong className="metric-value expense">{formatPaiseToRupees(summary.groupPaise)}</strong><small>All companions, including your share</small></div>
      <div className="metric-card"><span className="metric-label">Paid by you</span><strong className="metric-value expense">{formatPaiseToRupees(summary.paidByMePaise)}</strong><small>Recorded payer amounts, not bank cash flow</small></div>
      <div className="metric-card"><span className="metric-label">Trips with spending</span><strong className="metric-value savings">{summary.tripCount}</strong><small>{summary.entries.length} expenses this month</small></div>
    </section>
    <div className="workspace-detail-grid">
      <section className="panel-card">
        <div className="panel-header"><h3 className="panel-title">Where your travel money goes</h3><span className="panel-caption">Your monthly shares</span></div>
        {!summary.categories.length ? <div className="empty-state"><Compass size={24} /><h3>No travel spending this month</h3><p>Create a trip or record an expense in an existing trip below.</p></div> :
          summary.categories.map(({ category, spentPaise }) => {
            const meta = TRAVEL_CATEGORIES[category];
            const workspace = workspaceForTravelCategory(category);
            return <div className="category-progress-item" key={category}>
              <div className="category-progress-header"><span>{meta.label}</span><strong className="font-mono number-expense">{formatPaiseToRupees(spentPaise)}</strong></div>
              <div className="progress-track"><div className="progress-bar workspace-progress" style={{ width: `${summary.personalPaise ? spentPaise / summary.personalPaise * 100 : 0}%` }} /></div>
              {workspace && <button className="text-button" onClick={() => onNavigateToWorkspace(workspace, month)}>Open category dashboard <ArrowRight size={13} /></button>}
            </div>;
          })}
      </section>
      <section className="panel-card">
        <div className="panel-header"><h3 className="panel-title">Trip budget check-in</h3><span className="panel-caption">Full trip · all dates</span></div>
        <p className="panel-note">Group spending against each trip's own budget. These are not monthly household limits; changing the month does not reset them.</p>
        {!summary.budgets.length ? <div className="empty-state"><h3>No trip budgets yet</h3><p>Create your first trip to set a group budget.</p></div> :
          summary.budgets.map(({ trip, spentPaise, remainingPaise, pct, isOver, isAtLimit, isNear }) => <div className="travel-budget-row" key={trip.id}>
            <button className="text-button" onClick={() => onOpenTrip(trip.id)}>{trip.name}<ArrowRight size={13} /></button>
            <div className="travel-budget-values"><strong className="font-mono number-expense">{formatPaiseToRupees(spentPaise)}</strong>
              <span>{trip.budgetPaise > 0 ? `of ${formatPaiseToRupees(trip.budgetPaise)}` : "No budget set"}</span></div>
            {trip.budgetPaise > 0 && <>
              <div className="progress-track"><div className={`progress-bar ${isOver || isAtLimit ? "travel-budget-danger" : "workspace-progress"}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>
              <small className={isOver || isAtLimit ? "number-expense" : "panel-note"}>
                {isOver ? `${formatPaiseToRupees(spentPaise - trip.budgetPaise)} over budget` : isAtLimit ? "Budget reached" :
                  `${formatPaiseToRupees(remainingPaise)} remaining${isNear ? " · Approaching limit" : ""}`}
              </small>
            </>}
          </div>)}
      </section>
    </div>
    <section className="panel-card">
      <div className="panel-header"><h3 className="panel-title">Recent travel expenses</h3><span className="panel-caption">Latest 5 in selected month</span></div>
      {!summary.entries.length ? <p className="panel-note">No expenses recorded for {formatMonthLabel(month)}. Your existing trips remain below.</p> :
        <div className="travel-recent-list">{summary.entries.slice(0, 5).map(({ expense, trip }) =>
          <button className="travel-recent-entry" key={expense.id} onClick={() => onOpenTrip(trip.id, expense.id)}>
            <span><strong>{expense.title}</strong><small>{expense.date} · {trip.name} · {TRAVEL_CATEGORIES[expense.category].label}</small></span>
            <span><strong className="font-mono number-expense">{formatPaiseToRupees(expense.mySharePaise)}</strong><small>Your share <ArrowRight size={12} /></small></span>
          </button>)}</div>}
    </section>
  </section>;
}
