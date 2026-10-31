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
  ChevronDown,
  ChevronUp,
  Compass,
  ArrowRight,
  Pencil
} from "lucide-react";
import { Trip, TripExpense, TravelCategory } from "../types";
import { formatPaiseToRupees } from "../utils/money";
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
  onDeleteExpense,
  focusTrip,
  onNavigateToWorkspace
}) => {
  // Each trip is collapsed initially as requested!
  const [expandedTripIds, setExpandedTripIds] = useState<Record<string, boolean>>({});
  
  // Active subtab per trip (defaults to "overview")
  const [tripSubTabs, setTripSubTabs] = useState<Record<string, SubTab>>({});
  
  // Modal states
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [activeModalTrip, setActiveModalTrip] = useState<Trip | null>(null);
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
    setExpandedTripIds((prev) => ({ ...prev, [tripId]: true }));
    setTripSubTabs((prev) => ({ ...prev, [tripId]: expenseId ? "ledger" : "overview" }));
    return requestAnimationFrame(() => document.getElementById(`trip-card-${tripId}`)?.scrollIntoView({ block: "start" }));
  }, []);
  useEffect(() => {
    if (!focusTrip) return;
    const frame = revealTrip(focusTrip.tripId, focusTrip.expenseId);
    return () => cancelAnimationFrame(frame);
  }, [focusTrip, revealTrip]);

  const toggleTripExpand = (tripId: string) => {
    setExpandedTripIds((prev) => ({
      ...prev,
      [tripId]: !prev[tripId]
    }));
  };

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
    switch (cat) {
      case "activities": return <Waves size={14} />;
      case "stay": return <Hotel size={14} />;
      case "food": return <UtensilsCrossed size={14} />;
      case "transport": return <Plane size={14} />;
      case "fuel": return <Fuel size={14} />;
      case "shopping": return <ShoppingBag size={14} />;
      default: return <Ticket size={14} />;
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

  return (
    <div className="view-content-wrapper travel-workspace">
      {/* 1. Header Toolbar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "14px",
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "rgba(6, 182, 212, 0.12)",
            border: "1px solid rgba(6, 182, 212, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#06b6d4"
          }}>
            <Compass size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", margin: 0, lineHeight: 1.2 }}>
              Travel Expenses
            </h1>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: "3px 0 0", lineHeight: 1.2 }}>
              {formatMonthLabel(month)} · Personal shares, group bills, and trip budgets
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Quick Search */}
          {trips.length > 1 && (
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                type="text"
                placeholder="Search trips..."
                aria-label="Search trips"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "7px 12px 7px 30px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "8px",
                  color: "var(--text-main)",
                  fontSize: "12.5px",
                  outline: "none",
                  width: "180px"
                }}
              />
            </div>
          )}

          <button 
            id="btn-create-trip"
            className="btn-primary"
            onClick={() => setIsAddTripModalOpen(true)}
            style={{
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "7px"
            }}
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
        <div style={{
          padding: "60px 24px",
          textAlign: "center",
          background: "var(--bg-card)",
          borderRadius: "16px",
          border: "1px dashed var(--border-medium)",
          maxWidth: "580px",
          margin: "40px auto"
        }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(6, 182, 212, 0.12)",
            color: "#06b6d4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <Compass size={28} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px" }}>
            No Trips Recorded Yet
          </h2>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: "22px", lineHeight: "1.6" }}>
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
      ) : (
        /* 3. Collapsible Accordion Trips List */
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredTrips.map((trip) => {
            const isExpanded = !!expandedTripIds[trip.id];
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
                key={trip.id}
                id={`trip-card-${trip.id}`}
                style={{
                  background: "var(--bg-surface)",
                  border: isExpanded ? `1px solid ${themeColor}55` : "1px solid var(--border-medium)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  boxShadow: isExpanded 
                    ? "0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)" 
                    : "0 2px 8px rgba(0, 0, 0, 0.2)",
                  transition: "all 0.2s ease"
                }}
              >
                {/* Collapsed Header Bar (Always Visible, Clickable) */}
                <div 
                  onClick={() => toggleTripExpand(trip.id)}
                  style={{
                    padding: "16px 20px",
                    background: isExpanded ? "var(--bg-card)" : "var(--bg-surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    userSelect: "none",
                    borderLeft: `5px solid ${themeColor}`,
                    flexWrap: "wrap",
                    gap: "16px",
                    transition: "background 0.15s ease"
                  }}
                >
                  {/* Left: Trip Name, Location, Dates, Companions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "260px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h3 style={{ fontSize: "16.5px", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
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

                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "12.5px", color: "var(--text-secondary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={13} color={themeColor} />
                        <strong style={{ color: "var(--text-main)" }}>{trip.destination}</strong>
                      </span>
                      <span>•</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        {formatTripDateRange(trip.startDate, trip.endDate)}
                      </span>
                      <span>•</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Users size={13} color="var(--text-muted)" />
                        {trip.members.length} {trip.members.length === 1 ? "Person" : "Companions"}
                      </span>
                    </div>
                  </div>

                  {/* Right: Total Spending, Actions & Expand Chevron */}
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    {/* Total Spending Metric Block */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Total Spending
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--income-emerald)", fontFamily: "var(--font-mono)" }}>
                        {formatPaiseToRupees(summary.totalSpentPaise)}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {summary.budgetUsedPct > 0 
                          ? `${summary.budgetUsedPct}% of budget` 
                          : `${formatPaiseToRupees(summary.dailyAveragePaise)} / day`}
                      </div>
                    </div>

                    {/* Quick Add Expense Button */}
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={(e) => handleOpenAddExpense(trip, e)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                      title="Add an expense to this trip"
                    >
                      <Plus size={14} />
                      <span>Expense</span>
                    </button>

                    {/* Edit Trip Button */}
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTrip(trip);
                      }}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                      title="Edit trip details (destination, dates, budget, companions)"
                    >
                      <Pencil size={13} />
                      <span>Edit</span>
                    </button>

                    {/* Delete Trip */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTripWithConfirm(trip, e)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "6px",
                        borderRadius: "6px"
                      }}
                      title="Delete trip"
                    >
                      <Trash2 size={15} />
                    </button>

                    {/* Expand/Collapse Chevron Indicator */}
                    <div style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      background: isExpanded ? "var(--bg-surface-hover)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isExpanded ? "var(--text-main)" : "var(--text-muted)",
                      transition: "transform 0.2s ease"
                    }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Workspace for this Trip */}
                {isExpanded && (
                  <div style={{
                    padding: "20px 24px",
                    borderTop: "1px solid var(--border-subtle)",
                    background: "var(--bg-surface)"
                  }}>
                    {/* 4 Hero KPI Cards */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "14px",
                      marginBottom: "20px"
                    }}>
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
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid var(--border-medium)",
                      marginBottom: "18px",
                      flexWrap: "wrap",
                      gap: "10px"
                    }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => setSubTab(trip.id, "overview")}
                          style={{
                            padding: "8px 14px",
                            fontSize: "13px",
                            fontWeight: 600,
                            background: "transparent",
                            border: "none",
                            borderBottom: subTab === "overview" ? `2px solid ${themeColor}` : "2px solid transparent",
                            color: subTab === "overview" ? "var(--text-main)" : "var(--text-muted)",
                            cursor: "pointer"
                          }}
                        >
                          Overview & Categories
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubTab(trip.id, "daily")}
                          style={{
                            padding: "8px 14px",
                            fontSize: "13px",
                            fontWeight: 600,
                            background: "transparent",
                            border: "none",
                            borderBottom: subTab === "daily" ? `2px solid ${themeColor}` : "2px solid transparent",
                            color: subTab === "daily" ? "var(--text-main)" : "var(--text-muted)",
                            cursor: "pointer"
                          }}
                        >
                          Daily Timeline
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubTab(trip.id, "split")}
                          style={{
                            padding: "8px 14px",
                            fontSize: "13px",
                            fontWeight: 600,
                            background: "transparent",
                            border: "none",
                            borderBottom: subTab === "split" ? `2px solid ${themeColor}` : "2px solid transparent",
                            color: subTab === "split" ? "var(--text-main)" : "var(--text-muted)",
                            cursor: "pointer"
                          }}
                        >
                          Split & Debts
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubTab(trip.id, "ledger")}
                          style={{
                            padding: "8px 14px",
                            fontSize: "13px",
                            fontWeight: 600,
                            background: "transparent",
                            border: "none",
                            borderBottom: subTab === "ledger" ? `2px solid ${themeColor}` : "2px solid transparent",
                            color: subTab === "ledger" ? "var(--text-main)" : "var(--text-muted)",
                            cursor: "pointer"
                          }}
                        >
                          All Expenses ({tripExpList.length})
                        </button>
                      </div>

                      {/* Right Subtab Actions */}
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                          <span>+ Add Expense</span>
                        </button>
                      </div>
                    </div>

                    {/* Subtab Content 1: Overview & Categories */}
                    {subTab === "overview" && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                        {/* Category Spend Distribution */}
                        <div style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "12px",
                          padding: "16px 20px"
                        }}>
                          <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "14px" }}>
                            Spending by Category
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {summary.categoryBreakdown.map((item) => (
                              <div key={item.category}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
                                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)" }}>
                                    {renderCategoryIcon(item.category)}
                                    {item.label}
                                  </span>
                                  <span className="font-mono" style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                    {formatPaiseToRupees(item.spentPaise)} ({item.pct}%)
                                  </span>
                                </div>
                                <div style={{ width: "100%", height: "6px", background: "var(--bg-surface)", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ width: `${item.pct}%`, height: "100%", background: item.color, borderRadius: "3px" }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Trip Companions & Summary */}
                        <div style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "12px",
                          padding: "16px 20px"
                        }}>
                          <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "14px" }}>
                            Trip Companions & Activity
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {summary.memberBalances.map((m) => (
                              <div key={m.member} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 12px",
                                background: "var(--bg-surface)",
                                borderRadius: "8px",
                                fontSize: "12.5px"
                              }}>
                                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                  {m.member === "Me" ? "👤 Me (You)" : m.member}
                                </span>
                                <div style={{ textAlign: "right" }}>
                                  <span className="font-mono" style={{ color: "var(--text-main)", fontWeight: 600 }}>
                                    Paid {formatPaiseToRupees(m.paidPaise)}
                                  </span>
                                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
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
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {summary.perDaySpending.length === 0 ? (
                          <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                            No daily expenses logged yet.
                          </div>
                        ) : (
                          summary.perDaySpending.map((day) => (
                            <div 
                              key={day.date}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px 16px",
                                background: "var(--bg-card)",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: "10px"
                              }}
                            >
                              <div>
                                <span style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: themeColor,
                                  background: `${themeColor}15`,
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  marginRight: "10px"
                                }}>
                                  Day {day.dayIndex}
                                </span>
                                <strong style={{ fontSize: "13.5px", color: "var(--text-main)" }}>
                                  {day.date}
                                </strong>
                                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "10px" }}>
                                  ({day.count} {day.count === 1 ? "expense" : "expenses"})
                                </span>
                              </div>
                              <div className="font-mono" style={{ fontSize: "15px", fontWeight: 700, color: "var(--income-emerald)" }}>
                                {formatPaiseToRupees(day.totalPaise)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Subtab Content 3: Split & Debts */}
                    {subTab === "split" && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                        {/* Member Balances */}
                        <div style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "12px",
                          padding: "16px 20px"
                        }}>
                          <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                            Net Balances
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {summary.memberBalances.map((b) => {
                              const isPositive = b.netPaise > 0;
                              const isNegative = b.netPaise < 0;
                              return (
                                <div key={b.member} style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "10px 12px",
                                  background: "var(--bg-surface)",
                                  borderRadius: "8px"
                                }}>
                                  <div>
                                    <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>
                                      {b.member === "Me" ? "👤 Me" : b.member}
                                    </strong>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                      Paid: {formatPaiseToRupees(b.paidPaise)} | Share: {formatPaiseToRupees(b.sharePaise)}
                                    </div>
                                  </div>
                                  <div className="font-mono" style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
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
                        <div style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "12px",
                          padding: "16px 20px"
                        }}>
                          <h4 style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                            Suggested Settlement Transfers
                          </h4>
                          {summary.settlementDebts.length === 0 ? (
                            <div style={{ padding: "24px", textAlign: "center", color: "var(--income-emerald)", fontSize: "13px" }}>
                              ✅ All trip companions are completely settled!
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                              {summary.settlementDebts.map((d, idx) => (
                                <div key={idx} style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "10px 12px",
                                  background: "var(--bg-surface)",
                                  borderRadius: "8px"
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                                    <strong style={{ color: "var(--text-main)" }}>{d.from}</strong>
                                    <ArrowRight size={13} color="var(--text-muted)" />
                                    <strong style={{ color: "var(--text-main)" }}>{d.to}</strong>
                                  </div>
                                  <div className="font-mono" style={{ fontSize: "14px", fontWeight: 700, color: "#06b6d4" }}>
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
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                          flexWrap: "wrap",
                          gap: "10px"
                        }}>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input 
                              type="text"
                              placeholder="Search this trip's expenses..."
                              value={ledgerSearchQuery}
                              onChange={(e) => setLedgerSearchQuery(e.target.value)}
                              style={{
                                padding: "6px 12px",
                                background: "var(--bg-card)",
                                border: "1px solid var(--border-medium)",
                                borderRadius: "7px",
                                color: "var(--text-main)",
                                fontSize: "12.5px",
                                width: "200px"
                              }}
                            />
                            <select
                              value={ledgerCategoryFilter}
                              onChange={(e) => setLedgerCategoryFilter(e.target.value)}
                              style={{
                                padding: "6px 10px",
                                background: "var(--bg-card)",
                                border: "1px solid var(--border-medium)",
                                borderRadius: "7px",
                                color: "var(--text-main)",
                                fontSize: "12.5px"
                              }}
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
                          <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                            No expenses found matching the criteria.
                          </div>
                        ) : (
                          <div style={{ overflowX: "auto" }}>
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
                                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{exp.title}</div>
                                        {exp.notes && (
                                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{exp.notes}</div>
                                        )}
                                      </td>
                                      <td>
                                        <span style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          fontSize: "11px",
                                          padding: "2px 8px",
                                          borderRadius: "4px",
                                          background: catMeta.bgColor,
                                          color: catMeta.color,
                                          fontWeight: 600
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
                                          onClick={() => onDeleteExpense(exp.id)}
                                          style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "var(--text-muted)",
                                            cursor: "pointer",
                                            padding: "4px"
                                          }}
                                          title="Delete expense"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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

      {/* Add Travel Expense Modal */}
      {activeModalTrip && (
        <AddTravelExpenseModal 
          isOpen={!!activeModalTrip}
          onClose={() => setActiveModalTrip(null)}
          activeTrip={activeModalTrip}
          onAddExpense={onAddExpense}
        />
      )}
    </div>
  );
};
