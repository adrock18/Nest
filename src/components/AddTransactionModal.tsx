import React, { useState, useEffect } from "react";
import { X, Check, Repeat, Tag } from "lucide-react";
import { FlowType, Transaction, Account, Category } from "../types";
import { parseRupeesToPaise, formatPaiseToRupees } from "../utils/money";
import { getLocalDate, isValidStrictCalendarDate } from "../utils/dates";
import { Modal } from "./Modal";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  onAddTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  onEditTransaction?: (transaction: Transaction) => Promise<void>;
  editingTransaction?: Transaction | null;
  initialCategory?: string;
  initialRecurring?: boolean;
  initialDate?: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  onAddTransaction,
  onEditTransaction,
  editingTransaction,
  initialCategory,
  initialRecurring,
  initialDate
}) => {
  const isEditing = !!editingTransaction;

  const [type, setType] = useState<FlowType>("expense");
  const [amountInput, setAmountInput] = useState("");
  const [accountId, setAccountId] = useState(() => (accounts && accounts[0]?.id) || "acc-primary");
  const [category, setCategory] = useState("General Spending");
  const [date, setDate] = useState(getLocalDate);
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [tripExpenseId, setTripExpenseId] = useState<string | null>(editingTransaction?.tripExpenseId || null);

  // Populate form when editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountInput(formatPaiseToRupees(editingTransaction.amountPaise).replace(/[₹,\s]/g, ""));
      setAccountId(editingTransaction.accountId);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes);
      setTagsInput(editingTransaction.tags.join(", "));
      setIsRecurring(editingTransaction.isRecurring);
      setTripExpenseId(editingTransaction.tripExpenseId || null);
    } else {
      setType("expense");
      setAmountInput("");
      setAccountId((accounts && accounts[0]?.id) || "acc-primary");
      setCategory(initialCategory || categories.find((c) => !c.isIncome)?.name || "");
      setDate(initialDate || getLocalDate());
      setNotes("");
      setTagsInput("");
      setIsRecurring(initialRecurring || false);
      setTripExpenseId(null);
    }
    setErrorMessage("");
  }, [editingTransaction, accounts, categories, initialCategory, initialRecurring, initialDate]);

  useEffect(() => {
    if (accounts && accounts.length > 0 && !accounts.some((a) => a.id === accountId)) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  if (!isOpen) return null;

  const expenseCategories = categories.filter((c) => !c.isIncome);
  const incomeCategories = categories.filter((c) => c.isIncome);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setErrorMessage("");
    setIsSaving(true);
    try {
      const paise = parseRupeesToPaise(amountInput);

      // Parse tags
      const parsedTags = [...new Set(tagsInput
        .split(/[, ]+/)
        .map((t) => t.trim().replace(/^#+/, ""))
        .filter((t) => t.length > 0)
        .map((t) => `#${t}`))];

      if (!isValidStrictCalendarDate(date)) throw new Error("Please enter a valid calendar date.");
      if (!accounts.some((a) => a.id === accountId)) throw new Error("Add an account in Settings before recording a transaction.");

      if (isEditing && editingTransaction && onEditTransaction) {
        await onEditTransaction({
          ...editingTransaction,
          date,
          type,
          accountId,
          category,
          notes: notes.trim() || (type === "income" ? "Income deposit" : "General spending"),
          tags: parsedTags,
          isRecurring,
          amountPaise: paise,
          tripExpenseId
        });
      } else {
        await onAddTransaction({
          date,
          type,
          accountId,
          category,
          notes: notes.trim() || (type === "income" ? "Income deposit" : "General spending"),
          tags: parsedTags,
          isRecurring,
          amountPaise: paise
        });
      }

      // Reset form
      setAmountInput("");
      setNotes("");
      setTagsInput("");
      setIsRecurring(false);
      onClose();
    } catch (error) {
      setErrorMessage(String(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title={isEditing ? "Edit Transaction" : "Record Transaction"} onClose={onClose} busy={isSaving}>
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
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
            {isEditing ? "Edit Transaction" : "Record Transaction"}
          </h2>
          <button onClick={onClose} disabled={isSaving} aria-label="Close transaction form" style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div role="alert" style={{
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
                setCategory(expenseCategories[0]?.name || "");
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
                setTripExpenseId(null);
                setCategory(incomeCategories[0]?.name || "");
              }}
            >
              Income
            </button>
          </div>

          {/* Amount in Rupees */}
          {tripExpenseId && <div className="spending-scope-note">
            This account entry is linked to a trip expense. Category dashboards count the trip share, not this account payment.
            <button type="button" className="text-button" onClick={() => setTripExpenseId(null)}>Remove travel link</button>
          </div>}
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              AMOUNT (₹)
            </label>
            <input
              type="number"
              id="input-transaction-amount"
              step="0.01"
              min="0.01"
              aria-label="Amount in rupees"
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

          {/* Account & Calendar Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                ACCOUNT
              </label>
              <select
                id="select-transaction-account"
                aria-label="Account"
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
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
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
                CALENDAR DATE
              </label>
              <input
                type="date"
                id="input-transaction-date"
                aria-label="Calendar date"
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

          {/* Category */}
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              CATEGORY
            </label>
            <select
              id="select-transaction-category"
              aria-label="Category"
              required
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
              {type === "expense"
                ? expenseCategories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))
                : incomeCategories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))
              }
            </select>
          </div>

          {/* Notes & Merchant */}
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              NOTES / MERCHANT (OPTIONAL)
            </label>
            <input
              type="text"
              id="input-transaction-notes"
              aria-label="Notes or merchant"
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

          {/* Tags */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              <Tag size={12} /> TAGS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              id="input-transaction-tags"
              aria-label="Tags"
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

          {/* Recurring Toggle */}
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
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" id="btn-submit-transaction" className="btn-primary" disabled={isSaving || accounts.length === 0}>
              <Check size={16} />
              <span>{isSaving ? "Saving..." : isEditing ? "Save Changes" : "Record Transaction"}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
