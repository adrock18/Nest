import assert from "node:assert/strict";
import { api } from "../src/services/api.ts";
import type { Transaction } from "../src/types/index.ts";

class MemoryStorage implements Storage {
  values = new Map<string, string>();
  failWrites = false;
  failKey: string | null = null;
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    if (this.failWrites || key === this.failKey) throw new Error("Storage quota exceeded");
    this.values.set(key, value);
  }
}
const storage = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });

storage.setItem("nest_db_accounts", "[]");
assert.deepEqual(await api.getAccounts(), [], "An empty account list must not resurrect sample accounts");
await api.createAccount({ id: "acc-hdfc", name: "HDFC Savings", type: "bank", startingBalancePaise: 0 });
assert.equal((await api.getAccounts())[0].id, "acc-hdfc", "User-defined account names and IDs are not consolidated");
assert.equal((await api.getAccounts())[0].startingBalancePaise, 0);
storage.setItem("nest_db_transactions", "[]");
const transaction: Transaction = {
  id: "test", date: "2026-10-31", type: "expense", accountId: "acc-hdfc",
  category: "Groceries", notes: 'A "quoted" note', tags: [], isRecurring: false, amountPaise: 1250
};
await api.createTransaction(transaction);
assert.equal((await api.getTransactions())[0].accountId, "acc-hdfc", "Account attribution remains unchanged");
assert.equal((await api.getTransactions("2026-09")).length, 0);
await assert.rejects(api.deleteAccount("acc-hdfc"), /has transactions/);
await assert.rejects(api.createTransaction({ ...transaction, amountPaise: 0 }), /positive whole-paise/);
await assert.rejects(api.createTransaction({ ...transaction, amountPaise: 1.5 }), /positive whole-paise/);
await assert.rejects(api.createTransaction({ ...transaction, date: "2026-02-29" }), /calendar date/);
await assert.rejects(api.createTransaction({ ...transaction, accountId: "missing" }), /existing account/);
await assert.rejects(api.createTransaction({ ...transaction, category: "Salary" }), /matching/);
await assert.rejects(api.updateTransaction({ ...transaction, id: "missing" }), /no longer exists/);
assert.equal(await api.deleteTransaction("missing"), false);
await api.createCategory({ id: "custom", name: "Entertainment", color: "#6366f1", isIncome: false });
assert((await api.getCategories()).some((category) => category.id === "custom"), "Custom category persists across reads");
await assert.rejects(api.createCategory({ id: "duplicate", name: "entertainment", color: "#6366f1", isIncome: false }), /already exists/);
await api.setBudget({ category: "Entertainment", color: "#6366f1", limitPaise: 10000 });
assert((await api.getBudgets()).some((budget) => budget.category === "Entertainment" && budget.limitPaise === 10000));
await assert.rejects(api.setBudget({ category: "Entertainment", color: "#6366f1", limitPaise: 0 }), /positive/);
const before = storage.getItem("nest_db_transactions");
storage.failWrites = true;
await assert.rejects(api.createTransaction({ ...transaction, id: "failed-save" }), /Could not save/);
assert.equal(storage.getItem("nest_db_transactions"), before, "Failed writes leave persisted data unchanged");
storage.failWrites = false;
storage.setItem("nest_db_transactions", "not valid JSON");
await assert.rejects(api.getTransactions(), /has not been replaced/);
assert.equal(storage.getItem("nest_db_transactions"), "not valid JSON", "Corrupt storage is not silently replaced with samples");
storage.setItem("nest_db_transactions", "{}");
await assert.rejects(api.getTransactions(), /Expected a stored collection/);
await assert.rejects(api.backupDatabase("C:\\temp\\backup.db"), /desktop app/);
assert.match(await api.getDatabasePath(), /Browser preview/);
storage.setItem("nest_db_transactions", "[]");
await api.deleteCategory("cat-shopping");
assert(!(await api.getCategories()).some((category) => category.id === "cat-shopping"), "One-time category migration does not resurrect deletions");
await api.createAccount({ id: "source-bank", name: "Source Bank", type: "bank", startingBalancePaise: 0 });
const trip = (await api.getTrips())[0];
const source = (await api.getTripExpenses(trip.id))[0];
const linked = { ...transaction, id: "linked", accountId: "source-bank", tripExpenseId: source.id };
await api.createTransaction(linked);
assert.equal((await api.getTransactions())[0].tripExpenseId, source.id);
await assert.rejects(api.createTransaction({ ...linked, id: "duplicate-link" }), /already linked/);
await assert.rejects(api.createTransaction({ ...linked, id: "missing-link", tripExpenseId: "missing" }), /existing travel/);
await assert.rejects(api.createTransaction({ ...linked, id: "income-link", type: "income", category: "Salary" }), /existing travel/);
await api.updateTransaction({ ...linked, notes: "Edited" });
assert.equal((await api.getTransactions())[0].tripExpenseId, source.id, "Ordinary edits preserve source links");
const expensesBefore = storage.getItem("nest_db_trip_expenses");
storage.failKey = "nest_db_transactions";
await assert.rejects(api.deleteTripExpense(source.id), /Could not save/);
assert.equal(storage.getItem("nest_db_trip_expenses"), expensesBefore, "Multi-collection failure restores the source expense");
storage.failKey = null;
assert.equal(await api.deleteTripExpense(source.id), true);
assert.equal((await api.getTransactions())[0].tripExpenseId, null);
assert.equal((await api.getTransactions())[0].amountPaise, linked.amountPaise, "Source deletion keeps account payment intact");
await api.updateTransaction({ ...linked, tripExpenseId: null });
const anotherSource = (await api.getTripExpenses(trip.id))[0];
await api.updateTransaction({ ...linked, tripExpenseId: anotherSource.id });
const tripsBefore = storage.getItem("nest_db_trips");
storage.failKey = "nest_db_transactions";
await assert.rejects(api.deleteTrip(trip.id), /Could not save/);
assert.equal(storage.getItem("nest_db_trips"), tripsBefore);
assert((await api.getTripExpenses()).some((expense) => expense.id === anotherSource.id));
storage.failKey = null;
assert.equal(await api.deleteTrip(trip.id), true);
assert.equal((await api.getTransactions())[0].tripExpenseId, null);
assert(!(await api.getTripExpenses()).some((expense) => expense.tripId === trip.id));
assert.equal(await api.deleteTrip(trip.id), false);
assert.equal(await api.deleteTripExpense("missing"), false);
storage.setItem("nest_db_transactions", "[]");
await api.deleteAccount("source-bank");
assert.equal(await api.deleteAccount("acc-hdfc"), true);
assert.deepEqual(await api.getAccounts(), []);
console.log("V1 API persistence and validation regression tests passed.");
