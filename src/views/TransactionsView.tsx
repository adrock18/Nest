import React, { useState } from "react";
import { Search, ArrowDownRight, ArrowUpRight, Trash2, Plus, Repeat } from "lucide-react";
import { Transaction, Account } from "../types";
import { formatPaiseToRupees } from "../utils/money";

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  onDeleteTransaction: (id: string) => void;
  onOpenAddTransaction: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts: _accounts,
  onDeleteTransaction,
  onOpenAddTransaction
}) => {
  const [filterType, setFilterType] = useState<"all" | "expense" | "income" | "recurring">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const safeTransactions = transactions || [];

  const filtered = safeTransactions.filter((tx) => {
    if (filterType === "expense" && tx.type !== "expense") return false;
    if (filterType === "income" && tx.type !== "income") return false;
    if (filterType === "recurring" && !tx.isRecurring) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNote = (tx.notes || "").toLowerCase().includes(q);
      const matchCat = (tx.category || "").toLowerCase().includes(q);
      const matchTag = (tx.tags || []).some((tag) => tag.toLowerCase().includes(q));
      if (!matchNote && !matchCat && !matchTag) return false;
    }
    return true;
  });

  return (
    <div className="view-content-wrapper">
      {/* Search and Filters Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {(["all", "expense", "income", "recurring"] as const).map((tab) => (
            <button
              key={tab}
              id={`filter-tab-${tab}`}
              className={`btn-secondary ${filterType === tab ? "active" : ""}`}
              style={{
                background: filterType === tab ? "var(--bg-card-hover)" : "var(--bg-surface)",
                borderColor: filterType === tab ? "var(--accent-cyan)" : "var(--border-subtle)",
                textTransform: "capitalize"
              }}
              onClick={() => setFilterType(tab)}
            >
              {tab === "all" ? "All Entries" : tab === "recurring" ? "Recurring Only" : tab === "expense" ? "Spending" : "Income"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Search Field */}
          <div style={{ position: "relative", width: "280px" }}>
            <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              id="input-search-transactions"
              placeholder="Search notes, #tags, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-main)",
                fontSize: "13px"
              }}
            />
          </div>

          <button className="btn-primary" onClick={onOpenAddTransaction}>
            <Plus size={15} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className="data-table-container">
        {filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            No transactions found matching your filter criteria.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Flow</th>
                <th>Category & Tags</th>
                <th>Notes / Merchant</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th style={{ textAlign: "center", width: "70px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>{tx.date}</td>
                  <td>
                    <span className={`badge-tag ${tx.type === "income" ? "badge-income" : "badge-expense"}`}>
                      {tx.type === "income" ? (
                        <>
                          <ArrowDownRight size={12} /> Income
                        </>
                      ) : (
                        <>
                          <ArrowUpRight size={12} /> Spending
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{tx.category}</span>
                        {tx.isRecurring && (
                          <span title="Recurring monthly commitment" style={{ color: "var(--accent-cyan)", display: "flex" }}>
                            <Repeat size={12} />
                          </span>
                        )}
                      </div>
                      {tx.tags && tx.tags.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {tx.tags.map((tag) => (
                            <span 
                              key={tag} 
                              style={{ 
                                fontSize: "10.5px", 
                                color: "var(--accent-cyan)", 
                                background: "var(--accent-cyan-bg)", 
                                padding: "1px 6px", 
                                borderRadius: "4px" 
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{tx.notes}</td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`amount-mono ${tx.type === "income" ? "metric-value income" : "metric-value expense"}`} style={{ fontSize: "14px" }}>
                      {tx.type === "income" ? "+" : "-"}{formatPaiseToRupees(tx.amountPaise)}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button 
                      onClick={() => onDeleteTransaction(tx.id)}
                      style={{ padding: "4px 8px", background: "transparent", border: "none", color: "var(--expense-rose)", cursor: "pointer" }} 
                      title="Delete Transaction"
                      id={`btn-delete-${tx.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
