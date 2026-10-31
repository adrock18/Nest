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
  MonthlyFinancialSummary,
  Account,
  Trip,
  TripExpense
} from "./types";
import { api } from "./services/api";

const CATEGORY_COLORS: Record<string, string> = {
  "Rent": "#0ea5e9",
  "Groceries": "#10b981",
  "Dining Out": "#f59e0b",
  "Fuel": "#8b5cf6",
  "Utilities": "#ec4899",
  "Subscriptions": "#f43f5e",
  "Healthcare": "#14b8a6",
  "Other": "#64748b"
};

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripExpenses, setTripExpenses] = useState<TripExpense[]>([]);
  const [dbPath, setDbPath] = useState("%LOCALAPPDATA%\\Nest\\nest.db");
  const [isLoading, setIsLoading] = useState(true);
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
        api.getTransactions(selectedMonth),
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
    } catch (err) {
      console.error("Failed to hydrate data from storage:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Reload transactions when month changes (after initial load)
  useEffect(() => {
    if (!isLoading) {
      api.getTransactions(selectedMonth).then(setTransactions).catch(console.error);
    }
  }, [selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
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
  }, []);

  // Financial Calculations (Memoized)
  const summary: MonthlyFinancialSummary = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let recurringCommitment = 0;

    for (const tx of transactions) {
      if (tx.type === "income") {
        inflow += tx.amountPaise;
      } else {
        outflow += tx.amountPaise;
        if (tx.isRecurring) {
          recurringCommitment += tx.amountPaise;
        }
      }
    }

    const netSavings = inflow - outflow;
    const savingsRate = inflow > 0 ? (netSavings / inflow) * 100 : 0;

    return {
      totalInflowPaise: inflow,
      totalOutflowPaise: outflow,
      netSavingsPaise: netSavings,
      savingsRatePercentage: Math.max(0, savingsRate),
      recurringCommitmentPaise: recurringCommitment
    };
  }, [transactions]);

  // Dynamic Account Balances
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    for (const acc of accounts) {
      balances[acc.id] = acc.startingBalancePaise;
    }

    for (const tx of transactions) {
      if (balances[tx.accountId] === undefined) continue;
      if (tx.type === "income") {
        balances[tx.accountId] += tx.amountPaise;
      } else {
        balances[tx.accountId] -= tx.amountPaise;
      }
    }

    return balances;
  }, [accounts, transactions]);

  // Dynamic Category Spending Breakdown
  const categoryBreakdown = useMemo(() => {
    const expensesByCategory: Record<string, number> = {};
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.type === "expense") {
        expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + tx.amountPaise;
        totalExpense += tx.amountPaise;
      }
    }

    if (totalExpense === 0) return [];

    return Object.entries(expensesByCategory)
      .map(([name, spentPaise]) => ({
        name,
        spentPaise,
        pct: Math.round((spentPaise / totalExpense) * 100),
        color: CATEGORY_COLORS[name] || "#38bdf8"
      }))
      .sort((a, b) => b.spentPaise - a.spentPaise);
  }, [transactions]);

  // === Transaction Actions ===
  const handleAddTransaction = async (newTx: Omit<Transaction, "id">) => {
    const created: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`
    };
    try {
      await api.createTransaction(created);
      // Re-filter: only add to list if it matches the current month
      if (created.date.startsWith(selectedMonth)) {
        setTransactions((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error("Failed to create transaction:", err);
    }
  };

  const handleEditTransaction = async (updated: Transaction) => {
    try {
      await api.updateTransaction(updated);
      if (updated.date.startsWith(selectedMonth)) {
        setTransactions((prev) => prev.map((tx) => (tx.id === updated.id ? updated : tx)));
      } else {
        // Moved to a different month — remove from current view
        setTransactions((prev) => prev.filter((tx) => tx.id !== updated.id));
      }
    } catch (err) {
      console.error("Failed to update transaction:", err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch (err) {
      console.error("Failed to delete transaction:", err);
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
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await api.deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete account:", err);
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
    }
  };

  // === Category Actions ===
  const handleAddCategory = async (category: Category) => {
    try {
      await api.createCategory(category);
      setCategories((prev) => [...prev, category]);
    } catch (err) {
      console.error("Failed to create category:", err);
    }
  };

  // === Travel Actions ===
  const handleAddTrip = async (newTripData: Omit<Trip, "id" | "createdAt">) => {
    const created: Trip = {
      ...newTripData,
      id: `trip-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0]
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

        {activeTab === "dashboard" && (
          <DashboardView
            summary={summary}
            categoryBreakdown={categoryBreakdown}
            budgets={budgets}
            accounts={accounts}
            accountBalances={accountBalances}
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
            transactions={transactions}
            accounts={accounts}
            budgets={budgets}
            databasePath={dbPath}
            onAddAccount={() => { setEditingAccount(null); setIsAccountModalOpen(true); }}
            onEditAccount={(acc) => { setEditingAccount(acc); setIsAccountModalOpen(true); }}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </div>

      {/* Transaction Modal (Add / Edit) */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingTransaction(null); }}
        accounts={accounts}
        categories={categories}
        onAddTransaction={handleAddTransaction}
        onEditTransaction={handleEditTransaction}
        editingTransaction={editingTransaction}
      />

      {/* Account Modal (Add / Edit) */}
      <AddAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => { setIsAccountModalOpen(false); setEditingAccount(null); }}
        onSaveAccount={handleSaveAccount}
        editingAccount={editingAccount}
      />
    </div>
  );
};

export default App;
