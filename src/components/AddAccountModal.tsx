import React, { useState, useEffect } from "react";
import { X, Check, Landmark, CreditCard, Banknote } from "lucide-react";
import { Account, AccountType } from "../types";
import { parseRupeesToPaise, formatPaiseToRupees } from "../utils/money";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAccount: (account: Account) => void;
  editingAccount?: Account | null;
}

const ACCOUNT_TYPE_META: { type: AccountType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: "bank", label: "Bank Account", icon: <Landmark size={16} />, desc: "Savings or current account" },
  { type: "credit", label: "Credit Card", icon: <CreditCard size={16} />, desc: "Credit line or statement" },
  { type: "cash", label: "Cash in Hand", icon: <Banknote size={16} />, desc: "Physical wallet or petty cash" },
];

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSaveAccount,
  editingAccount
}) => {
  const isEditing = !!editingAccount;

  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("bank");
  const [balanceInput, setBalanceInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setAccountType(editingAccount.type);
      setBalanceInput(formatPaiseToRupees(editingAccount.startingBalancePaise).replace(/[₹,\s]/g, ""));
    } else {
      setName("");
      setAccountType("bank");
      setBalanceInput("");
    }
    setErrorMessage("");
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Account name is required.");
      return;
    }

    let balancePaise: number;
    try {
      balancePaise = parseRupeesToPaise(balanceInput || "0");
    } catch {
      setErrorMessage("Please enter a valid amount for the starting balance.");
      return;
    }

    const account: Account = {
      id: editingAccount?.id || `acc-${Date.now()}`,
      name: trimmedName,
      type: accountType,
      startingBalancePaise: balancePaise
    };

    onSaveAccount(account);
    onClose();
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
        width: "440px",
        padding: "24px",
        boxShadow: "var(--shadow-modal)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
            {isEditing ? "Edit Account" : "Add Account"}
          </h2>
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
          {/* Account Type Selector */}
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
              ACCOUNT TYPE
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {ACCOUNT_TYPE_META.map((at) => (
                <button
                  key={at.type}
                  type="button"
                  className="btn-secondary"
                  style={{
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px 8px",
                    gap: "6px",
                    background: accountType === at.type ? "var(--accent-cyan-bg)" : "var(--bg-card)",
                    borderColor: accountType === at.type ? "var(--accent-cyan)" : "var(--border-subtle)",
                    color: accountType === at.type ? "var(--accent-cyan)" : "var(--text-secondary)"
                  }}
                  onClick={() => setAccountType(at.type)}
                >
                  {at.icon}
                  <span style={{ fontSize: "11.5px", fontWeight: 600 }}>{at.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              ACCOUNT NAME
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. HDFC Savings, ICICI Credit Card, Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-main)",
                fontSize: "14px"
              }}
            />
          </div>

          {/* Starting Balance */}
          <div>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              {accountType === "credit" ? "CURRENT OUTSTANDING (₹)" : "STARTING BALANCE (₹)"}
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-main)",
                fontSize: "18px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>{isEditing ? "Save Changes" : "Add Account"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
