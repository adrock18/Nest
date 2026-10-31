import { invoke } from "@tauri-apps/api/core";
import type { Transaction, Account, Category, CategoryBudget, MonthlyFinancialSummary, Trip, TripExpense } from "../types/index.ts";
import { calculateMonthlySummary } from "../utils/finance.ts";
import { isValidStrictCalendarDate } from "../utils/dates.ts";

// Check if running inside native Tauri desktop window
export const isTauriDesktop = (): boolean => {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
};

// Local storage fallback for web development mode
const STORAGE_KEYS = {
  ACCOUNTS: "nest_db_accounts",
  TRANSACTIONS: "nest_db_transactions",
  BUDGETS: "nest_db_budgets",
  CATEGORIES: "nest_db_categories",
  TRIPS: "nest_db_trips",
  TRIP_EXPENSES: "nest_db_trip_expenses",
  CONNECTED_CATEGORIES: "nest_db_connected_categories_v1",
};

const SEED_ACCOUNTS: Account[] = [
  { id: "acc-primary", name: "Primary Amount", type: "bank", startingBalancePaise: 15000000 }
];

const SEED_TRANSACTIONS: Transaction[] = [
  { 
    id: "tx-1", 
    date: "2026-10-18", 
    type: "expense", 
    accountId: "acc-primary",
    category: "Groceries", 
    notes: "Weekly organic vegetables & dairy at Nature's Basket", 
    tags: ["#Groceries", "#Organic"],
    isRecurring: false,
    amountPaise: 845000 
  },
  { 
    id: "tx-2", 
    date: "2026-10-16", 
    type: "expense", 
    accountId: "acc-primary",
    category: "Dining Out", 
    notes: "Family weekend lunch at Toit", 
    tags: ["#Weekend", "#Dining"],
    isRecurring: false,
    amountPaise: 420000 
  },
  { 
    id: "tx-3", 
    date: "2026-10-15", 
    type: "expense", 
    accountId: "acc-primary",
    category: "Fuel", 
    notes: "Vehicle petrol tank refill at Shell", 
    tags: ["#Transit", "#Commute"],
    isRecurring: false,
    amountPaise: 380000 
  },
  { 
    id: "tx-4", 
    date: "2026-10-10", 
    type: "expense", 
    accountId: "acc-primary",
    category: "Utilities", 
    notes: "Airtel Xstream Fiber broadband & electricity", 
    tags: ["#Utilities", "#WorkFromHome"],
    isRecurring: true,
    amountPaise: 385000 
  },
  { 
    id: "tx-5", 
    date: "2026-10-05", 
    type: "expense", 
    accountId: "acc-primary",
    category: "Rent", 
    notes: "Monthly apartment lease transfer", 
    tags: ["#FixedCommitment", "#Housing"],
    isRecurring: true,
    amountPaise: 2200000 
  },
  { 
    id: "tx-6", 
    date: "2026-10-01", 
    type: "income", 
    accountId: "acc-primary",
    category: "Salary", 
    notes: "Monthly primary payroll credit", 
    tags: ["#Salary", "#PrimaryIncome"],
    isRecurring: true,
    amountPaise: 8500000 
  }
];

const SEED_BUDGETS: CategoryBudget[] = [
  { category: "Rent", limitPaise: 2500000, color: "#0ea5e9" },
  { category: "Groceries", limitPaise: 1000000, color: "#10b981" },
  { category: "Dining Out", limitPaise: 500000, color: "#f59e0b" },
  { category: "Fuel", limitPaise: 500000, color: "#8b5cf6" },
  { category: "Utilities", limitPaise: 400000, color: "#ec4899" },
  { category: "Subscriptions", limitPaise: 200000, color: "#f43f5e" }
];

const SEED_TRIPS: Trip[] = [
  {
    id: "trip-goa-2026",
    name: "Goa Coastal & Adventure Trip",
    destination: "Goa, India",
    startDate: "2026-10-18",
    endDate: "2026-10-24",
    budgetPaise: 6000000,
    members: ["Me", "Aarav", "Pooja", "Vikram"],
    coverColor: "#06b6d4",
    createdAt: "2026-10-15"
  }
];

const SEED_TRIP_EXPENSES: TripExpense[] = [
  {
    id: "texp-1",
    tripId: "trip-goa-2026",
    date: "2026-10-18",
    title: "Airport Prepaid Taxi to Resort",
    category: "transport",
    amountPaise: 240000,
    paidBy: "Me",
    splitType: "equal",
    splitMembers: ["Me", "Aarav", "Pooja", "Vikram"],
    mySharePaise: 60000,
    notes: "Prepaid counter taxi from Dabolim airport to Candolim"
  },
  {
    id: "texp-2",
    tripId: "trip-goa-2026",
    date: "2026-10-18",
    title: "Heritage Boutique Beach Villa - 3 Nights",
    category: "stay",
    amountPaise: 2400000,
    paidBy: "Aarav",
    splitType: "equal",
    splitMembers: ["Me", "Aarav", "Pooja", "Vikram"],
    mySharePaise: 600000,
    notes: "4-bedroom private villa with pool close to the beach"
  },
  {
    id: "texp-3",
    tripId: "trip-goa-2026",
    date: "2026-10-19",
    title: "Morning Surfing Lessons & Board Rental",
    category: "activities",
    amountPaise: 600000,
    paidBy: "Me",
    splitType: "custom",
    splitMembers: ["Me", "Vikram"],
    mySharePaise: 300000,
    notes: "2-hour beginner surfing session with instructor at Ashwem Beach"
  },
  {
    id: "texp-4",
    tripId: "trip-goa-2026",
    date: "2026-10-20",
    title: "Backwater Sea Kayaking & Mangrove Safari",
    category: "activities",
    amountPaise: 480000,
    paidBy: "Pooja",
    splitType: "equal",
    splitMembers: ["Me", "Aarav", "Pooja", "Vikram"],
    mySharePaise: 120000,
    notes: "Guided double kayaks through Chapora river mangroves"
  },
  {
    id: "texp-5",
    tripId: "trip-goa-2026",
    date: "2026-10-20",
    title: "Seafood Dinner at Fisherman's Wharf",
    category: "food",
    amountPaise: 520000,
    paidBy: "Me",
    splitType: "equal",
    splitMembers: ["Me", "Aarav", "Pooja", "Vikram"],
    mySharePaise: 130000,
    notes: "Butter garlic prawns, fish curry, cocktails and desserts"
  },
  {
    id: "texp-6",
    tripId: "trip-goa-2026",
    date: "2026-10-21",
    title: "Car Petrol Tank Refill & Highway Tolls",
    category: "fuel",
    amountPaise: 320000,
    paidBy: "Vikram",
    splitType: "equal",
    splitMembers: ["Me", "Aarav", "Pooja", "Vikram"],
    mySharePaise: 80000,
    notes: "HPCL petrol refill for rented Thar"
  }
];

// In-Memory / Local Storage Helper
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultVal;
    const parsed = JSON.parse(raw);
    if (Array.isArray(defaultVal) && !Array.isArray(parsed)) throw new Error("Expected a stored collection.");
    return parsed;
  } catch (error) {
    throw new Error(`Could not read ${key}. Your stored data has not been replaced: ${String(error)}`);
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (error) {
    throw new Error(`Could not save data. Check available browser storage: ${String(error)}`);
  }
}

function setStoredTogether(changes: { key: string; value: unknown }[]): void {
  const originals = changes.map(({ key }) => ({ key, raw: localStorage.getItem(key) }));
  let written = 0;
  try {
    for (const { key, value } of changes) {
      setStored(key, value);
      written++;
    }
  } catch (error) {
    try {
      for (const { key, raw } of originals.slice(0, written).reverse()) {
        if (raw === null) localStorage.removeItem(key);
        else localStorage.setItem(key, raw);
      }
    } catch (rollbackError) {
      throw new Error(`Save failed and browser storage could not be restored. Reload and check your data: ${String(error)}; ${String(rollbackError)}`);
    }
    throw error;
  }
}

async function validateTransaction(transaction: Transaction): Promise<void> {
  if (!Number.isSafeInteger(transaction.amountPaise) || transaction.amountPaise <= 0) {
    throw new Error("Amount must be a positive whole-paise value within the supported limit.");
  }
  if (!isValidStrictCalendarDate(transaction.date)) throw new Error("Enter a valid calendar date.");
  const accounts = await api.getAccounts();
  if (!accounts.some((a) => a.id === transaction.accountId)) throw new Error("Choose an existing account.");
  const categories = await api.getCategories();
  if (!categories.some((c) => c.name === transaction.category && c.isIncome === (transaction.type === "income"))) {
    throw new Error("Choose a category matching the transaction flow.");
  }
  if (transaction.tripExpenseId) {
    const expenses = await api.getTripExpenses();
    const trips = await api.getTrips();
    if (transaction.type !== "expense" || !expenses.some((expense) => expense.id === transaction.tripExpenseId && trips.some((trip) => trip.id === expense.tripId))) {
      throw new Error("Choose an existing travel expense for the source link.");
    }
    if ((await api.getTransactions()).some((tx) => tx.id !== transaction.id && tx.tripExpenseId === transaction.tripExpenseId)) {
      throw new Error("This travel expense is already linked to another ledger entry.");
    }
  }
}

export const api = {
  // Accounts
  async getAccounts(): Promise<Account[]> {
    let accounts: Account[];
    if (isTauriDesktop()) {
      accounts = await invoke<Account[]>("get_accounts");
    } else {
      accounts = getStored<Account[]>(STORAGE_KEYS.ACCOUNTS, SEED_ACCOUNTS);
    }
    return accounts;
  },

  // Transactions
  async getTransactions(monthPrefix?: string): Promise<Transaction[]> {
    let all: Transaction[];
    if (isTauriDesktop()) {
      all = await invoke<Transaction[]>("get_transactions", { monthPrefix });
    } else {
      all = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    }
    if (monthPrefix) {
      return all.filter((t) => t.date.startsWith(monthPrefix));
    }
    return all;
  },

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    await validateTransaction(transaction);
    if (isTauriDesktop()) {
      return await invoke<Transaction>("create_transaction", { transaction });
    }
    const current = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    if (current.some((tx) => tx.id === transaction.id)) throw new Error("Transaction ID already exists.");
    const updated = [transaction, ...current];
    setStored(STORAGE_KEYS.TRANSACTIONS, updated);
    return transaction;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    if (isTauriDesktop()) {
      return await invoke<boolean>("delete_transaction", { id });
    }
    const current = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    if (!current.some((t) => t.id === id)) return false;
    const updated = current.filter((t) => t.id !== id);
    setStored(STORAGE_KEYS.TRANSACTIONS, updated);
    return true;
  },

  async updateTransaction(transaction: Transaction): Promise<boolean> {
    await validateTransaction(transaction);
    if (isTauriDesktop()) {
      return await invoke<boolean>("update_transaction", { transaction });
    }
    const current = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    if (!current.some((t) => t.id === transaction.id)) throw new Error("Transaction no longer exists.");
    const updated = current.map((t) => (t.id === transaction.id ? transaction : t));
    setStored(STORAGE_KEYS.TRANSACTIONS, updated);
    return true;
  },

  // Accounts CRUD
  async createAccount(account: Account): Promise<Account> {
    if (!account.name.trim()) throw new Error("Account name is required.");
    if (!Number.isSafeInteger(account.startingBalancePaise) || account.startingBalancePaise < 0) {
      throw new Error("Starting balance must be a non-negative whole-paise amount.");
    }
    if (isTauriDesktop()) {
      return await invoke<Account>("create_account", { account });
    }
    const current = getStored<Account[]>(STORAGE_KEYS.ACCOUNTS, SEED_ACCOUNTS);
    const updated = [...current.filter((a) => a.id !== account.id), account];
    setStored(STORAGE_KEYS.ACCOUNTS, updated);
    return account;
  },

  async deleteAccount(id: string): Promise<boolean> {
    if ((await this.getTransactions()).some((tx) => tx.accountId === id)) {
      throw new Error("This account has transactions. Move or delete them before deleting the account.");
    }
    if (isTauriDesktop()) {
      return await invoke<boolean>("delete_account", { id });
    }
    const current = getStored<Account[]>(STORAGE_KEYS.ACCOUNTS, SEED_ACCOUNTS);
    if (!current.some((account) => account.id === id)) return false;
    setStored(STORAGE_KEYS.ACCOUNTS, current.filter((a) => a.id !== id));
    return true;
  },

  // Budgets
  async getBudgets(): Promise<CategoryBudget[]> {
    if (isTauriDesktop()) {
      return await invoke<CategoryBudget[]>("get_budgets");
    }
    return getStored<CategoryBudget[]>(STORAGE_KEYS.BUDGETS, SEED_BUDGETS);
  },

  async setBudget(budget: CategoryBudget): Promise<CategoryBudget> {
    if (!Number.isSafeInteger(budget.limitPaise) || budget.limitPaise <= 0) {
      throw new Error("Budget must be a positive whole-paise amount.");
    }
    if (isTauriDesktop()) {
      return await invoke<CategoryBudget>("set_budget", { budget });
    }
    const current = getStored<CategoryBudget[]>(STORAGE_KEYS.BUDGETS, SEED_BUDGETS);
    const updated = current.filter((b) => b.category !== budget.category).concat(budget);
    setStored(STORAGE_KEYS.BUDGETS, updated);
    return budget;
  },

  // Monthly Summary
  async getMonthlySummary(monthPrefix: string): Promise<MonthlyFinancialSummary> {
    if (isTauriDesktop()) {
      return await invoke<MonthlyFinancialSummary>("get_monthly_summary", { monthPrefix });
    }
    return calculateMonthlySummary(await this.getTransactions(monthPrefix));
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    if (isTauriDesktop()) {
      return await invoke<Category[]>("get_categories");
    }
    // Fallback: derive from seeded categories
    const stored = getStored<Category[]>(STORAGE_KEYS.CATEGORIES, [
      { id: "cat-rent", name: "Rent", color: "#0ea5e9", isIncome: false },
      { id: "cat-groceries", name: "Groceries", color: "#10b981", isIncome: false },
      { id: "cat-dining", name: "Dining Out", color: "#f59e0b", isIncome: false },
      { id: "cat-fuel", name: "Fuel", color: "#8b5cf6", isIncome: false },
      { id: "cat-utilities", name: "Utilities", color: "#ec4899", isIncome: false },
      { id: "cat-subscriptions", name: "Subscriptions", color: "#f43f5e", isIncome: false },
      { id: "cat-healthcare", name: "Healthcare", color: "#14b8a6", isIncome: false },
      { id: "cat-salary", name: "Salary", color: "#10b981", isIncome: true },
      { id: "cat-freelance", name: "Freelance", color: "#0ea5e9", isIncome: true },
      { id: "cat-other", name: "Other", color: "#94a3b8", isIncome: false },
      { id: "cat-general", name: "General Spending", color: "#64748b", isIncome: false },
    ]);
    const additions: Category[] = [
      { id: "cat-transport", name: "Transport", color: "#60a5fa", isIncome: false },
      { id: "cat-home", name: "Home", color: "#2dd4bf", isIncome: false },
      { id: "cat-personal-care", name: "Personal Care", color: "#f472b6", isIncome: false },
      { id: "cat-shopping", name: "Shopping", color: "#fb923c", isIncome: false }
    ];
    if (getStored(STORAGE_KEYS.CONNECTED_CATEGORIES, false)) return stored;
    const migrated = [...stored, ...additions.filter((category) => !stored.some((existing) => existing.name === category.name || existing.id === category.id))];
    setStoredTogether([{ key: STORAGE_KEYS.CATEGORIES, value: migrated }, { key: STORAGE_KEYS.CONNECTED_CATEGORIES, value: true }]);
    return migrated;
  },

  async createCategory(category: Category): Promise<Category> {
    if (!category.name.trim()) throw new Error("Category name is required.");
    if (isTauriDesktop()) {
      return await invoke<Category>("create_category", { category });
    }
    const current = await this.getCategories();
    if (current.some((c) => c.name.toLowerCase() === category.name.toLowerCase())) {
      throw new Error("A category with this name already exists.");
    }
    setStored(STORAGE_KEYS.CATEGORIES, [...current, category]);
    return category;
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (isTauriDesktop()) {
      return await invoke<boolean>("delete_category", { id });
    }
    const current = await this.getCategories();
    setStored(STORAGE_KEYS.CATEGORIES, current.filter((c) => c.id !== id));
    return true;
  },

  // Database Info & Backups
  async getDatabasePath(): Promise<string> {
    if (isTauriDesktop()) {
      return await invoke<string>("get_database_path");
    }
    return "Browser preview storage (localStorage); not a SQLite database";
  },

  async backupDatabase(targetPath: string): Promise<string> {
    if (isTauriDesktop()) {
      return await invoke<string>("backup_database", { targetPath });
    }
    throw new Error("SQLite backups are available only in the desktop app. Use the JSON snapshot in browser preview.");
  },

  // Trips & Travel Expenses
  async getTrips(): Promise<Trip[]> {
    if (isTauriDesktop()) {
      return await invoke<Trip[]>("get_trips");
    }
    return getStored<Trip[]>(STORAGE_KEYS.TRIPS, SEED_TRIPS);
  },

  async createTrip(trip: Trip): Promise<Trip> {
    if (isTauriDesktop()) {
      return await invoke<Trip>("create_trip", { trip });
    }
    const current = getStored<Trip[]>(STORAGE_KEYS.TRIPS, SEED_TRIPS);
    const updated = [trip, ...current.filter((t) => t.id !== trip.id)];
    setStored(STORAGE_KEYS.TRIPS, updated);
    return trip;
  },

  async updateTrip(trip: Trip): Promise<Trip> {
    if (isTauriDesktop()) {
      return await invoke<Trip>("create_trip", { trip });
    }
    const current = getStored<Trip[]>(STORAGE_KEYS.TRIPS, SEED_TRIPS);
    const updated = current.map((t) => (t.id === trip.id ? trip : t));
    setStored(STORAGE_KEYS.TRIPS, updated);
    return trip;
  },

  async deleteTrip(id: string): Promise<boolean> {
    if (isTauriDesktop()) {
      return await invoke<boolean>("delete_trip", { id });
    }
    const current = getStored<Trip[]>(STORAGE_KEYS.TRIPS, SEED_TRIPS);
    if (!current.some((trip) => trip.id === id)) return false;
    const updated = current.filter((t) => t.id !== id);
    const expenses = getStored<TripExpense[]>(STORAGE_KEYS.TRIP_EXPENSES, SEED_TRIP_EXPENSES);
    const deletedIds = new Set(expenses.filter((expense) => expense.tripId === id).map((expense) => expense.id));
    const transactions = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    setStoredTogether([
      { key: STORAGE_KEYS.TRIPS, value: updated },
      { key: STORAGE_KEYS.TRIP_EXPENSES, value: expenses.filter((e) => e.tripId !== id) },
      { key: STORAGE_KEYS.TRANSACTIONS, value: transactions.map((tx) => tx.tripExpenseId && deletedIds.has(tx.tripExpenseId) ? { ...tx, tripExpenseId: null } : tx) }
    ]);
    return true;
  },

  async getTripExpenses(tripId?: string): Promise<TripExpense[]> {
    if (isTauriDesktop()) {
      return await invoke<TripExpense[]>("get_trip_expenses", { tripId });
    }
    const all = getStored<TripExpense[]>(STORAGE_KEYS.TRIP_EXPENSES, SEED_TRIP_EXPENSES);
    if (tripId) {
      return all.filter((e) => e.tripId === tripId);
    }
    return all;
  },

  async createTripExpense(expense: TripExpense): Promise<TripExpense> {
    if (isTauriDesktop()) {
      return await invoke<TripExpense>("create_trip_expense", { expense });
    }
    const current = getStored<TripExpense[]>(STORAGE_KEYS.TRIP_EXPENSES, SEED_TRIP_EXPENSES);
    const updated = [expense, ...current.filter((e) => e.id !== expense.id)];
    setStored(STORAGE_KEYS.TRIP_EXPENSES, updated);
    return expense;
  },

  async deleteTripExpense(id: string): Promise<boolean> {
    if (isTauriDesktop()) {
      return await invoke<boolean>("delete_trip_expense", { id });
    }
    const current = getStored<TripExpense[]>(STORAGE_KEYS.TRIP_EXPENSES, SEED_TRIP_EXPENSES);
    if (!current.some((expense) => expense.id === id)) return false;
    const updated = current.filter((e) => e.id !== id);
    const transactions = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    setStoredTogether([
      { key: STORAGE_KEYS.TRIP_EXPENSES, value: updated },
      { key: STORAGE_KEYS.TRANSACTIONS, value: transactions.map((tx) => tx.tripExpenseId === id ? { ...tx, tripExpenseId: null } : tx) }
    ]);
    return true;
  }
};
