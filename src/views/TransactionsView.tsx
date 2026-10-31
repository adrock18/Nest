import React, { useState } from "react";
import { Search, ArrowDownRight, ArrowUpRight, Trash2, Plus, Repeat, Pencil } from "lucide-react";
import { Transaction, Account } from "../types";
import { formatPaiseToRupees } from "../utils/money";

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  onDeleteTransaction: (id: string) => void;
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  onDeleteTransaction,
  onOpenAddTransaction,
  onEditTransaction
}) => {
  const [filterType, setFilterType] = useState<"all" | "expense" | "income" | "recurring">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "largest">("newest");
  const accountNames = Object.fromEntries(accounts.map((account) => [account.id, account.name]));

  const safeTransactions = transactions || [];

  const filtered = safeTransactions.filter((tx) => {
    if (filterType === "expense" && tx.type !== "expense") return false;
    if (filterType === "income" && tx.type !== "income") return false;
    if (filterType === "recurring" && !tx.isRecurring) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchNote = (tx.notes || "").toLowerCase().includes(q);
      const matchCat = (tx.category || "").toLowerCase().includes(q);
      const matchTag = (tx.tags || []).some((tag) => tag.toLowerCase().includes(q));
      const matchAccount = (accountNames[tx.accountId] || "").toLowerCase().includes(q);
      if (!matchNote && !matchCat && !matchTag && !matchAccount) return false;
    }
    return true;
  }).sort((a, b) => sort === "largest" ? b.amountPaise - a.amountPaise || b.date.localeCompare(a.date)
    : sort === "oldest" ? a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
    : b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  return (
    <div className="view-content-wrapper">
      <div className="view-heading">
        <div><div className="eyebrow">EVERY ENTRY TELLS A STORY</div><h2>Your transactions</h2><p>Search and review the selected month's income and expenses.</p></div>
        <span className="panel-caption">{filtered.length} of {safeTransactions.length} entries</span>
      </div>
      {/* Search and Filters Toolbar */}
      <div className="transactions-toolbar">
        <div className="filter-group">
          {(["all", "expense", "income", "recurring"] as const).map((tab) => (
            <button
              key={tab}
              aria-pressed={filterType === tab}
              id={`filter-tab-${tab}`}
              className={`btn-secondary ${filterType === tab ? "active" : ""}`}
              style={{
                background: filterType === tab ? "var(--bg-card-hover)" : "var(--bg-surface)",
                borderColor: filterType === tab ? "var(--brand-nordic)" : "var(--border-subtle)",
                textTransform: "capitalize"
              }}
              onClick={() => setFilterType(tab)}
            >
              {tab === "all" ? "All Entries" : tab === "recurring" ? "Recurring Only" : tab === "expense" ? "Spending" : "Income"}
            </button>
          ))}
        </div>

        <div className="toolbar-actions">
          {/* Search Field */}
          <div className="transaction-search">
            <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              id="input-search-transactions"
              aria-label="Search transactions"
              placeholder="Notes, accounts, categories, #tags..."
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
          <select className="sort-select" aria-label="Sort transactions" value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="largest">Largest amount</option>
          </select>

          <button className="btn-primary" onClick={onOpenAddTransaction}>
            <Plus size={15} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className="data-table-container">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Search size={28} />
            <h3>{safeTransactions.length === 0 ? "No entries this month" : "No matching transactions"}</h3>
            <p>{safeTransactions.length === 0 ? "Add your first income or expense to get started." : "Try another search or reset the filters."}</p>
            {safeTransactions.length === 0 ? <button className="btn-primary" onClick={onOpenAddTransaction}>Record transaction</button>
              : <button className="btn-secondary" onClick={() => { setSearchQuery(""); setFilterType("all"); }}>Clear filters</button>}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Flow</th>
                <th>Account</th>
                <th>Category & Tags</th>
                <th>Notes / Merchant</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th style={{ textAlign: "center", width: "90px" }}>Actions</th>
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
                  <td>{accountNames[tx.accountId] || tx.accountId}</td>
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
                    <div style={{ display: "flex", justifyContent: "center", gap: "4px" }}>
                      <button
                        onClick={() => onEditTransaction(tx)}
                        style={{ padding: "4px 6px", background: "transparent", border: "none", color: "var(--accent-cyan)", cursor: "pointer" }}
                        title="Edit Transaction"
                        aria-label={`Edit transaction ${tx.notes || tx.category}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        style={{ padding: "4px 6px", background: "transparent", border: "none", color: "var(--expense-rose)", cursor: "pointer" }}
                        title="Delete Transaction"
                        aria-label={`Delete transaction ${tx.notes || tx.category}`}
                        id={`btn-delete-${tx.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
