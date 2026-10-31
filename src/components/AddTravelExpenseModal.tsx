import React, { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Calendar, 
  Tag, 
  Users, 
  Check, 
  Waves, 
  Hotel, 
  UtensilsCrossed, 
  Plane, 
  Fuel, 
  ShoppingBag, 
  Ticket 
} from "lucide-react";
import { Trip, TripExpense, TravelCategory, SplitType } from "../types";
import { parseRupeesToPaise, formatPaiseToRupees, formatPaiseToDecimal } from "../utils/money";
import { TRAVEL_CATEGORIES, computeExpenseShares } from "../utils/travel";
import { getLocalDate, isValidStrictCalendarDate } from "../utils/dates";

interface AddTravelExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrip: Trip | null;
  onAddExpense: (expense: Omit<TripExpense, "id">) => Promise<void>;
  initialExpense?: TripExpense | null;
  onUpdateExpense?: (expense: TripExpense) => Promise<void>;
}

export const AddTravelExpenseModal: React.FC<AddTravelExpenseModalProps> = ({
  isOpen,
  onClose,
  activeTrip,
  onAddExpense,
  initialExpense,
  onUpdateExpense
}) => {
  const isEditMode = Boolean(initialExpense);
  const members = activeTrip?.members && activeTrip.members.length > 0
    ? activeTrip.members
    : ["Me"];

  const defaultDate = activeTrip?.startDate || getLocalDate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TravelCategory>("activities");
  const [date, setDate] = useState(defaultDate);
  const [amountStr, setAmountStr] = useState("");
  const [paidBy, setPaidBy] = useState("Me");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [selectedSplitMembers, setSelectedSplitMembers] = useState<string[]>(members);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const close = () => { if (!isSaving) onClose(); };

  useEffect(() => {
    if (isOpen) {
      if (initialExpense) {
        setTitle(initialExpense.title);
        setCategory(initialExpense.category);
        setDate(initialExpense.date);
        setAmountStr(initialExpense.amountPaise > 0 ? formatPaiseToDecimal(initialExpense.amountPaise) : "");
        setPaidBy(initialExpense.paidBy);
        setSplitType(initialExpense.splitType);
        setSelectedSplitMembers(
          initialExpense.splitMembers && initialExpense.splitMembers.length > 0
            ? initialExpense.splitMembers
            : members
        );
        setNotes(initialExpense.notes || "");
      } else {
        setTitle("");
        setCategory("activities");
        setDate(defaultDate);
        setAmountStr("");
        setPaidBy("Me");
        setSplitType("equal");
        setSelectedSplitMembers(members);
        setNotes("");
      }
      setError(null);
    }
  }, [isOpen, defaultDate, members, initialExpense]);

  // Compute live preview of shares
  const livePreview = useMemo(() => {
    try {
      const paise = parseRupeesToPaise(amountStr);
      let targetMembers: string[] = [];
      if (splitType === "equal") {
        targetMembers = members;
      } else if (splitType === "personal") {
        targetMembers = ["Me"];
      } else {
        targetMembers = selectedSplitMembers.length > 0 ? selectedSplitMembers : [paidBy];
      }

      const { mySharePaise, perMemberShares } = computeExpenseShares(
        paise,
        paidBy,
        targetMembers,
        "Me"
      );

      return {
        amountPaise: paise,
        mySharePaise,
        targetMembers,
        perMemberShares,
        valid: true
      };
    } catch {
      return {
        amountPaise: 0,
        mySharePaise: 0,
        targetMembers: members,
        perMemberShares: {},
        valid: false
      };
    }
  }, [amountStr, splitType, members, selectedSplitMembers, paidBy]);

  if (!isOpen || !activeTrip) return null;

  const handleToggleMember = (m: string) => {
    setSelectedSplitMembers((prev) => {
      if (prev.includes(m)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== m);
      } else {
        return [...prev, m];
      }
    });
  };

  const handleSelectPreset = (preset: string) => {
    setTitle(preset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setError(null);

    if (!title.trim()) {
      setError("Please enter a title or description for this activity/expense.");
      return;
    }

    if (!isValidStrictCalendarDate(date)) {
      setError("Please select a valid calendar date.");
      return;
    }

    let amountPaise = 0;
    try {
      amountPaise = parseRupeesToPaise(amountStr);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid amount.";
      setError(msg);
      return;
    }

    let finalSplitMembers: string[] = [];
    if (splitType === "equal") {
      finalSplitMembers = members;
    } else if (splitType === "personal") {
      finalSplitMembers = ["Me"];
    } else {
      finalSplitMembers = selectedSplitMembers.length > 0 ? selectedSplitMembers : [paidBy];
    }

    const { mySharePaise } = computeExpenseShares(
      amountPaise,
      paidBy,
      finalSplitMembers,
      "Me"
    );

    setIsSaving(true);
    try {
      if (initialExpense && onUpdateExpense) {
        await onUpdateExpense({
          ...initialExpense,
          tripId: activeTrip.id,
          date,
          title: title.trim(),
          category,
          amountPaise,
          paidBy,
          splitType,
          splitMembers: finalSplitMembers,
          mySharePaise,
          notes: notes.trim() || undefined
        });
      } else {
        await onAddExpense({
          tripId: activeTrip.id,
          date,
          title: title.trim(),
          category,
          amountPaise,
          paidBy,
          splitType,
          splitMembers: finalSplitMembers,
          mySharePaise,
          notes: notes.trim() || undefined
        });
      }
      onClose();
    } catch (err) { setError(`Could not record travel expense: ${String(err)}`); }
    finally { setIsSaving(false); }
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

  const currentCategoryMeta = TRAVEL_CATEGORIES[category];

  return (
    <div className="modal-backdrop" onClick={close}>
      <div 
        className="modal-container"
        style={{ maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-sm)",
              background: currentCategoryMeta.bgColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: currentCategoryMeta.color
            }}>
              {renderCategoryIcon(category)}
            </div>
            <div>
              <h2 className="modal-title">{isEditMode ? "Edit Travel Expense" : "Record Travel Expense"}</h2>
              <p className="modal-subtitle">
                {isEditMode ? "Editing in " : "Adding to "}<span style={{ color: "var(--text-main)", fontWeight: 600 }}>{activeTrip.name}</span>
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={close} aria-label="Close dialog" disabled={isSaving}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div style={{
              padding: "10px 14px",
              background: "var(--expense-bg)",
              border: "1px solid var(--expense-border)",
              color: "var(--expense-rose)",
              borderRadius: "var(--radius-sm)",
              fontSize: "12.5px"
            }}>
              {error}
            </div>
          )}

          {/* Category Tabs */}
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Tag size={13} color="var(--brand-nordic)" />
                Expense Category *
              </span>
            </label>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, 1fr)", 
              gap: "8px", 
              marginTop: "4px" 
            }}>
              {(Object.keys(TRAVEL_CATEGORIES) as TravelCategory[]).map((catKey) => {
                const meta = TRAVEL_CATEGORIES[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: isSelected ? `1.5px solid ${meta.color}` : "1px solid var(--border-subtle)",
                      background: isSelected ? meta.bgColor : "var(--bg-input)",
                      color: isSelected ? "var(--text-main)" : "var(--text-secondary)",
                      fontSize: "12px",
                      fontWeight: isSelected ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <span style={{ color: meta.color }}>
                      {renderCategoryIcon(catKey)}
                    </span>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Preset Pills */}
          {currentCategoryMeta.presets.length > 0 && (
            <div style={{ marginTop: "-4px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
                Quick suggestions for {currentCategoryMeta.label}:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {currentCategoryMeta.presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "999px",
                      padding: "3px 10px",
                      fontSize: "11.5px",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = currentCategoryMeta.color;
                      e.currentTarget.style.color = "var(--text-main)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-subtle)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title / Activity */}
          <div className="form-group" style={{ marginTop: "10px" }}>
            <label className="form-label" htmlFor="expense-title">Activity or Description *</label>
            <input 
              id="expense-title"
              type="text"
              className="form-input"
              placeholder="e.g. Surfing lesson, Sea Kayaking, Resort Stay, Highway Fuel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Amount and Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="expense-amount">Total Amount (₹ INR) *</label>
              <input 
                id="expense-amount"
                type="text"
                className="form-input"
                placeholder="e.g. 4,500.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expense-date">
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={13} color="var(--brand-nordic)" />
                  Date *
                </span>
              </label>
              <input 
                id="expense-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Paid By */}
          <div className="form-group">
            <label className="form-label" htmlFor="expense-paid-by">
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Users size={13} color="var(--brand-nordic)" />
                Who Paid for this?
              </span>
            </label>
            <select
              id="expense-paid-by"
              className="form-input"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
            >
              {members.map((m) => (
                <option key={m} value={m}>
                  {m === "Me" ? "Me (You fronted the money)" : `${m} paid`}
                </option>
              ))}
            </select>
          </div>

          {/* Split Mode Options */}
          <div className="form-group">
            <label className="form-label">How should this expense be split?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {[
                { type: "equal" as SplitType, label: "Split Equally", desc: `Divided among all ${members.length}` },
                { type: "personal" as SplitType, label: "Only For Me", desc: "100% my personal cost" },
                { type: "custom" as SplitType, label: "Custom / Select", desc: "Choose specific people" }
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSplitType(opt.type)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: splitType === opt.type ? "1.5px solid var(--brand-nordic)" : "1px solid var(--border-subtle)",
                    background: splitType === opt.type ? "var(--brand-nordic-bg)" : "var(--bg-input)",
                    color: splitType === opt.type ? "var(--text-main)" : "var(--text-secondary)",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 600 }}>{opt.label}</div>
                  <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "2px" }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Companion Checkboxes */}
          {splitType === "custom" && (
            <div style={{
              background: "var(--bg-input)",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)"
            }}>
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                Select companions who took part in this activity / ride:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {members.map((m) => {
                  const isChecked = selectedSplitMembers.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleToggleMember(m)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 10px",
                        borderRadius: "var(--radius-sm)",
                        border: isChecked ? "1px solid var(--brand-nordic)" : "1px solid var(--border-subtle)",
                        background: isChecked ? "var(--brand-nordic-bg)" : "var(--bg-surface)",
                        color: isChecked ? "var(--text-main)" : "var(--text-muted)",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      <span style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "3px",
                        border: isChecked ? "none" : "1px solid var(--border-medium)",
                        background: isChecked ? "var(--brand-nordic)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff"
                      }}>
                        {isChecked && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span>{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Split Calculation Card */}
          {livePreview.valid && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Your Out-of-Pocket Share
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--income-emerald)", fontFamily: "var(--font-mono)" }}>
                  {formatPaiseToRupees(livePreview.mySharePaise)}
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", color: "var(--text-secondary)" }}>
                <div>Total: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-main)", fontWeight: 600 }}>{formatPaiseToRupees(livePreview.amountPaise)}</span></div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Split among {livePreview.targetMembers.length} member{livePreview.targetMembers.length > 1 ? "s" : ""}</div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="expense-notes">Notes / Location / Merchant (Optional)</label>
            <input 
              id="expense-notes"
              type="text"
              className="form-input"
              placeholder="e.g. Ashwem beach surfing hut, invoice #204"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ marginTop: "14px" }}>
            <button type="button" className="btn-secondary" onClick={close} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Record Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
