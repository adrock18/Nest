import React, { useState, useEffect } from "react";
import { 
  X, 
  Calendar, 
  MapPin, 
  Compass, 
  Users, 
  Check, 
  Pencil, 
  Clock, 
  AlertCircle,
  Plus
} from "lucide-react";
import { Trip } from "../types";
import { parseRupeesToPaise, formatPaiseToDecimal } from "../utils/money";
import { getLocalDate, isValidStrictCalendarDate } from "../utils/dates";

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrip: (trip: Omit<Trip, "id" | "createdAt">) => Promise<void>;
  initialTrip?: Trip | null;
  onUpdateTrip?: (trip: Trip) => Promise<void>;
}

const COLOR_OPTIONS = [
  { label: "Ocean Cyan", value: "#06b6d4" },
  { label: "Alpine Violet", value: "#8b5cf6" },
  { label: "Sunset Amber", value: "#f59e0b" },
  { label: "Emerald Coast", value: "#10b981" },
  { label: "Coral Rose", value: "#f43f5e" },
  { label: "Azure Sky", value: "#0284c7" }
];

const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  } catch {
    // fallback
  }
  return dateStr;
};

export const AddTripModal: React.FC<AddTripModalProps> = ({
  isOpen,
  onClose,
  onAddTrip,
  initialTrip,
  onUpdateTrip
}) => {
  const isEditMode = Boolean(initialTrip);
  const todayStr = getLocalDate();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 6);
  const nextWeekStr = getLocalDate(nextWeek);

  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextWeekStr);
  const [budgetString, setBudgetString] = useState("");
  const [membersInput, setMembersInput] = useState("Me, Aarav, Pooja, Vikram");
  const [coverColor, setCoverColor] = useState("#06b6d4");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const close = () => { if (!isSaving) onClose(); };

  useEffect(() => {
    if (isOpen) {
      if (initialTrip) {
        setName(initialTrip.name);
        setDestination(initialTrip.destination);
        setStartDate(initialTrip.startDate);
        setEndDate(initialTrip.endDate);
        setBudgetString(initialTrip.budgetPaise > 0 ? formatPaiseToDecimal(initialTrip.budgetPaise) : "");
        setMembersInput(initialTrip.members.join(", "));
        setCoverColor(initialTrip.coverColor || "#06b6d4");
      } else {
        setName("");
        setDestination("");
        setStartDate(todayStr);
        setEndDate(nextWeekStr);
        setBudgetString("");
        setMembersInput("Me, Aarav, Pooja, Vikram");
        setCoverColor("#06b6d4");
      }
      setError(null);
    }
  }, [isOpen, initialTrip, todayStr, nextWeekStr]);

  if (!isOpen) return null;

  // Parsed companions list
  const parsedMembers = membersInput
    .split(/[,;\n]+/)
    .map((m) => m.trim())
    .filter((m) => m.length > 0);
  const displayMembers = Array.from(new Set(parsedMembers.length > 0 ? parsedMembers : ["Me"]));
  if (!displayMembers.includes("Me")) {
    displayMembers.unshift("Me");
  }

  const handleRemoveMember = (nameToRemove: string) => {
    if (nameToRemove === "Me") return;
    const remaining = displayMembers.filter((m) => m !== nameToRemove);
    setMembersInput(remaining.join(", "));
  };

  // Duration calculation
  let durationDays = 0;
  let isDateRangeValid = true;
  if (startDate && endDate) {
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffTime = d2.getTime() - d1.getTime();
    durationDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (durationDays <= 0) {
      isDateRangeValid = false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setError(null);

    if (!name.trim()) {
      setError("Please specify a name for this trip.");
      return;
    }
    if (!destination.trim()) {
      setError("Please specify a destination.");
      return;
    }
    if (!isValidStrictCalendarDate(startDate) || !isValidStrictCalendarDate(endDate)) {
      setError("Please select valid start and end dates.");
      return;
    }
    if (endDate < startDate) {
      setError("Trip end date cannot be earlier than start date.");
      return;
    }

    let budgetPaise = 0;
    if (budgetString.trim()) {
      try {
        budgetPaise = parseRupeesToPaise(budgetString);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid budget amount.";
        setError(msg);
        return;
      }
    }

    setIsSaving(true);
    try {
      if (initialTrip && onUpdateTrip) {
        await onUpdateTrip({
          ...initialTrip,
          name: name.trim(),
          destination: destination.trim(),
          startDate,
          endDate,
          budgetPaise,
          members: displayMembers,
          coverColor
        });
      } else {
        await onAddTrip({
          name: name.trim(),
          destination: destination.trim(),
          startDate,
          endDate,
          budgetPaise,
          members: displayMembers,
          coverColor
        });
      }
      onClose();
    } catch (err) {
      setError(`Could not save trip: ${String(err)}`);
    } finally { setIsSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div 
        className="modal-container"
        style={{
          maxWidth: "540px",
          maxHeight: "92vh",
          overflowY: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: isEditMode ? "rgba(139, 92, 246, 0.16)" : `${coverColor}22`,
              border: isEditMode ? "1px solid rgba(139, 92, 246, 0.35)" : `1px solid ${coverColor}55`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isEditMode ? "#a78bfa" : coverColor
            }}>
              {isEditMode ? <Pencil size={18} strokeWidth={2.2} /> : <Compass size={20} strokeWidth={2.2} />}
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: "17px", fontWeight: 700 }}>
                {isEditMode ? "Edit Trip Details" : "Create New Trip"}
              </h2>
              <p className="modal-subtitle" style={{ fontSize: "12px" }}>
                {isEditMode
                  ? "Update destination, dates, budget or split companions"
                  : "Track shared vacation costs, activities, daily spending & splits"}
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="btn-close"
            onClick={close}
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="modal-form" style={{ gap: "18px" }}>
          {error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              background: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "#fb7185",
              borderRadius: "8px",
              fontSize: "12.5px"
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Trip Name */}
          <div className="form-group">
            <label 
              htmlFor="trip-name" 
              className="form-label"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span>Trip Name *</span>
              <span style={{ fontSize: "10.5px", fontWeight: 400, color: "var(--text-muted)", textTransform: "none" }}>
                Required
              </span>
            </label>
            <input 
              id="trip-name"
              type="text"
              placeholder="e.g. Goa Coastal & Adventure, Manali Trek"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              className="form-input"
            />
          </div>

          {/* 2. Destination */}
          <div className="form-group">
            <label 
              htmlFor="trip-destination" 
              className="form-label"
              style={{ display: "flex", alignItems: "center", gap: "5px" }}
            >
              <MapPin size={12} color={coverColor} />
              <span>Destination *</span>
            </label>
            <input 
              id="trip-destination"
              type="text"
              placeholder="e.g. Goa, India or Solang Valley & Manali"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {/* 3. Dates & Timeline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label 
                  htmlFor="trip-start-date" 
                  className="form-label"
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <Calendar size={12} color={coverColor} />
                  <span>Start Date *</span>
                </label>
                <input 
                  id="trip-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="form-input"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <div className="form-group">
                <label 
                  htmlFor="trip-end-date" 
                  className="form-label"
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <Calendar size={12} color={coverColor} />
                  <span>End Date *</span>
                </label>
                <input 
                  id="trip-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="form-input"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Live Duration Indicator */}
            {startDate && endDate && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                background: isDateRangeValid ? "rgba(6, 182, 212, 0.08)" : "rgba(244, 63, 94, 0.1)",
                border: isDateRangeValid ? "1px solid rgba(6, 182, 212, 0.2)" : "1px solid rgba(244, 63, 94, 0.25)",
                color: isDateRangeValid ? "var(--text-main)" : "#fb7185"
              }}>
                <Clock size={13} color={isDateRangeValid ? coverColor : "#fb7185"} />
                {isDateRangeValid ? (
                  <span>
                    <strong style={{ color: coverColor }}>{durationDays} {durationDays === 1 ? "Day" : "Days"} Trip</strong>
                    {" • "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      {formatDateDisplay(startDate)} to {formatDateDisplay(endDate)}
                    </span>
                  </span>
                ) : (
                  <span>End date must be on or after start date.</span>
                )}
              </div>
            )}
          </div>

          {/* 4. Target Trip Budget */}
          <div className="form-group">
            <label 
              htmlFor="trip-budget" 
              className="form-label"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span>Target Trip Budget</span>
              <span style={{ fontSize: "10.5px", fontWeight: 400, color: "var(--text-muted)", textTransform: "none" }}>
                Optional (leave blank for uncapped spending)
              </span>
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <span style={{
                position: "absolute",
                left: "14px",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-muted)",
                pointerEvents: "none"
              }}>
                ₹
              </span>
              <input 
                id="trip-budget"
                type="text"
                placeholder="e.g. 50,000"
                value={budgetString}
                onChange={(e) => setBudgetString(e.target.value)}
                className="form-input"
                style={{
                  paddingLeft: "32px",
                  fontFamily: "var(--font-mono)"
                }}
              />
            </div>
          </div>

          {/* 5. Companions / Split Members */}
          <div className="form-group">
            <label 
              htmlFor="trip-members" 
              className="form-label"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Users size={12} color={coverColor} />
                <span>Trip Companions (Comma-separated)</span>
              </span>
              <span style={{ fontSize: "10.5px", fontWeight: 400, color: "var(--text-muted)", textTransform: "none" }}>
                Used for split expense calculations
              </span>
            </label>
            <input 
              id="trip-members"
              type="text"
              placeholder="e.g. Me, Aarav, Pooja, Vikram"
              value={membersInput}
              onChange={(e) => setMembersInput(e.target.value)}
              className="form-input"
            />

            {/* Interactive Companion Chips */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginTop: "4px"
            }}>
              {displayMembers.map((m) => {
                const isMe = m === "Me";
                return (
                  <span 
                    key={m}
                    style={{
                      fontSize: "11.5px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: isMe ? `${coverColor}22` : "var(--bg-card)",
                      color: isMe ? coverColor : "var(--text-secondary)",
                      border: isMe ? `1px solid ${coverColor}55` : "1px solid var(--border-subtle)",
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span>{isMe ? "👤 Me (You)" : m}</span>
                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m)}
                        title={`Remove ${m}`}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: 0,
                          margin: 0,
                          lineHeight: 1,
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        ×
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "3px 0 0" }}>
              Keep <strong>"Me"</strong> for yourself. You can add or remove friends at any time.
            </p>
          </div>

          {/* 6. Color Accent Picker */}
          <div className="form-group">
            <label className="form-label">
              Trip Theme Accent
            </label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "2px" }}>
              {COLOR_OPTIONS.map((c) => {
                const isSelected = coverColor === c.value;
                return (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => setCoverColor(c.value)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: c.value,
                      border: isSelected ? "3px solid #ffffff" : "2px solid transparent",
                      cursor: "pointer",
                      boxShadow: isSelected ? `0 0 0 2px ${c.value}` : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      transition: "all 0.15s ease"
                    }}
                    title={c.label}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-footer" style={{ marginTop: "6px" }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={close}
              disabled={isSaving}
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="btn-primary"
              style={{
                padding: "8px 20px",
                fontSize: "13px",
                fontWeight: 600,
                background: isEditMode 
                  ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" 
                  : "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)"
              }}
            >
              {isEditMode ? <Check size={15} /> : <Plus size={15} />}
              <span>{isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Create Trip"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
