import React, { useState } from "react";
import { X, Check, Repeat, Tag } from "lucide-react";
import { FlowType, Transaction, Account } from "../types";
import { parseRupeesToPaise } from "../utils/money";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  accounts,
  onAddTransaction 
}) => {
  const [type, setType] = useState<FlowType>("expense");
  const [amountInput, setAmountInput] = useState("");
  const [accountId, setAccountId] = useState(() => (accounts && accounts[0]?.id) || "acc-primary");
  const [category, setCategory] = useState("General Spending");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  React.useEffect(() => {
    if (accounts && accounts.length > 0 && !accounts.some((a) => a.id === accountId)) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const paise = parseRupeesToPaise(amountInput);
      
      // Parse tags (split by commas or spaces, ensure single # prefix, ignore standalone #)
      const parsedTags = tagsInput
        .split(/[, ]+/)
        .map((t) => t.trim().replace(/^#+/, ""))
        .filter((t) => t.length > 0)
        .map((t) => `#${t}`);

      const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().split("T")[0];

      onAddTransaction({
        date: validDate,
        type,
        accountId,
        category,
        notes: notes.trim() || (type === "income" ? "Income deposit" : "General spending"),
        tags: parsedTags,
        isRecurring,
        amountPaise: paise
      });

      // Reset form
      setAmountInput("");
      setNotes("");
      setTagsInput("");
      setIsRecurring(false);
      onClose();
    } catch {
      setErrorMessage("Please enter a valid positive number for amount (e.g. 250.50)");
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-lg)",
        width: "480px",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "24px",
        boxShadow: "var(--shadow-modal)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>Record Transaction</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div style={{
            padding: "8px 12px",
            background: "var(--expense-bg)",
            border: "1px solid var(--expense-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--expense-rose)",
            fontSize: "12px",
            marginBottom: "12px"
          }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Income vs Expense Toggle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              id="btn-select-expense"
              className="btn-secondary"
              style={{
                justifyContent: "center",
                background: type === "expense" ? "var(--expense-bg)" : "var(--bg-card)",
                borderColor: type === "expense" ? "var(--expense-rose)" : "var(--border-subtle)",
                color: type === "expense" ? "var(--expense-rose)" : "var(--text-secondary)",
                fontWeight: 600
              }}
              onClick={() => {
                setType("expense");
                setCategory("General Spending");
              }}
            >
              Spending
            </button>
            <button
              type="button"
              id="btn-select-income"
              className="btn-secondary"
              style={{
                justifyContent: "center",
                background: type === "income" ? "var(--income-bg)" : "var(--bg-card)",
                borderColor: type === "income" ? "var(--income-emerald)" : "var(--border-subtle)",
                color: type === "income" ? "var(--income-emerald)" : "var(--text-secondary)",
                fontWeight: 600
              }}
              onClick={() => {
                setType("income");
                setCategory("Salary");
              }}
            >
              Income
            </button>
          </div>

          {/* Amount in Rupees */}
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              AMOUNT (₹)
            </label>
            <input
              type="number"
              id="input-transaction-amount"
              step="0.01"
              required
              autoFocus
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-main)",
                fontSize: "20px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700
              }}
            />
          </div>

          {/* Category & Calendar Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                CATEGORY
              </label>
              <select
                id="select-transaction-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-main)",
                  fontSize: "13px"
                }}
              >
                {type === "expense" ? (
                  <>
                    <option value="Groceries">Groceries & Supermarket</option>
                    <option value="Subscriptions">Subscriptions (Netflix, Spotify, Cloud, Gym)</option>
                    <option value="Shopping">Shopping & Retail (Clothing, Electronics, Gadgets)</option>
                    <option value="Dining Out">Dining Out, Cafes & Delivery</option>
                    <option value="Rent">Rent & Housing</option>
                    <option value="Utilities">Utilities & Bills (Electricity, Wi-Fi, Gas)</option>
                    <option value="Fuel">Fuel, Cabs & Transit</option>
                    <option value="Healthcare">Healthcare & Pharmacy</option>
                    <option value="Entertainment">Entertainment & Leisure</option>
                    <option value="Travel">Travel & Vacations</option>
                    <option value="General Spending">General Spending</option>
                    <option value="Other">Other Spending</option>
                  </>
                ) : (
                  <>
                    <option value="Salary">Monthly Salary</option>
                    <option value="Freelance">Freelance & Side Gigs</option>
                    <option value="Investments">Investment / Dividends / Returns</option>
                    <option value="Rental Income">Rental Income</option>
                    <option value="Refunds">Reimbursements & Refunds</option>
                    <option value="Gift">Gifts / Cash Inflow</option>
                    <option value="Other">Other Earnings</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                CALENDAR DATE
              </label>
              <input
                type="date"
                id="input-transaction-date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-main)",
                  fontSize: "13px",
                  fontFamily: "var(--font-mono)"
                }}
              />
            </div>
          </div>

          {/* Notes & Merchant */}
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              NOTES / MERCHANT (OPTIONAL)
            </label>
            <input
              type="text"
              id="input-transaction-notes"
              placeholder="e.g. Swiggy, DMart, Rent transfer"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-main)",
                fontSize: "13px"
              }}
            />
          </div>

          {/* Tags (Multi-Dimensional Taxonomies) */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              <Tag size={12} /> TAGS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              id="input-transaction-tags"
              placeholder="e.g. #Work, #TaxDeductible, #Trip"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-main)",
                fontSize: "13px"
              }}
            />
          </div>

          {/* Recurring Commitment Marker */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            background: "var(--bg-card-subtle)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)"
          }}>
            <input
              type="checkbox"
              id="checkbox-is-recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              style={{ width: "16px", height: "16px", accentColor: "var(--accent-cyan)", cursor: "pointer" }}
            />
            <label htmlFor="checkbox-is-recurring" style={{ fontSize: "12.5px", color: "var(--text-main)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <Repeat size={14} color="var(--accent-cyan)" />
              <span>Recurring monthly commitment (Rent, Bill, Subscription)</span>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" id="btn-submit-transaction" className="btn-primary">
              <Check size={16} />
              <span>Record Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
