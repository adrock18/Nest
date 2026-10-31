import { useMemo, useState } from "react";
import { Plus, ArrowRight, Search, Repeat, Link2, Unlink, Compass } from "lucide-react";
import type { Account, CategoryBudget, Transaction, Trip, TripExpense } from "../types";
import { addPaise, formatPaiseToRupees } from "../utils/money";
import { formatMonthLabel } from "../utils/dates";
import { buildSpendingEntries, getWorkspace, sourceLinkCategory, summarizeSpending, workspaceBudgetSummary,
  workspaceForCategory, type WorkspaceId, type SpendingEntry } from "../utils/workspaces";

interface Props {
  workspaceId: WorkspaceId;
  month: string;
  transactions: Transaction[];
  accounts: Account[];
  budgets: CategoryBudget[];
  trips: Trip[];
  tripExpenses: TripExpense[];
  onAddExpense: (category: string, recurring: boolean) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: Transaction) => Promise<void>;
  onOpenTrip: (tripId: string, expenseId?: string) => void;
  onManageBudgets: () => void;
}

export function SpendingWorkspaceView({ workspaceId, month, transactions, accounts, budgets, trips, tripExpenses,
  onAddExpense, onEditTransaction, onUpdateTransaction, onOpenTrip, onManageBudgets }: Props) {
  const workspace = getWorkspace(workspaceId);
  const entries = useMemo(() => buildSpendingEntries(workspaceId, month, transactions, trips, tripExpenses, accounts),
    [workspaceId, month, transactions, trips, tripExpenses, accounts]);
  const summary = summarizeSpending(entries);
  const { limits, limitPaise, spent: categorySpent, remainingPaise: budgetRemaining, isOver: anyOverBudget } =
    workspaceBudgetSummary(workspaceId, month, transactions, budgets);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | "ledger" | "travel">("all");
  const [linkingEntry, setLinkingEntry] = useState<SpendingEntry | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = entries.filter((entry) => (source === "all" || entry.source === source)
    && [entry.title, entry.sourceLabel, entry.category, ...entry.tags].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
  const breakdown = new Map<string, { total: number; count: number }>();
  const byMerchant = workspaceId === "subscriptions" || workspaceId === "shopping";
  for (const entry of entries) {
    const name = byMerchant ? entry.title : entry.category === "food" ? "Trip dining"
      : entry.category === "stay" ? "Trip accommodation" : entry.category === "transport" ? "Trip transport"
      : entry.category === "fuel" ? "Trip fuel" : entry.category === "shopping" ? "Trip shopping" : entry.category;
    const existing = breakdown.get(name) || { total: 0, count: 0 };
    breakdown.set(name, { total: addPaise(existing.total, entry.amountPaise), count: existing.count + 1 });
  }
  const breakdownRows = [...breakdown.entries()].sort((a, b) => b[1].total - a[1].total);
  const candidates = linkingEntry ? transactions.filter((tx) => tx.type === "expense" && !tx.tripExpenseId
    && workspaceForCategory(tx.category) === workspaceId) : [];
  const travelEntries = entries.filter((entry) => entry.source === "travel");
  const linkedTrips = [...new Map(travelEntries.filter((entry) => entry.trip).map((entry) => [entry.trip!.id, entry.trip!])).values()];

  async function updateLink(transaction: Transaction, sourceId: string | null) {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await onUpdateTransaction({ ...transaction, tripExpenseId: sourceId });
      setLinkingEntry(null);
      setTransactionId("");
    } catch (error) { setError(String(error)); }
    finally { setBusy(false); }
  }

  return (
    <div className={`view-content-wrapper spending-workspace workspace-${workspaceId}`}>
      <div className="view-heading">
        <div><div className="eyebrow">{formatMonthLabel(month)} · CONNECTED SPENDING</div><h2>{workspace.title}</h2><p>{workspace.description}</p></div>
        <button className="btn-primary" onClick={() => onAddExpense(workspace.defaultCategory, workspaceId === "subscriptions")}>
          <Plus size={15} />{workspace.action}
        </button>
      </div>
      <div className="spending-scope-note">
        Personal spending = unlinked household expenses + your trip shares. Travel entries are not new account payments.
        Household budgets use account-ledger amounts, including linked payments, but never add trip shares again.
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <section className="workspace-metrics" aria-label={`${workspace.title} monthly summary`}>
        <div className="metric-card"><span className="metric-label">Personal spending</span><strong className="metric-value expense">{formatPaiseToRupees(summary.totalPaise)}</strong><small>{entries.length} entries across linked views</small></div>
        <div className="metric-card"><span className="metric-label">Household spending</span><strong className="metric-value expense">{formatPaiseToRupees(summary.ledgerPaise)}</strong><small>Excludes entries linked to a trip</small></div>
        <div className="metric-card"><span className="metric-label">{workspace.travelCategories.length ? "Your trip shares" : "Recurring recorded"}</span>
          <strong className="metric-value savings">{formatPaiseToRupees(workspace.travelCategories.length ? summary.travelPaise : summary.recurringPaise)}</strong>
          <small>{workspace.travelCategories.length ? `${linkedTrips.length} related trips this month` : "Recorded charges, not a forecast"}</small></div>
        <div className="metric-card"><span className="metric-label">Household budget left</span>
          <strong className={`metric-value ${anyOverBudget ? "expense" : "savings"}`}>
            {limits.length ? formatPaiseToRupees(budgetRemaining) : "Not set"}
          </strong><small>{limits.length ? `${formatPaiseToRupees(limitPaise)} planned${anyOverBudget ? " · Limit exceeded" : ""}` : "Set limits in monthly budgets"}</small></div>
      </section>

      <div className="workspace-detail-grid">
        <section className="panel-card">
          <div className="panel-header"><h3 className="panel-title">{workspace.breakdownTitle}</h3><span className="panel-caption">Selected month</span></div>
          {breakdownRows.length === 0 ? <div className="empty-state"><h3>No spending recorded</h3><p>{workspace.action} to start this dashboard.</p></div>
            : breakdownRows.map(([name, value]) => <div className="category-progress-item" key={name}>
              <div className="category-progress-header"><span>{name}</span><strong className="font-mono number-expense">{formatPaiseToRupees(value.total)}</strong></div>
              <div className="progress-track"><div className="progress-bar workspace-progress" style={{ width: `${summary.totalPaise ? value.total / summary.totalPaise * 100 : 0}%` }} /></div>
              <small className="panel-note">{value.count} {value.count === 1 ? "entry" : "entries"}</small>
            </div>)}
          {workspaceId === "subscriptions" && <p className="panel-note">Use the merchant/service name in Notes to group charges. Renewal dates and automatic billing are not inferred.</p>}
        </section>
        <section className="panel-card">
          <div className="panel-header"><h3 className="panel-title">Household category plan</h3><button className="text-button" onClick={onManageBudgets}>Manage budgets <ArrowRight size={14} /></button></div>
          <p className="panel-note">Same account-ledger amounts as Monthly Budgets. Travel shares alone do not consume these limits; linked account payments do.</p>
          {workspace.categories.map((category) => {
            const limit = limits.find((budget) => budget.category === category);
            const spent = categorySpent.get(category) || 0;
            return <div className="workspace-category-plan" key={category}>
              <div><strong>{category}</strong><small>{formatPaiseToRupees(spent)} spent{limit ? ` / ${formatPaiseToRupees(limit.limitPaise)} limit${spent > limit.limitPaise ? ` · ${formatPaiseToRupees(spent - limit.limitPaise)} over` : ""}` : " / no limit"}</small></div>
              <button className="btn-secondary" onClick={() => onAddExpense(category, workspaceId === "subscriptions")}><Plus size={14} />Record</button>
            </div>;
          })}
          <div className="recurring-note"><span>{workspace.recurringTitle}</span><strong className="font-mono number-expense">{formatPaiseToRupees(summary.recurringPaise)}</strong></div>
        </section>
      </div>

      {linkedTrips.length > 0 && <section className="panel-card">
        <div className="panel-header"><h3 className="panel-title"><Compass size={17} />Connected trips</h3><span className="panel-caption">Your share only</span></div>
        <div className="connected-trip-grid">{linkedTrips.map((trip) => {
          const total = travelEntries.filter((entry) => entry.trip?.id === trip.id).reduce((sum, entry) => addPaise(sum, entry.amountPaise), 0);
          return <button className="connected-trip-card" key={trip.id} onClick={() => onOpenTrip(trip.id)}>
            <strong>{trip.name}</strong><span>{trip.destination}</span><b className="font-mono">{formatPaiseToRupees(total)}</b><small>Open original trip <ArrowRight size={13} /></small>
          </button>;
        })}</div>
      </section>}

      {linkingEntry && <section className="panel-card source-link-form" aria-label="Link existing ledger entry">
        <h3 className="panel-title">Already recorded this trip expense in your account ledger?</h3>
        <p className="panel-note">Link the existing expense. This changes only its source reference, not its amount, date, or account. The category dashboard then counts your trip share once instead of both records.</p>
        <label className="form-group"><span className="form-label">Existing household expense</span>
          <select className="form-input" value={transactionId} onChange={(event) => setTransactionId(event.target.value)}>
            <option value="">Choose an expense in {workspace.title}</option>
            {candidates.map((tx) => <option value={tx.id} key={tx.id}>{tx.date} · {tx.notes || tx.category} · {formatPaiseToRupees(tx.amountPaise)}</option>)}
          </select></label>
        {!candidates.length && <p className="panel-note">No unlinked ledger expenses in this workspace. You do not need to create an account payment just to use this dashboard.</p>}
        <div className="toolbar-actions"><button className="btn-primary" disabled={!transactionId || busy} onClick={() => {
          const transaction = candidates.find((tx) => tx.id === transactionId);
          if (transaction && linkingEntry.tripExpense) void updateLink(transaction, linkingEntry.tripExpense.id);
        }}><Link2 size={14} />{busy ? "Linking..." : "Link existing entry"}</button>
          <button className="btn-secondary" disabled={busy} onClick={() => setLinkingEntry(null)}>Cancel</button></div>
      </section>}

      <div className="transactions-toolbar">
        <div className="filter-group">{(["all", "ledger", "travel"] as const).map((value) => <button className="btn-secondary" key={value}
          aria-pressed={source === value} onClick={() => setSource(value)}>{value === "all" ? "All spending" : value === "ledger" ? "Household" : "From travel"}</button>)}</div>
        <label className="workspace-search"><Search size={15} /><input className="form-input" aria-label={`Search ${workspace.title} entries`}
          placeholder="Search merchant, source, category or tags" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      </div>
      <div className="data-table-container">
        {!filtered.length ? <div className="empty-state"><h3>No matching entries</h3><p>Record an expense or change the month, search, or source filter.</p></div> :
          <table className="data-table workspace-entry-table"><thead><tr><th>Date</th><th>Expense</th><th>Source & context</th><th>Your spending</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map((entry) => <tr key={entry.key}>
              <td className="font-mono">{entry.date}</td><td><strong>{entry.title}</strong><div className="panel-note">{entry.category}{entry.isRecurring && <> · <Repeat size={12} />Recurring</>}</div></td>
              <td><span className={`workspace-source ${entry.source}`}>{entry.source === "travel" ? "Travel" : "Household"}</span>
                <div className="panel-note">{entry.sourceLabel}</div>{entry.tags.length > 0 && <div className="panel-note">{entry.tags.join(" ")}</div>}
                {entry.linkedTransaction && <small className="panel-note">Account entry linked · counted once here</small>}</td>
              <td><strong className="font-mono number-expense">{formatPaiseToRupees(entry.amountPaise)}</strong>
                {entry.tripExpense && <div className="panel-note">Your share of {formatPaiseToRupees(entry.tripExpense.amountPaise)} group bill</div>}</td>
              <td><div className="workspace-entry-actions">
                {entry.transaction && <button className="text-button" onClick={() => onEditTransaction(entry.transaction!)}>Edit ledger entry</button>}
                {entry.trip && <button className="text-button" onClick={() => onOpenTrip(entry.trip!.id, entry.tripExpense?.id)}>Open trip <ArrowRight size={13} /></button>}
                {entry.tripExpense && !entry.linkedTransaction && sourceLinkCategory(entry.tripExpense) && <button className="text-button" disabled={busy}
                  onClick={() => { setLinkingEntry(entry); setTransactionId(""); setError(""); }}>Link existing ledger entry</button>}
                {entry.linkedTransaction && <><button className="text-button" onClick={() => onEditTransaction(entry.linkedTransaction!)}>View account entry</button>
                  <button className="text-button" disabled={busy} onClick={() => void updateLink(entry.linkedTransaction!, null)}><Unlink size={13} />Unlink</button></>}
              </div></td>
            </tr>)}</tbody></table>}
      </div>
    </div>
  );
}
