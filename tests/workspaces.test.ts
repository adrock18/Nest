import assert from "node:assert/strict";
import type { Transaction, Trip, TripExpense, CategoryBudget } from "../src/types/index.ts";
import { SPENDING_WORKSPACES, buildSpendingEntries, summarizeSpending, workspaceForCategory,
  workspaceForTravelCategory, workspaceBudgetSummary } from "../src/utils/workspaces.ts";
import { calculateMonthlySummary } from "../src/utils/finance.ts";
import { exportTransactionsToCsv, buildAnalysisSheet } from "../src/utils/export.ts";

const trip: Trip = { id: "trip", name: "Holiday", destination: "Goa", startDate: "2026-09-30", endDate: "2026-10-05",
  budgetPaise: 100000, members: ["Me", "Friend"], createdAt: "2026-09-01" };
const meal: TripExpense = { id: "meal", tripId: trip.id, date: "2026-10-01", title: "Dinner", category: "food",
  amountPaise: 10001, mySharePaise: 5001, paidBy: "Friend", splitType: "equal", splitMembers: ["Me", "Friend"] };
const ledger: Transaction = { id: "ledger", date: meal.date, type: "expense", category: "Dining Out", amountPaise: 10001,
  notes: meal.title, accountId: "bank", tags: ["#holiday"], isRecurring: false };
const project = (transactions: Transaction[], expenses = [meal], trips = [trip], month = "2026-10") =>
  buildSpendingEntries("food", month, transactions, trips, expenses, []);

assert.equal(SPENDING_WORKSPACES.length, 6);
for (const workspace of SPENDING_WORKSPACES) {
  for (const category of workspace.categories) assert.equal(workspaceForCategory(category), workspace.id);
  for (const category of workspace.travelCategories) assert.equal(workspaceForTravelCategory(category), workspace.id);
}
assert.equal(workspaceForCategory("Custom"), undefined);
assert.equal(workspaceForTravelCategory("activities"), undefined);
assert.equal(workspaceForTravelCategory("other"), undefined);
assert.equal(summarizeSpending(project([ledger])).totalPaise, 15002, "Similar titles/dates/amounts do not imply duplication");
const linked = { ...ledger, tripExpenseId: meal.id };
const entries = project([linked]);
assert.equal(entries.length, 1);
assert.equal(entries[0].linkedTransaction?.id, ledger.id);
assert.deepEqual(entries[0].tags, ["#holiday"]);
assert.deepEqual(summarizeSpending(entries), { totalPaise: 5001, travelPaise: 5001, ledgerPaise: 0, recurringPaise: 0 });
assert.equal(summarizeSpending(project([{ ...linked, date: "2026-09-30" }])).totalPaise, 5001, "Links are resolved across all months");
assert.equal(project([{ ...linked, date: "2026-09-30" }], [meal], [trip], "2026-09").length, 0, "Personal spending follows source expense date");
assert.equal(summarizeSpending(project([linked], [{ ...meal, mySharePaise: 0 }])).totalPaise, 0, "A companion-only bill is not personal spending");
assert.equal(summarizeSpending(project([linked], [])).totalPaise, 10001, "A missing source restores the ledger expense");
assert.equal(summarizeSpending(project([linked], [meal], [])).totalPaise, 10001, "A missing trip never conceals ledger spending");
assert.equal(summarizeSpending(project([ledger], [{ ...meal, date: "2026-11-01" }])).totalPaise, 10001);
assert.equal(project([{ ...ledger, type: "income" }], []).length, 0);
assert.equal(project([{ ...ledger, category: "Other", tags: ["#food"] }], []).length, 0, "Tags do not override category classification");
assert.equal(calculateMonthlySummary([linked]).totalOutflowPaise, 10001, "Linking preserves account cash flow");
assert.throws(() => summarizeSpending(project([{ ...ledger, amountPaise: Number.MAX_SAFE_INTEGER }])), /safe|supported|large/i);
const recurring = buildSpendingEntries("subscriptions", "2026-10", [{ ...ledger, category: "Subscriptions", isRecurring: true }], [trip], [meal], []);
assert.equal(summarizeSpending(recurring).recurringPaise, ledger.amountPaise);
assert.equal(summarizeSpending(recurring).travelPaise, 0);

const budgets: CategoryBudget[] = [{ category: "Dining Out", limitPaise: 20000, color: "#123456" }];
const budget = workspaceBudgetSummary("food", "2026-10", [linked, { ...ledger, id: "groceries", category: "Groceries", amountPaise: 30000 }], budgets);
assert.equal(budget.remainingPaise, 9999, "Unbudgeted groceries must not consume a dining limit");
assert.equal(budget.spent.get("Dining Out"), 10001, "Budget progress uses linked account amount, not trip share");
assert.equal(budget.spent.get("Groceries"), 30000);
assert.equal(budget.isOver, false);
const over = workspaceBudgetSummary("food", "2026-10", [linked], [{ ...budgets[0], limitPaise: 10000 }]);
assert.equal(over.isOver, true);
assert.equal(over.remainingPaise, 0);
const exact = workspaceBudgetSummary("food", "2026-10", [linked], [{ ...budgets[0], limitPaise: 10001 }]);
assert.equal(exact.isOver, false);
assert.equal(exact.remainingPaise, 0);
assert.equal(workspaceBudgetSummary("food", "2026-09", [linked], budgets).remainingPaise, 20000);
assert.equal(workspaceBudgetSummary("food", "2026-10", [linked], []).remainingPaise, 0);
assert.match(exportTransactionsToCsv([linked], {}), /Travel Expense ID/);
assert.match(exportTransactionsToCsv([linked], {}), /"meal"/);
assert.match(buildAnalysisSheet({ accounts: [], transactions: [linked], budgets: [] }), /"meal"/);
console.log("Connected workspace projection, budget, and export regression tests passed.");
