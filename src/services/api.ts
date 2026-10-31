import { invoke } from "@tauri-apps/api/core";
import { Transaction, Account, CategoryBudget, MonthlyFinancialSummary, Trip, TripExpense } from "../types";

// Check if running inside native Tauri desktop window
export const isTauriDesktop = (): boolean => {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
};

// Local storage fallback for web development mode
const STORAGE_KEYS = {
  ACCOUNTS: "nest_db_accounts",
  TRANSACTIONS: "nest_db_transactions",
  BUDGETS: "nest_db_budgets",
  TRIPS: "nest_db_trips",
  TRIP_EXPENSES: "nest_db_trip_expenses",
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
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore storage quota
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
    // Defensive normalization: Clean up any legacy bank brands (HDFC, ICICI) to unified Primary Amount
    const hasLegacy = accounts.some(
      (a) => a.id === "acc-hdfc" || a.id === "acc-icici" || a.name.includes("HDFC") || a.name.includes("ICICI")
    );
    if (hasLegacy) {
      const totalStarting = accounts.reduce((sum, a) => {
        return sum + (a.type === "credit" ? -a.startingBalancePaise : a.startingBalancePaise);
      }, 0);
      accounts = [
        {
          id: "acc-primary",
          name: "Primary Amount",
          type: "bank",
          startingBalancePaise: Math.max(15000000, totalStarting)
        }
      ];
      if (!isTauriDesktop()) {
        setStored(STORAGE_KEYS.ACCOUNTS, accounts);
      }
    }
    return accounts.length > 0 ? accounts : SEED_ACCOUNTS;
  },

  // Transactions
  async getTransactions(monthPrefix?: string): Promise<Transaction[]> {
    let all: Transaction[];
    if (isTauriDesktop()) {
      all = await invoke<Transaction[]>("get_transactions", { monthPrefix });
    } else {
      all = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    }
    // Normalize transaction accountId to primary if it referenced legacy accounts
    all = all.map((t) => {
      if (t.accountId === "acc-hdfc" || t.accountId === "acc-icici" || t.accountId === "acc-cash") {
        return { ...t, accountId: "acc-primary" };
      }
      return t;
    });
    if (monthPrefix) {
      return all.filter((t) => t.date.startsWith(monthPrefix));
    }
    return all;
  },

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    if (isTauriDesktop()) {
      return await invoke<Transaction>("create_transaction", { transaction });
    }
    const current = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    const updated = [transaction, ...current];
    setStored(STORAGE_KEYS.TRANSACTIONS, updated);
    return transaction;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    if (isTauriDesktop()) {
      return await invoke<boolean>("delete_transaction", { id });
    }
    const current = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    const updated = current.filter((t) => t.id !== id);
    setStored(STORAGE_KEYS.TRANSACTIONS, updated);
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
    const txs = await this.getTransactions(monthPrefix);
    let inflow = 0;
    let outflow = 0;
    let recurring = 0;

    for (const t of txs) {
      if (t.type === "income") {
        inflow += t.amountPaise;
      } else {
        outflow += t.amountPaise;
        if (t.isRecurring) recurring += t.amountPaise;
      }
    }

    const net = inflow - outflow;
    const rate = inflow > 0 ? (net / inflow) * 100 : 0;

    return {
      totalInflowPaise: inflow,
      totalOutflowPaise: outflow,
      netSavingsPaise: net,
      savingsRatePercentage: Math.max(0, rate),
      recurringCommitmentPaise: recurring
    };
  },

  // Database Info & Backups
  async getDatabasePath(): Promise<string> {
    if (isTauriDesktop()) {
      return await invoke<string>("get_database_path");
    }
    return "%LOCALAPPDATA%\\Nest\\nest.db";
  },

  async backupDatabase(targetPath: string): Promise<string> {
    if (isTauriDesktop()) {
      return await invoke<string>("backup_database", { targetPath });
    }
    return targetPath;
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
    const updated = current.filter((t) => t.id !== id);
    setStored(STORAGE_KEYS.TRIPS, updated);

    // Also delete associated expenses
    const expenses = getStored<TripExpense[]>(STORAGE_KEYS.TRIP_EXPENSES, SEED_TRIP_EXPENSES);
    setStored(STORAGE_KEYS.TRIP_EXPENSES, expenses.filter((e) => e.tripId !== id));
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
    const updated = current.filter((e) => e.id !== id);
    setStored(STORAGE_KEYS.TRIP_EXPENSES, updated);
    return true;
  }
};
