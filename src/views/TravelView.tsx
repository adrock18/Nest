import React, { useState, useMemo, useEffect, useCallback } from "react";
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Users, 
  Trash2, 
  Search, 
  Share2, 
  Check, 
  Waves, 
  Hotel, 
  UtensilsCrossed, 
  Plane, 
  Fuel, 
  ShoppingBag, 
  Ticket,
  Compass,
  ArrowRight,
  Pencil
} from "lucide-react";
import { Trip, TripExpense, TravelCategory } from "../types";
import { addPaise, formatPaiseToRupees } from "../utils/money";
import { 
  TRAVEL_CATEGORIES, 
  computeTravelSummary, 
  formatTripDateRange,
  calculateTripDays 
} from "../utils/travel";
import { AddTripModal } from "../components/AddTripModal";
import { AddTravelExpenseModal } from "../components/AddTravelExpenseModal";
import { TravelDashboard } from "../components/TravelDashboard";
import { formatMonthLabel } from "../utils/dates";
import { SPENDING_WORKSPACES, workspaceForTravelCategory, type WorkspaceId } from "../utils/workspaces";

interface TravelViewProps {
  trips: Trip[];
  tripExpenses: TripExpense[];
  month: string;
  onAddTrip: (trip: Omit<Trip, "id" | "createdAt">) => Promise<void>;
  onUpdateTrip: (trip: Trip) => Promise<void>;
  onDeleteTrip: (id: string) => void;
  onAddExpense: (expense: Omit<TripExpense, "id">) => Promise<void>;
  onUpdateExpense: (expense: TripExpense) => Promise<void>;
  onDeleteExpense: (id: string) => void;
  focusTrip: { tripId: string; expenseId?: string } | null;
  onNavigateToWorkspace: (workspaceId: WorkspaceId, month?: string) => void;
}

type SubTab = "overview" | "daily" | "split" | "ledger";

export const TravelView: React.FC<TravelViewProps> = ({
  trips,
  tripExpenses,
  month,
  onAddTrip,
  onUpdateTrip,
  onDeleteTrip,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  focusTrip,
  onNavigateToWorkspace
}) => {
  // Master-detail: the single trip whose detail is shown in the panel.
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  // The last trip the user explicitly chose (click/keyboard). Used to restore
  // the user's intent when a search filters out the selection and is cleared.
  const [lastExplicitlySelectedId, setLastExplicitlySelectedId] = useState<string | null>(null);
  // Refs to rail rows so keyboard navigation can move DOM focus with selection.
  const railRowRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  // Active subtab per trip (defaults to "overview")
  const [tripSubTabs, setTripSubTabs] = useState<Record<string, SubTab>>({});
  
  // Modal states
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [activeModalTrip, setActiveModalTrip] = useState<Trip | null>(null);
  const [editingExpense, setEditingExpense] = useState<TripExpense | null>(null);
  const [copiedTripId, setCopiedTripId] = useState<string | null>(null);

  // Search & filter query for trips
  const [searchQuery, setSearchQuery] = useState("");
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<string>("all");
  const [highlightedExpenseId, setHighlightedExpenseId] = useState<string | undefined>();
  const revealTrip = useCallback((tripId: string, expenseId?: string) => {
    setSearchQuery("");
    setLedgerSearchQuery("");
    setLedgerCategoryFilter("all");
    setHighlightedExpenseId(expenseId);
    setSelectedTripId(tripId);
    setLastExplicitlySelectedId(tripId);
    setTripSubTabs((prev) => ({ ...prev, [tripId]: expenseId ? "ledger" : "overview" }));
    return requestAnimationFrame(() => document.getElementById(`trip-detail-panel`)?.scrollIntoView({ block: "nearest" }));
  }, []);
  useEffect(() => {
    if (!focusTrip) return;
    const frame = revealTrip(focusTrip.tripId, focusTrip.expenseId);
    return () => cancelAnimationFrame(frame);
  }, [focusTrip, revealTrip]);

  const getSubTab = (tripId: string): SubTab => {
    return tripSubTabs[tripId] || "overview";
  };

  const setSubTab = (tripId: string, tab: SubTab) => {
    setTripSubTabs((prev) => ({
      ...prev,
      [tripId]: tab
    }));
  };

  const handleOpenAddExpense = (trip: Trip, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingExpense(null);
    setActiveModalTrip(trip);
  };

  const handleOpenEditExpense = (trip: Trip, expense: TripExpense, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingExpense(expense);
    setActiveModalTrip(trip);
  };

  const handleDeleteTripWithConfirm = (trip: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the trip "${trip.name}" and all its recorded expenses?`)) {
      onDeleteTrip(trip.id);
    }
  };

  // Copy WhatsApp Settlement Summary to clipboard
  const handleCopySettlement = (trip: Trip, summary: ReturnType<typeof computeTravelSummary>, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!summary) return;

    let text = `🏖️ *${trip.name}* (${trip.destination})\n`;
    text += `📅 ${formatTripDateRange(trip.startDate, trip.endDate)}\n`;
    text += `💰 Total Trip Spend: ${formatPaiseToRupees(summary.totalSpentPaise)}\n`;
    text += `📊 Daily Average: ${formatPaiseToRupees(summary.dailyAveragePaise)} / day\n\n`;

    text += `👥 *Individual Spending & Balances:*\n`;
    for (const b of summary.memberBalances) {
      const netStr = b.netPaise > 0 
        ? `gets back ${formatPaiseToRupees(b.netPaise)}` 
        : b.netPaise < 0 
          ? `owes ${formatPaiseToRupees(Math.abs(b.netPaise))}` 
          : `settled`;
      text += `• *${b.member}*: Paid ${formatPaiseToRupees(b.paidPaise)} | Share ${formatPaiseToRupees(b.sharePaise)} (${netStr})\n`;
    }

    if (summary.settlementDebts.length > 0) {
      text += `\n🤝 *Suggested Settlement Transfers:*\n`;
      for (const d of summary.settlementDebts) {
        text += `👉 *${d.from}* pays *${d.to}*: ${formatPaiseToRupees(d.amountPaise)}\n`;
      }
    } else {
      text += `\n✅ All companions are completely settled up!\n`;
    }

    text += `\n— Generated via Nest Personal Finance`;

    navigator.clipboard.writeText(text);
    setCopiedTripId(trip.id);
    setTimeout(() => setCopiedTripId(null), 2500);
  };

  const renderCategoryIcon = (cat: TravelCategory) => {
    // Each travel category carries its own accent colour in TRAVEL_CATEGORIES.
    // Tint the icon with that colour so category icons are visually distinct
    // (not bland white) and consistent across every place they render.
    const color = TRAVEL_CATEGORIES[cat].color;
    switch (cat) {
      case "activities": return <Waves size={14} color={color} />;
      case "stay": return <Hotel size={14} color={color} />;
      case "food": return <UtensilsCrossed size={14} color={color} />;
      case "transport": return <Plane size={14} color={color} />;
      case "fuel": return <Fuel size={14} color={color} />;
      case "shopping": return <ShoppingBag size={14} color={color} />;
      default: return <Ticket size={14} color={color} />;
    }
  };

  // Filter trips based on search
  const filteredTrips = useMemo(() => {
    if (!trips) return [];
    if (!searchQuery.trim()) return trips;
    const q = searchQuery.toLowerCase();
    return trips.filter((t) => 
      t.name.toLowerCase().includes(q) || 
      t.destination.toLowerCase().includes(q) ||
      (t.members || []).some((m) => m.toLowerCase().includes(q))
    );
  }, [trips, searchQuery]);

  // Resolve the trip whose detail is shown. Priority:
  //   1. the current explicit selection, when it survives the filter;
  //   2. the user's last explicitly-clicked trip, when it is present again
  //      (restores intent after a search filtered it out and was cleared);
  //   3. fall back to the first filtered trip.
  const selectedTrip = useMemo(() => {
    if (filteredTrips.length === 0) return null;
    return (
      filteredTrips.find((t) => t.id === selectedTripId) ||
      filteredTrips.find((t) => t.id === lastExplicitlySelectedId) ||
      filteredTrips[0]
    );
  }, [filteredTrips, selectedTripId, lastExplicitlySelectedId]);

  // Keep component state in sync so the highlighted rail row matches the detail
  // panel. This only writes the fallback selection, never the "explicit" intent.
  useEffect(() => {
    if (selectedTrip && selectedTrip.id !== selectedTripId) {
      setSelectedTripId(selectedTrip.id);
    }
  }, [selectedTrip, selectedTripId]);

  // A real user selection (click or keyboard). Records both the active selection
  // and the explicit intent used to reconcile selection across filter changes.
  const selectTripExplicitly = useCallback((tripId: string) => {
    setSelectedTripId(tripId);
    setLastExplicitlySelectedId(tripId);
  }, []);

  // Arrow-key navigation within the rail. Up/Down (and Left/Right in the narrow
  // chip layout) move selection to the previous/next trip in filtered order and
  // move DOM focus to that row. Enter/Space select the focused row.
  const handleRailKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const { key } = event;
      if (key === "Enter" || key === " ") {
        event.preventDefault();
        selectTripExplicitly(filteredTrips[index].id);
        return;
      }
      let nextIndex: number | null = null;
      if (key === "ArrowDown" || key === "ArrowRight") nextIndex = index + 1;
      else if (key === "ArrowUp" || key === "ArrowLeft") nextIndex = index - 1;
      if (nextIndex === null) return;
      if (nextIndex < 0 || nextIndex >= filteredTrips.length) return;
      event.preventDefault();
      const nextTrip = filteredTrips[nextIndex];
      selectTripExplicitly(nextTrip.id);
      railRowRefs.current[nextTrip.id]?.focus();
    },
    [filteredTrips, selectTripExplicitly]
  );

  return (
    <div className="view-content-wrapper travel-workspace">
      {/* 1. Header Toolbar */}
      <div className="travel-toolbar">
        <div className="travel-toolbar-identity">
          <div className="travel-toolbar-icon">
            <Compass size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="travel-toolbar-title">
              Travel
            </h1>
            <p className="travel-toolbar-subtitle">
              {formatMonthLabel(month)} · Personal shares, group bills, and trip budgets
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="travel-toolbar-actions">
          {/* Quick Search */}
          {trips.length > 1 && (
            <div className="travel-trip-search">
              <Search size={14} className="travel-search-icon" />
              <input 
                type="text"
                placeholder="Search trips..."
                aria-label="Search trips"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="travel-search-input"
              />
            </div>
          )}

          <button 
            id="btn-create-trip"
            className="btn-primary travel-toolbar-create"
            onClick={() => setIsAddTripModalOpen(true)}
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Create New Trip</span>
          </button>
        </div>
      </div>

      <TravelDashboard trips={trips} expenses={tripExpenses} month={month} onOpenTrip={revealTrip} onNavigateToWorkspace={onNavigateToWorkspace} />
      <section className="panel-card travel-connections">
        <div className="panel-header"><h2 className="panel-title">Travel spending, connected</h2><span className="panel-caption">Your share, counted once</span></div>
        <p className="panel-note">Meals, transport, stays, and shopping also appear in their category dashboard. Open a category to link an existing account payment without duplicating personal spending.</p>
        <div className="toolbar-actions">
          {SPENDING_WORKSPACES.filter((workspace) => workspace.travelCategories.length > 0).map((workspace) =>
            <button key={workspace.id} className="btn-secondary" onClick={() => onNavigateToWorkspace(workspace.id, month)}>{workspace.title}<ArrowRight size={14} /></button>)}
        </div>
      </section>
      <div className="panel-header"><h2 className="panel-title">Your trips</h2><span className="panel-caption">{trips.length} trips · Full history, independent of month</span></div>
      {trips.length > 0 && filteredTrips.length === 0 && <div className="empty-state"><h3>No matching trips</h3><p>Change the trip search to see your trips. Dashboard totals above are not filtered by search.</p></div>}

      {/* 2. Empty State */}
      {(!trips || trips.length === 0) ? (
        <div className="travel-empty">
          <div className="travel-empty-icon">
            <Compass size={28} />
          </div>
          <h2 className="travel-empty-title">
            No Trips Recorded Yet
          </h2>
          <p className="travel-empty-text">
            Create a trip to track vacation spending, daily budgets, rides & activities, fuel costs, and companion split settlements.
          </p>
          <button 
            className="btn-primary" 
            onClick={() => setIsAddTripModalOpen(true)}
            style={{ padding: "10px 22px" }}
          >
            <Plus size={16} />
            <span>Create Your First Trip</span>
          </button>
        </div>
      ) : filteredTrips.length === 0 ? null : (
        /* 3. Master-Detail Trips Layout (sticky rail + single detail panel) */
        <div className="travel-master-detail">
          {/* MASTER: compact trip rail (sticky on wide) + chip bar (sticky on narrow) */}
          <nav className="travel-trip-rail" aria-label="Your trips">
            <div className="travel-rail-list">
              {filteredTrips.map((trip, index) => {
                const tripExpList = (tripExpenses || []).filter((e) => e.tripId === trip.id);
                const summary = computeTravelSummary(trip, tripExpList, "Me");
                const themeColor = trip.coverColor || "#06b6d4";
                const isSelected = selectedTrip?.id === trip.id;
                const budgetPct = Math.min(summary.budgetUsedPct, 100);
                return (
                  <button
                    key={trip.id}
                    type="button"
                    ref={(el) => { railRowRefs.current[trip.id] = el; }}
                    className={`travel-rail-row${isSelected ? " is-selected" : ""}`}
                    onClick={() => selectTripExplicitly(trip.id)}
                    onKeyDown={(e) => handleRailKeyDown(e, index)}
                    aria-pressed={isSelected}
                    style={{ borderLeft: `4px solid ${themeColor}`, ["--rail-accent" as string]: themeColor }}
                  >
                    <div className="travel-rail-row-main">
                      <span className="travel-rail-name">{trip.name}</span>
                      <span className="travel-rail-total font-mono">{formatPaiseToRupees(summary.totalSpentPaise)}</span>
                    </div>
                    <div className="travel-rail-dates">{formatTripDateRange(trip.startDate, trip.endDate)}</div>
                    {trip.budgetPaise > 0 && (
                      <div className="travel-rail-budget-track">
                        <div
                          className="travel-rail-budget-bar"
                          style={{ width: `${budgetPct}%`, background: themeColor }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* DETAIL: the selected trip's hero KPIs + subtabs */}
          {selectedTrip && (() => {
            const trip = selectedTrip;
            const tripExpList = (tripExpenses || []).filter((e) => e.tripId === trip.id);
            const summary = computeTravelSummary(trip, tripExpList, "Me");
            const daysCount = calculateTripDays(trip.startDate, trip.endDate);
            const subTab = getSubTab(trip.id);
            const themeColor = trip.coverColor || "#06b6d4";

            // Filtered expenses for ledger subtab
            const ledgerExpenses = tripExpList.filter((e) => {
              if (ledgerCategoryFilter !== "all" && e.category !== ledgerCategoryFilter) return false;
              if (ledgerSearchQuery.trim()) {
                const q = ledgerSearchQuery.toLowerCase();
                const matchTitle = (e.title || "").toLowerCase().includes(q);
                const matchNotes = (e.notes || "").toLowerCase().includes(q);
                const matchPayer = (e.paidBy || "").toLowerCase().includes(q);
                if (!matchTitle && !matchNotes && !matchPayer) return false;
              }
              return true;
            });

            return (
              <div
                id="trip-detail-panel"
                className="travel-trip-detail"
                style={{
                  background: "var(--bg-surface)",
                  border: `1px solid ${themeColor}55`,
                  borderRadius: "14px"
                }}
              >
                {/* Detail Header Bar */}
                <div
                  className="travel-trip-header travel-detail-header"
                  style={{
                    background: "var(--bg-card)",
                    borderLeft: `5px solid ${themeColor}`
                  }}
                >
                  {/* Left: Trip Name, Location, Dates, Companions */}
                  <div className="travel-trip-header-left">
                    <div className="travel-trip-title-row">
                      <h3 className="travel-trip-title">
                        {trip.name}
                      </h3>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: `${themeColor}22`,
                        color: themeColor,
                        border: `1px solid ${themeColor}44`
                      }}>
                        {daysCount} {daysCount === 1 ? "Day" : "Days"}
                      </span>
                    </div>

                    <div className="travel-trip-meta">
                      <span className="travel-trip-meta-item">
                        <MapPin size={13} color={themeColor} />
                        <strong style={{ color: "var(--text-main)" }}>{trip.destination}</strong>
                      </span>
                      <span>•</span>
                      <span className="travel-trip-meta-item">
                        <Calendar size={13} color="var(--text-muted)" />
                        {formatTripDateRange(trip.startDate, trip.endDate)}
                      </span>
                      <span>•</span>
                      <span className="travel-trip-meta-item">
                        <Users size={13} color="var(--text-muted)" />
                        {trip.members.length} {trip.members.length === 1 ? "Person" : "Companions"}
                      </span>
                    </div>
                  </div>

                  {/* Right: Total Spending & Actions */}
                  <div className="travel-trip-header-right">
                    {/* Total Spending Metric Block */}
                    <div className="travel-trip-total">
                      <div className="travel-trip-total-label">
                        Total Spending
                      </div>
                      <div className="travel-trip-total-value">
                        {formatPaiseToRupees(summary.totalSpentPaise)}
                      </div>
                      <div className="travel-trip-total-sub">
                        {summary.budgetUsedPct > 0 
                          ? `${summary.budgetUsedPct}% of budget` 
                          : `${formatPaiseToRupees(summary.dailyAveragePaise)} / day`}
                      </div>
                    </div>

                    {/* Quick Add Expense Button */}
                    <button
                      type="button"
                      className="btn-secondary travel-trip-action-btn"
                      onClick={(e) => handleOpenAddExpense(trip, e)}
                      title="Add an expense to this trip"
                    >
                      <Plus size={14} />
                      <span>Expense</span>
                    </button>

                    {/* Edit Trip Button */}
                    <button
                      type="button"
                      className="btn-secondary travel-trip-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTrip(trip);
                      }}
                      title="Edit trip details (destination, dates, budget, companions)"
                    >
                      <Pencil size={13} />
                      <span>Edit</span>
                    </button>

                    {/* Delete Trip */}
                    <button
                      type="button"
                      className="travel-icon-btn"
                      onClick={(e) => handleDeleteTripWithConfirm(trip, e)}
                      title="Delete trip"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Detailed Workspace for this Trip */}
                <div className="travel-trip-body">
                    {/* 4 Hero KPI Cards */}
                    <div className="travel-kpi-grid">
                      {/* Card 1: Total Spent */}
                      <div className="metric-card" style={{ padding: "14px 16px" }}>
                        <div className="metric-header">
                          <span className="metric-label">Total Spend</span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {tripExpList.length} expenses
                          </span>
                        </div>
                        <div className="metric-value font-mono" style={{ color: "var(--text-main)", fontSize: "20px" }}>
                          {formatPaiseToRupees(summary.totalSpentPaise)}
                        </div>
                        <div className="metric-subtext">
                          {trip.budgetPaise > 0 
                            ? `Budget: ${formatPaiseToRupees(trip.budgetPaise)} (${summary.budgetUsedPct}%)` 
                            : "No budget cap set"}
                        </div>
                      </div>

                      {/* Card 2: Daily Average */}
                      <div className="metric-card" style={{ padding: "14px 16px" }}>
                        <div className="metric-header">
                          <span className="metric-label">Daily Average</span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            Across {daysCount} days
                          </span>
                        </div>
                        <div className="metric-value font-mono" style={{ color: "#06b6d4", fontSize: "20px" }}>
                          {formatPaiseToRupees(summary.dailyAveragePaise)}
                        </div>
                        <div className="metric-subtext">Avg per calendar day</div>
                      </div>

                      {/* Card 3: Out-of-Pocket Share */}
                      <div className="metric-card" style={{ padding: "14px 16px" }}>
                        <div className="metric-header">
                          <span className="metric-label">My Fair Share</span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Your portion</span>
                        </div>
                        <div className="metric-value font-mono" style={{ color: "var(--text-main)", fontSize: "20px" }}>
                          {formatPaiseToRupees(summary.myTotalSpentPaise)}
                        </div>
                        <div className="metric-subtext">What you personally consumed</div>
                      </div>

                      {/* Card 4: Split Balance */}
                      <div className="metric-card" style={{ padding: "14px 16px" }}>
                        {(() => {
                          const myBalance = summary.memberBalances.find((b) => b.member === "Me");
                          const net = myBalance?.netPaise || 0;
                          const isOwed = net > 0;
                          const owes = net < 0;
                          return (
                            <>
                              <div className="metric-header">
                                <span className="metric-label">Split Balance</span>
                                <span style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: isOwed ? "var(--income-emerald)" : owes ? "var(--expense-rose)" : "var(--text-muted)"
                                }}>
                                  {isOwed ? "Owed Back" : owes ? "You Owe" : "Settled"}
                                </span>
                              </div>
                              <div className="metric-value font-mono" style={{ 
                                color: isOwed ? "var(--income-emerald)" : owes ? "var(--expense-rose)" : "var(--text-main)",
                                fontSize: "20px"
                              }}>
                                {isOwed ? `+${formatPaiseToRupees(net)}` : owes ? `−${formatPaiseToRupees(Math.abs(net))}` : "₹0.00"}
                              </div>
                              <div className="metric-subtext">
                                {isOwed ? "Group owes you back" : owes ? "You owe group members" : "All even"}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Subtab Navigation Bar */}
                    <div className="travel-subtab-nav">
                      <div className="travel-subtab-tabs">
                        <button
                          type="button"
                          className="travel-subtab-btn"
                          onClick={() => setSubTab(trip.id, "overview")}
                          style={{
                            borderBottom: subTab === "overview" ? `2px solid ${themeColor}` : "2px solid transparent",
                            color: subTab === "overview" ? "var(--text-main)" : "var(--text-muted)"
                          }}
                        >
                          Overview & Categories
                        </button>
                        <button
                          type="button"
                          className="travel-subtab-btn"
                          onClick={() => setSubTab(trip.id, "daily")}
                          style={{
                            borderBottom: subTab === "daily" ? `2px solid ${themeColor}` : "2px solid transparent",
                            color: subTab === "daily" ? "var(--text-main)" : "var(--text-muted)"
                          }}
                        >
                          Daily Timeline
                        </button>
                        <button
                          type="button"
                          className="travel-subtab-btn"
                          onClick={() => setSubTab(trip.id, "split")}
                          style={{
                            borderBottom: subTab === "split" ? `2px solid ${themeColor}` : "2px solid transparent",
                            color: subTab === "split" ? "var(--text-main)" : "var(--text-muted)"
                          }}
                        >
                          Split & Debts
                        </button>
                        <button
                          type="button"
                          className="travel-subtab-btn"
                          onClick={() => setSubTab(trip.id, "ledger")}
                          style={{
                            borderBottom: subTab === "ledger" ? `2px solid ${themeColor}` : "2px solid transparent",
                            color: subTab === "ledger" ? "var(--text-main)" : "var(--text-muted)"
                          }}
                        >
                          All Expenses ({tripExpList.length})
                        </button>
                      </div>

                      {/* Right Subtab Actions */}
                      <div className="travel-subtab-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTrip(trip);
                          }}
                          style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}
                          title="Edit trip details"
                        >
                          <Pencil size={13} />
                          <span>Edit Details</span>
                        </button>

                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={(e) => handleCopySettlement(trip, summary, e)}
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                          title="Copy WhatsApp formatted summary"
                        >
                          {copiedTripId === trip.id ? (
                            <>
                              <Check size={13} color="var(--income-emerald)" />
                              <span style={{ color: "var(--income-emerald)" }}>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Share2 size={13} />
                              <span>Copy WhatsApp Report</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className="btn-primary"
                          onClick={(e) => handleOpenAddExpense(trip, e)}
                          style={{ padding: "6px 14px", fontSize: "12px", background: themeColor, borderColor: themeColor }}
                        >
                          <Plus size={14} />
                          <span>Add Expense</span>
                        </button>
                      </div>
                    </div>

                    {/* Subtab Content 1: Overview & Categories */}
                    {subTab === "overview" && (
                      <div className="travel-grid-2">
                        {/* Category Spend Distribution */}
                        <div className="travel-inner-card">
                          <h4 className="travel-inner-card-title">
                            Spending by Category
                          </h4>
                          <div className="travel-stack">
                            {summary.categoryBreakdown.map((item) => (
                              <div key={item.category}>
                                <div className="travel-cat-row-header">
                                  <span className="travel-cat-row-label">
                                    {renderCategoryIcon(item.category)}
                                    {item.label}
                                  </span>
                                  <span className="font-mono" style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                    {formatPaiseToRupees(item.spentPaise)} ({item.pct}%)
                                  </span>
                                </div>
                                <div className="travel-cat-track">
                                  <div className="travel-cat-bar" style={{ width: `${item.pct}%`, background: item.color }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Trip Companions & Summary */}
                        <div className="travel-inner-card">
                          <h4 className="travel-inner-card-title">
                            Trip Companions & Activity
                          </h4>
                          <div className="travel-stack-tight">
                            {summary.memberBalances.map((m) => (
                              <div key={m.member} className="travel-member-row">
                                <span className="travel-member-name">
                                  {m.member === "Me" ? "👤 Me (You)" : m.member}
                                </span>
                                <div style={{ textAlign: "right" }}>
                                  <span className="font-mono travel-member-paid">
                                    Paid {formatPaiseToRupees(m.paidPaise)}
                                  </span>
                                  <div className="travel-member-share">
                                    Share: {formatPaiseToRupees(m.sharePaise)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Subtab Content 2: Daily Spending Timeline */}
                    {subTab === "daily" && (
                      <div className="travel-stack-tight">
                        {summary.perDaySpending.length === 0 ? (
                          <div className="travel-day-empty">
                            No daily expenses logged yet.
                          </div>
                        ) : (
                          summary.perDaySpending.map((day) => (
                            <div key={day.date} className="travel-day-row">
                              <div>
                                <span className="travel-day-badge" style={{
                                  color: themeColor,
                                  background: `${themeColor}15`
                                }}>
                                  Day {day.dayIndex}
                                </span>
                                <strong className="travel-day-date">
                                  {day.date}
                                </strong>
                                <span className="travel-day-count">
                                  ({day.count} {day.count === 1 ? "expense" : "expenses"})
                                </span>
                              </div>
                              <div className="font-mono travel-day-total">
                                {formatPaiseToRupees(day.totalPaise)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Subtab Content 3: Split & Debts */}
                    {subTab === "split" && (
                      <div className="travel-grid-2-wide">
                        {/* Member Balances */}
                        <div className="travel-inner-card">
                          <h4 className="travel-inner-card-title" style={{ marginBottom: "12px" }}>
                            Net Balances
                          </h4>
                          <div className="travel-stack-tight">
                            {summary.memberBalances.map((b) => {
                              const isPositive = b.netPaise > 0;
                              const isNegative = b.netPaise < 0;
                              return (
                                <div key={b.member} className="travel-balance-row">
                                  <div>
                                    <strong className="travel-balance-name">
                                      {b.member === "Me" ? "👤 Me" : b.member}
                                    </strong>
                                    <div className="travel-balance-sub">
                                      Paid: {formatPaiseToRupees(b.paidPaise)} | Share: {formatPaiseToRupees(b.sharePaise)}
                                    </div>
                                  </div>
                                  <div className="font-mono travel-balance-net" style={{
                                    color: isPositive ? "var(--income-emerald)" : isNegative ? "var(--expense-rose)" : "var(--text-muted)"
                                  }}>
                                    {isPositive ? `Gets +${formatPaiseToRupees(b.netPaise)}` : isNegative ? `Owes −${formatPaiseToRupees(Math.abs(b.netPaise))}` : "Settled"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Suggested Settlement Transfers */}
                        <div className="travel-inner-card">
                          <h4 className="travel-inner-card-title" style={{ marginBottom: "12px" }}>
                            Suggested Settlement Transfers
                          </h4>
                          {summary.settlementDebts.length === 0 ? (
                            <div className="travel-settled-note">
                              ✅ All trip companions are completely settled!
                            </div>
                          ) : (
                            <div className="travel-stack-tight">
                              {summary.settlementDebts.map((d, idx) => (
                                <div key={idx} className="travel-settle-row">
                                  <div className="travel-settle-parties">
                                    <strong className="travel-settle-party">{d.from}</strong>
                                    <ArrowRight size={13} color="var(--text-muted)" />
                                    <strong className="travel-settle-party">{d.to}</strong>
                                  </div>
                                  <div className="font-mono travel-settle-amount">
                                    {formatPaiseToRupees(d.amountPaise)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Subtab Content 4: All Expenses Ledger */}
                    {subTab === "ledger" && (
                      <div>
                        {/* Ledger Search & Filter */}
                        <div className="travel-ledger-toolbar">
                          <div className="travel-ledger-filters">
                            <input 
                              type="text"
                              placeholder="Search this trip's expenses..."
                              value={ledgerSearchQuery}
                              onChange={(e) => setLedgerSearchQuery(e.target.value)}
                              className="travel-ledger-search"
                            />
                            <select
                              value={ledgerCategoryFilter}
                              onChange={(e) => setLedgerCategoryFilter(e.target.value)}
                              className="travel-ledger-select"
                            >
                              <option value="all">All Categories</option>
                              {(Object.keys(TRAVEL_CATEGORIES) as TravelCategory[]).map((cat) => (
                                <option key={cat} value={cat}>{TRAVEL_CATEGORIES[cat].label}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            className="btn-primary"
                            onClick={(e) => handleOpenAddExpense(trip, e)}
                            style={{ padding: "6px 14px", fontSize: "12px" }}
                          >
                            <Plus size={14} />
                            <span>Add Expense</span>
                          </button>
                        </div>

                        {/* Table */}
                        {ledgerExpenses.length === 0 ? (
                          <div className="travel-ledger-empty">
                            No expenses found matching the criteria.
                          </div>
                        ) : (
                          <div className="travel-ledger-scroll">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Expense Title</th>
                                  <th>Category</th>
                                  <th>Paid By</th>
                                  <th>Split</th>
                                  <th>My Share</th>
                                  <th>Total Amount</th>
                                  <th style={{ textAlign: "right" }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ledgerExpenses.map((exp) => {
                                  const catMeta = TRAVEL_CATEGORIES[exp.category];
                                  const workspaceId = workspaceForTravelCategory(exp.category);
                                  return (
                                    <tr key={exp.id} className={highlightedExpenseId === exp.id ? "source-highlight" : undefined}>
                                      <td className="font-mono" style={{ fontSize: "12px" }}>{exp.date}</td>
                                      <td>
                                        <div className="travel-ledger-title">{exp.title}</div>
                                        {exp.notes && (
                                          <div className="travel-ledger-notes">{exp.notes}</div>
                                        )}
                                      </td>
                                      <td>
                                        <span className="travel-cat-chip" style={{
                                          background: catMeta.bgColor,
                                          color: catMeta.color
                                        }}>
                                          {renderCategoryIcon(exp.category)}
                                          {catMeta.label}
                                        </span>
                                        {workspaceId && <button className="text-button" onClick={() => onNavigateToWorkspace(workspaceId, exp.date.slice(0, 7))}>
                                          Open {SPENDING_WORKSPACES.find((workspace) => workspace.id === workspaceId)!.title}
                                        </button>}
                                      </td>
                                      <td style={{ fontSize: "12.5px" }}>{exp.paidBy}</td>
                                      <td style={{ fontSize: "12px", textTransform: "capitalize", color: "var(--text-secondary)" }}>
                                        {exp.splitType}
                                      </td>
                                      <td className="font-mono" style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                        {formatPaiseToRupees(exp.mySharePaise)}
                                      </td>
                                      <td className="font-mono" style={{ fontWeight: 700, color: "var(--income-emerald)" }}>
                                        {formatPaiseToRupees(exp.amountPaise)}
                                      </td>
                                      <td style={{ textAlign: "right" }}>
                                        <button
                                          type="button"
                                          className="travel-ledger-icon-btn"
                                          onClick={(e) => handleOpenEditExpense(trip, exp, e)}
                                          style={{ marginRight: "2px" }}
                                          title="Edit expense"
                                        >
                                          <Pencil size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          className="travel-ledger-icon-btn"
                                          onClick={() => onDeleteExpense(exp.id)}
                                          title="Delete expense"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="travel-ledger-total-row">
                                  <td colSpan={5} className="travel-ledger-total-label">
                                    Totals · {ledgerExpenses.length} {ledgerExpenses.length === 1 ? "expense" : "expenses"}
                                  </td>
                                  <td className="font-mono travel-ledger-total-share">
                                    {formatPaiseToRupees(ledgerExpenses.reduce((acc, e) => addPaise(acc, e.mySharePaise), 0))}
                                  </td>
                                  <td className="font-mono travel-ledger-total-amount">
                                    {formatPaiseToRupees(ledgerExpenses.reduce((acc, e) => addPaise(acc, e.amountPaise), 0))}
                                  </td>
                                  <td aria-hidden="true" />
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Add / Edit Trip Modal */}
      <AddTripModal 
        isOpen={isAddTripModalOpen || !!editingTrip}
        initialTrip={editingTrip}
        onClose={() => {
          setIsAddTripModalOpen(false);
          setEditingTrip(null);
        }}
        onAddTrip={onAddTrip}
        onUpdateTrip={onUpdateTrip}
      />

      {/* Add / Edit Travel Expense Modal */}
      {activeModalTrip && (
        <AddTravelExpenseModal 
          isOpen={!!activeModalTrip}
          onClose={() => { setActiveModalTrip(null); setEditingExpense(null); }}
          activeTrip={activeModalTrip}
          onAddExpense={onAddExpense}
          initialExpense={editingExpense}
          onUpdateExpense={onUpdateExpense}
        />
      )}
    </div>
  );
};
