import type { Account, CategoryBudget, Transaction, Trip, TripExpense, TravelCategory } from "../types/index.ts";
import { addPaise } from "./money.ts";
import { computeBudgetProgress } from "./finance.ts";

export const SPENDING_WORKSPACES = [
  { id: "food", title: "Food & Dining", description: "Groceries, dining out, and meals on your trips.", color: "#f59e0b", categories: ["Groceries", "Dining Out"], travelCategories: ["food"], defaultCategory: "Dining Out", action: "Record food expense", breakdownTitle: "Groceries vs. dining", recurringTitle: "Recurring food spending" },
  { id: "subscriptions", title: "Subscriptions", description: "Recorded subscription charges and recurring commitments.", color: "#a78bfa", categories: ["Subscriptions"], travelCategories: [], defaultCategory: "Subscriptions", action: "Record subscription charge", breakdownTitle: "Recorded services", recurringTitle: "Recurring charges recorded" },
  { id: "transport", title: "Transport & Fuel", description: "Daily fuel, journeys, and transport on your trips.", color: "#60a5fa", categories: ["Fuel", "Transport"], travelCategories: ["transport", "fuel"], defaultCategory: "Fuel", action: "Record transport expense", breakdownTitle: "Fuel vs. transport", recurringTitle: "Recurring transport spending" },
  { id: "home", title: "Home & Utilities", description: "Rent, household bills, and your share of travel accommodation.", color: "#2dd4bf", categories: ["Rent", "Utilities", "Home"], travelCategories: ["stay"], defaultCategory: "Utilities", action: "Record household bill", breakdownTitle: "Housing & bills", recurringTitle: "Recurring bills recorded" },
  { id: "care", title: "Personal Care & Wellness", description: "Personal care, wellbeing, and healthcare spending.", color: "#f472b6", categories: ["Personal Care", "Healthcare"], travelCategories: [], defaultCategory: "Personal Care", action: "Record care expense", breakdownTitle: "Care & healthcare", recurringTitle: "Recurring care spending" },
  { id: "shopping", title: "Shopping", description: "Everyday purchases and your share of travel souvenirs.", color: "#fb923c", categories: ["Shopping"], travelCategories: ["shopping"], defaultCategory: "Shopping", action: "Record purchase", breakdownTitle: "Purchases by merchant", recurringTitle: "Recurring purchases" }
] as const;

export type WorkspaceId = typeof SPENDING_WORKSPACES[number]["id"];
export type SpendingWorkspace = typeof SPENDING_WORKSPACES[number];

export function getWorkspace(id: WorkspaceId): SpendingWorkspace {
  return SPENDING_WORKSPACES.find((workspace) => workspace.id === id)!;
}

export function workspaceForCategory(category: string): WorkspaceId | undefined {
  return SPENDING_WORKSPACES.find((workspace) => (workspace.categories as readonly string[]).includes(category))?.id;
}

export function workspaceForTravelCategory(category: TravelCategory): WorkspaceId | undefined {
  return SPENDING_WORKSPACES.find((workspace) => (workspace.travelCategories as readonly string[]).includes(category))?.id;
}

export interface SpendingEntry {
  key: string;
  date: string;
  title: string;
  category: string;
  amountPaise: number;
  source: "ledger" | "travel";
  sourceLabel: string;
  tags: string[];
  isRecurring: boolean;
  transaction?: Transaction;
  tripExpense?: TripExpense;
  trip?: Trip;
  linkedTransaction?: Transaction;
}

export function buildSpendingEntries(workspaceId: WorkspaceId, month: string, transactions: Transaction[],
  trips: Trip[], tripExpenses: TripExpense[], accounts: Account[]): SpendingEntry[] {
  const workspace = getWorkspace(workspaceId);
  const tripMap = new Map(trips.map((trip) => [trip.id, trip]));
  const existingExpenses = new Set(tripExpenses.filter((expense) => tripMap.has(expense.tripId)).map((expense) => expense.id));
  const linked = new Map(transactions.filter((tx) => tx.tripExpenseId && existingExpenses.has(tx.tripExpenseId))
    .map((tx) => [tx.tripExpenseId, tx]));
  const accountMap = new Map(accounts.map((account) => [account.id, account.name]));
  const ledger: SpendingEntry[] = transactions
    .filter((tx) => tx.type === "expense" && tx.date.startsWith(month)
      && !(tx.tripExpenseId && existingExpenses.has(tx.tripExpenseId))
      && (workspace.categories as readonly string[]).includes(tx.category))
    .map((tx) => ({
      key: `ledger:${tx.id}`, date: tx.date, title: tx.notes || tx.category, category: tx.category,
      amountPaise: tx.amountPaise, source: "ledger", sourceLabel: accountMap.get(tx.accountId) || tx.accountId,
      tags: tx.tags, isRecurring: tx.isRecurring, transaction: tx
    }));
  const travel: SpendingEntry[] = tripExpenses
    .filter((expense) => tripMap.has(expense.tripId) && expense.date.startsWith(month)
      && (workspace.travelCategories as readonly string[]).includes(expense.category))
    .map((expense) => ({
      key: `travel:${expense.id}`, date: expense.date, title: expense.title, category: expense.category,
      amountPaise: expense.mySharePaise, source: "travel", sourceLabel: tripMap.get(expense.tripId)!.name,
      tags: linked.get(expense.id)?.tags || [], isRecurring: false, tripExpense: expense,
      trip: tripMap.get(expense.tripId), linkedTransaction: linked.get(expense.id)
    }));
  return [...ledger, ...travel].sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key));
}

export function summarizeSpending(entries: SpendingEntry[]) {
  let totalPaise = 0;
  let ledgerPaise = 0;
  let travelPaise = 0;
  let recurringPaise = 0;
  for (const entry of entries) {
    totalPaise = addPaise(totalPaise, entry.amountPaise);
    if (entry.source === "travel") travelPaise = addPaise(travelPaise, entry.amountPaise);
    else ledgerPaise = addPaise(ledgerPaise, entry.amountPaise);
    if (entry.isRecurring) recurringPaise = addPaise(recurringPaise, entry.amountPaise);
  }
  return { totalPaise, ledgerPaise, travelPaise, recurringPaise };
}

export function workspaceBudgets(id: WorkspaceId, budgets: CategoryBudget[]) {
  return budgets.filter((budget) => (getWorkspace(id).categories as readonly string[]).includes(budget.category));
}

export function workspaceBudgetSummary(id: WorkspaceId, month: string, transactions: Transaction[], budgets: CategoryBudget[]) {
  const limits = workspaceBudgets(id, budgets);
  const spent = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type === "expense" && tx.date.startsWith(month) && workspaceForCategory(tx.category) === id) {
      spent.set(tx.category, addPaise(spent.get(tx.category) || 0, tx.amountPaise));
    }
  }
  const progress = limits.map((budget) => computeBudgetProgress(spent.get(budget.category) || 0, budget.limitPaise));
  return {
    limits, spent,
    limitPaise: limits.reduce((total, budget) => addPaise(total, budget.limitPaise), 0),
    remainingPaise: progress.reduce((total, budget) => addPaise(total, budget.remainingPaise), 0),
    isOver: progress.some((budget) => budget.isOver)
  };
}

export function sourceLinkCategory(expense: TripExpense): string | undefined {
  const workspace = workspaceForTravelCategory(expense.category);
  if (!workspace) return undefined;
  if (expense.category === "stay") return "Home";
  if (expense.category === "transport") return "Transport";
  if (expense.category === "shopping") return "Shopping";
  if (expense.category === "fuel") return "Fuel";
  return "Dining Out";
}
