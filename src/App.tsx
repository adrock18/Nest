import React, { useState, useMemo, useEffect, useCallback } from "react";
import "./styles/theme.css";
import { Sidebar, NavTab } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardView } from "./views/DashboardView";
import { TransactionsView } from "./views/TransactionsView";
import { BudgetsView } from "./views/BudgetsView";
import { TravelView } from "./views/TravelView";
import { SettingsView } from "./views/SettingsView";
import { AddTransactionModal } from "./components/AddTransactionModal";
import { AddAccountModal } from "./components/AddAccountModal";
import {
  Transaction,
  Category,
  CategoryBudget,
  Account,
  Trip,
  TripExpense
} from "./types";
import { api } from "./services/api";
import { calculateMonthlySummary, calculateAccountBalances } from "./utils/finance";
import { getLocalDate } from "./utils/dates";
import { addPaise } from "./utils/money";

function getCurrentYM(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allTransactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripExpenses, setTripExpenses] = useState<TripExpense[]>([]);
  const [dbPath, setDbPath] = useState("%LOCALAPPDATA%\\Nest\\nest.db");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYM);

  // Theme State
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("nest-theme");
    return (saved === "light" || saved === "dark") ? saved : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nest-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Initial Data Hydration
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [accs, txs, bdgs, path, trps, trExp, cats] = await Promise.all([
        api.getAccounts(),
        api.getTransactions(),
        api.getBudgets(),
        api.getDatabasePath(),
        api.getTrips(),
        api.getTripExpenses(),
        api.getCategories()
      ]);
      setAccounts(accs);
      setTransactions(txs);
      setBudgets(bdgs);
      setDbPath(path);
      setTrips(trps);
      setTripExpenses(trExp);
      setCategories(cats);
      setLoadError("");
    } catch (err) {
      console.error("Failed to hydrate data from storage:", err);
      setLoadError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || isAddModalOpen || isAccountModalOpen) return;
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select" ||
          (document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable)) {
        if (e.key === "Escape") {
          setIsAddModalOpen(false);
          setIsAccountModalOpen(false);
          setEditingTransaction(null);
          setEditingAccount(null);
        }
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setEditingTransaction(null);
        setIsAddModalOpen(true);
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setActiveTab("transactions");
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        setActiveTab("dashboard");
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setActiveTab("budgets");
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        setActiveTab("travel");
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setActiveTab("settings");
      } else if (e.key === "Escape") {
        setIsAddModalOpen(false);
        setIsAccountModalOpen(false);
        setEditingTransaction(null);
        setEditingAccount(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddModalOpen, isAccountModalOpen]);

  // Financial Calculations (Memoized)
  const transactions = useMemo(() => allTransactions.filter((tx) => tx.date.startsWith(selectedMonth)),
    [allTransactions, selectedMonth]);
  const summary = useMemo(() => calculateMonthlySummary(transactions), [transactions]);

  // Dynamic Account Balances
  const accountBalances = useMemo(() => calculateAccountBalances(accounts, allTransactions), [accounts, allTransactions]);

  // Dynamic Category Spending Breakdown
  const categoryBreakdown = useMemo(() => {
    const expensesByCategory: Record<string, number> = {};
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.type === "expense") {
        expensesByCategory[tx.category] = addPaise(expensesByCategory[tx.category] || 0, tx.amountPaise);
        totalExpense = addPaise(totalExpense, tx.amountPaise);
      }
    }

    if (totalExpense === 0) return [];

    return Object.entries(expensesByCategory)
      .map(([name, spentPaise]) => ({
        name,
        spentPaise,
        pct: spentPaise / totalExpense * 100,
        color: categories.find((c) => c.name === name)?.color || "#64748b"
      }))
      .sort((a, b) => b.spentPaise - a.spentPaise);
  }, [transactions, categories]);

  // === Transaction Actions ===
  const handleAddTransaction = async (newTx: Omit<Transaction, "id">) => {
    const created: Transaction = {
      ...newTx,
      id: `tx-${crypto.randomUUID()}`
    };
    try {
      const saved = await api.createTransaction(created);
      setTransactions((prev) => [saved, ...prev]);
    } catch (err) {
      console.error("Failed to create transaction:", err);
      throw err;
    }
  };

  const handleEditTransaction = async (updated: Transaction) => {
    try {
      if (!await api.updateTransaction(updated)) throw new Error("Transaction no longer exists.");
      setTransactions((prev) => prev.map((tx) => (tx.id === updated.id ? updated : tx)));
    } catch (err) {
      console.error("Failed to update transaction:", err);
      throw err;
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      if (!await api.deleteTransaction(id)) throw new Error("Transaction no longer exists.");
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      setActionError(`Could not delete transaction: ${String(err)}`);
    }
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  // === Account Actions ===
  const handleSaveAccount = async (account: Account) => {
    try {
      await api.createAccount(account);
      setAccounts((prev) => {
        const exists = prev.some((a) => a.id === account.id);
        if (exists) {
          return prev.map((a) => (a.id === account.id ? account : a));
        }
        return [...prev, account];
      });
    } catch (err) {
      console.error("Failed to save account:", err);
      throw err;
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      if (!await api.deleteAccount(id)) throw new Error("Account no longer exists.");
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete account:", err);
      setActionError(`Could not delete account: ${String(err)}`);
    }
  };

  // === Budget Actions ===
  const handleSetBudget = async (budget: CategoryBudget) => {
    try {
      await api.setBudget(budget);
      setBudgets((prev) => {
        const exists = prev.some((b) => b.category === budget.category);
        if (exists) {
          return prev.map((b) => (b.category === budget.category ? budget : b));
        }
        return [...prev, budget];
      });
    } catch (err) {
      console.error("Failed to set budget:", err);
      throw err;
    }
  };

  // === Category Actions ===
  const handleAddCategory = async (category: Category) => {
    try {
      await api.createCategory(category);
      setCategories((prev) => [...prev, category]);
    } catch (err) {
      console.error("Failed to create category:", err);
      throw err;
    }
  };

  // === Travel Actions ===
  const handleAddTrip = async (newTripData: Omit<Trip, "id" | "createdAt">) => {
    const created: Trip = {
      ...newTripData,
      id: `trip-${Date.now()}`,
      createdAt: getLocalDate()
    };
    try {
      await api.createTrip(created);
      setTrips((prev) => [created, ...prev]);
    } catch (err) {
      console.error("Failed to create trip:", err);
    }
  };

  const handleUpdateTrip = async (updatedTrip: Trip) => {
    try {
      await api.updateTrip(updatedTrip);
      setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
    } catch (err) {
      console.error("Failed to update trip:", err);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    try {
      await api.deleteTrip(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
      setTripExpenses((prev) => prev.filter((e) => e.tripId !== id));
    } catch (err) {
      console.error("Failed to delete trip:", err);
    }
  };

  const handleAddTripExpense = async (newExpData: Omit<TripExpense, "id">) => {
    const created: TripExpense = {
      ...newExpData,
      id: `texp-${Date.now()}`
    };
    try {
      await api.createTripExpense(created);
      setTripExpenses((prev) => [created, ...prev]);
    } catch (err) {
      console.error("Failed to create trip expense:", err);
    }
  };

  const handleDeleteTripExpense = async (id: string) => {
    try {
      await api.deleteTripExpense(id);
      setTripExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Failed to delete trip expense:", err);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-app)",
        color: "var(--text-main)",
        fontFamily: "var(--font-sans)"
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>Nest</div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Loading financial workspace...</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <main className="workspace-load-error">
        <h1>Unable to open your workspace</h1>
        <p>Your data has not been replaced. Resolve the storage issue and try again.</p>
        <p className="form-error" role="alert">{loadError}</p>
        <button className="btn-primary" onClick={loadInitialData}>Try again</button>
      </main>
    );
  }

  return (
    <div className="app-layout">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="app-main">
        <Header
          activeTab={activeTab}
          onOpenAddTransaction={() => { setEditingTransaction(null); setIsAddModalOpen(true); }}
          theme={theme}
          onToggleTheme={toggleTheme}
          selectedMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
        />

        {actionError && (
          <div className="workspace-alert" role="alert">
            <span>{actionError}</span>
            <button className="btn-secondary" onClick={() => setActionError("")}>Dismiss</button>
          </div>
        )}

        {activeTab === "dashboard" && (
          <DashboardView
            summary={summary}
            categoryBreakdown={categoryBreakdown}
            budgets={budgets}
            accounts={accounts}
            accountBalances={accountBalances}
            selectedMonth={selectedMonth}
            transactionCount={transactions.length}
            onOpenAddTransaction={() => { setEditingTransaction(null); setIsAddModalOpen(true); }}
            onNavigateToBudgets={() => setActiveTab("budgets")}
            onNavigateToTransactions={() => setActiveTab("transactions")}
          />
        )}

        {activeTab === "transactions" && (
          <TransactionsView
            transactions={transactions}
            accounts={accounts}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenAddTransaction={() => { setEditingTransaction(null); setIsAddModalOpen(true); }}
            onEditTransaction={handleOpenEditTransaction}
          />
        )}

        {activeTab === "budgets" && (
          <BudgetsView
            budgets={budgets}
            transactions={transactions}
            categories={categories}
            onOpenAddTransaction={() => { setEditingTransaction(null); setIsAddModalOpen(true); }}
            onSetBudget={handleSetBudget}
            onAddCategory={handleAddCategory}
          />
        )}

        {activeTab === "travel" && (
          <TravelView
            trips={trips}
            tripExpenses={tripExpenses}
            onAddTrip={handleAddTrip}
            onUpdateTrip={handleUpdateTrip}
            onDeleteTrip={handleDeleteTrip}
            onAddExpense={handleAddTripExpense}
            onDeleteExpense={handleDeleteTripExpense}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView
            transactions={allTransactions}
            accounts={accounts}
            budgets={budgets}
            categories={categories}
            databasePath={dbPath}
            trips={trips}
            tripExpenses={tripExpenses}
            onAddAccount={() => { setEditingAccount(null); setIsAccountModalOpen(true); }}
            onEditAccount={(acc) => { setEditingAccount(acc); setIsAccountModalOpen(true); }}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </div>

      {/* Transaction Modal (Add / Edit) */}
      {isAddModalOpen && <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingTransaction(null); }}
        accounts={accounts}
        categories={categories}
        onAddTransaction={handleAddTransaction}
        onEditTransaction={handleEditTransaction}
        editingTransaction={editingTransaction}
      />}

      {/* Account Modal (Add / Edit) */}
      {isAccountModalOpen && <AddAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => { setIsAccountModalOpen(false); setEditingAccount(null); }}
        onSaveAccount={handleSaveAccount}
        editingAccount={editingAccount}
      />}
    </div>
  );
};

export default App;
