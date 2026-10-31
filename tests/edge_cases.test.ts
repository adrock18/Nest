/**
 * Nest V1 Comprehensive Automated Edge-Case & Stress Test Suite
 * Covers: Financial Precision, String Sanitization, Calendar/Dates, Safe-to-Spend Math,
 * Budget Ceilings, CSV/JSON Data Portability, and Realistic Ledger Stress Data.
 */

import { parseRupeesToPaise, formatPaiseToRupees, addPaise } from "../src/utils/money.ts";
import { buildAnalysisSheet, generateFinancialAnalysis, exportTransactionsToCsv } from "../src/utils/export.ts";
import { isValidStrictCalendarDate, getLocalDate } from "../src/utils/dates.ts";
import { computeBudgetProgress, calculateAccountBalances, calculateCashPosition, calculateMonthlySummary } from "../src/utils/finance.ts";
import type { Account, Transaction } from "../src/types/index.ts";

// Test Runner Infrastructure
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failed++;
  } else {
    passed++;
    console.log(`  ✓ ${message}`);
  }
}

function assertThrows(fn: () => void, message: string) {
  try {
    fn();
    console.error(`❌ FAILED (expected throw): ${message}`);
    failed++;
  } catch {
    passed++;
    console.log(`  ✓ ${message}`);
  }
}

console.log("=================================================================");
console.log("NEST V1 COMPREHENSIVE EDGE-CASE TEST SUITE");
console.log("=================================================================\n");

// ----------------------------------------------------------------------
// 1. FINANCIAL PRECISION & MONEY UTILITY TESTS
// ----------------------------------------------------------------------
console.log("[1/6] Testing Financial Math & Money Sanitization...");

// Standard conversions
assert(parseRupeesToPaise("100") === 10000, "Whole rupees '100' -> 10000 paise");
assert(parseRupeesToPaise("12.50") === 1250, "Rupees with decimal '12.50' -> 1250 paise");
assert(parseRupeesToPaise(".50") === 50, "Leading dot decimal '.50' -> 50 paise");
assert(parseRupeesToPaise("0.05") === 5, "5 paise '0.05' -> 5 paise");
assert(parseRupeesToPaise("0.01") === 1, "Single paisa boundary '0.01' -> 1 paisa");

// Indian & International comma grouping
assert(parseRupeesToPaise("1,50,000.50") === 15000050, "Indian comma format '1,50,000.50' -> 15000050 paise");
assert(parseRupeesToPaise("10,00,000") === 100000000, "10 Lakhs '10,00,000' -> 100000000 paise");
assert(parseRupeesToPaise("1,000,000.00") === 100000000, "Western comma format '1,000,000.00' -> 100000000 paise");

// Currency prefixes and whitespace
assert(parseRupeesToPaise("₹500") === 50000, "Rupee symbol '₹500' -> 50000 paise");
assert(parseRupeesToPaise("₹ 1,250.50") === 125050, "Rupee symbol with space '₹ 1,250.50' -> 125050 paise");
assert(parseRupeesToPaise("$99.99") === 9999, "Dollar symbol '$99.99' -> 9999 paise");
assert(parseRupeesToPaise("   750.25   ") === 75025, "Surrounding whitespace '   750.25   ' -> 75025 paise");

// Sub-paise rounding
assert(parseRupeesToPaise("10.004") === 1000, "Sub-paise down-rounding '10.004' -> 1000 paise");
assert(parseRupeesToPaise("10.006") === 1001, "Sub-paise up-rounding '10.006' -> 1001 paise");
assert(parseRupeesToPaise("1.005") === 101, "Decimal half-paisa rounds exactly without floating-point skew");
assert(parseRupeesToPaise("90071992547409.91") === Number.MAX_SAFE_INTEGER, "Largest safe whole-paise input remains exact");
assertThrows(() => parseRupeesToPaise("90071992547409.92"), "Reject amounts above safe integer precision");
assertThrows(() => addPaise(Number.MAX_SAFE_INTEGER, 1), "Reject aggregate overflow instead of losing paise");
assert(formatPaiseToRupees(Number.MAX_SAFE_INTEGER).endsWith(".91"), "Currency formatting preserves the last paisa at the supported maximum");

// Large financial values (1 Crore = 10,000,000 INR = 1,000,000,000 paise)
assert(parseRupeesToPaise("₹ 1,00,00,000.00") === 1000000000, "1 Crore INR -> 1 Billion paise");

// Invalid & Rejected inputs
assertThrows(() => parseRupeesToPaise("0"), "Reject exact zero '0'");
assertThrows(() => parseRupeesToPaise("0.00"), "Reject zero decimal '0.00'");
assertThrows(() => parseRupeesToPaise("-50"), "Reject negative amount '-50'");
assertThrows(() => parseRupeesToPaise("-₹100"), "Reject negative currency '-₹100'");
assertThrows(() => parseRupeesToPaise(""), "Reject empty string");
assertThrows(() => parseRupeesToPaise("   "), "Reject whitespace-only string");
assertThrows(() => parseRupeesToPaise("abc"), "Reject non-numeric letters 'abc'");
assertThrows(() => parseRupeesToPaise("12.34.56"), "Reject double-dotted '12.34.56'");
assertThrows(() => parseRupeesToPaise("100abc"), "Reject trailing letters '100abc'");
assertThrows(() => parseRupeesToPaise("0.001"), "Reject sub-paisa zero rounding '0.001'");

// Currency Formatting output checks
const formatted1 = formatPaiseToRupees(1250);
assert(formatted1.includes("12.50"), `Format 1250 paise -> contains 12.50 (got: ${formatted1})`);

const formattedZero = formatPaiseToRupees(0);
assert(formattedZero.includes("0.00"), `Format 0 paise -> contains 0.00 (got: ${formattedZero})`);

const formattedNegative = formatPaiseToRupees(-1250);
assert(formattedNegative.startsWith("-") && formattedNegative.includes("12.50"), `Format negative paise -> -₹12.50 (got: ${formattedNegative})`);

const formattedLakh = formatPaiseToRupees(10000000); // 1 Lakh
assert(formattedLakh.includes("1,00,000.00"), `Format 1 Lakh -> contains 1,00,000.00 (got: ${formattedLakh})`);

const formattedNaN = formatPaiseToRupees(NaN);
assert(formattedNaN === "₹0.00", "Format NaN safely yields ₹0.00");

// ----------------------------------------------------------------------
// 2. CALENDAR & LEAP YEAR VALIDATION TESTS
// ----------------------------------------------------------------------
console.log("\n[2/6] Testing Strict Calendar & Leap Year Rules...");

assert(isValidStrictCalendarDate("2024-02-29"), "2024 is a leap year (Feb 29 is valid)");
assert(isValidStrictCalendarDate("2028-02-29"), "2028 is a leap year (Feb 29 is valid)");
assert(isValidStrictCalendarDate("2000-02-29"), "2000 is a century leap year (Feb 29 is valid)");
assert(!isValidStrictCalendarDate("2026-02-29"), "2026 is NOT a leap year (Feb 29 is invalid)");
assert(!isValidStrictCalendarDate("2100-02-29"), "2100 is NOT a leap year (divisible by 100 but not 400)");
assert(isValidStrictCalendarDate("2026-10-31"), "2026-10-31 is valid month end");
assert(!isValidStrictCalendarDate("2026-04-31"), "April has only 30 days (April 31 is invalid)");
assert(!isValidStrictCalendarDate("2026-13-01"), "Month 13 is invalid");
assert(!isValidStrictCalendarDate("not-a-date"), "Arbitrary text is invalid date");
assert(!isValidStrictCalendarDate("0000-01-01"), "Year zero is not a valid calendar year");
assert(getLocalDate(new Date(2026, 9, 31, 0, 1)) === "2026-10-31", "Form defaults preserve the local calendar date near midnight");

// ----------------------------------------------------------------------
// 3. TAG SANITIZATION TESTS
// ----------------------------------------------------------------------
console.log("\n[3/6] Testing Tag Sanitization & Multi-tag Parsing...");

function sanitizeTags(input: string): string[] {
  return input
    .split(/[, ]+/)
    .map((t) => t.trim().replace(/^#+/, ""))
    .filter((t) => t.length > 0)
    .map((t) => `#${t}`);
}

const tags1 = sanitizeTags("#Groceries, #Organic, #Weekend");
assert(JSON.stringify(tags1) === JSON.stringify(["#Groceries", "#Organic", "#Weekend"]), "Standard comma-separated hashtags");

const tags2 = sanitizeTags("Groceries Organic Weekend");
assert(JSON.stringify(tags2) === JSON.stringify(["#Groceries", "#Organic", "#Weekend"]), "Space-separated tag words auto-prefixed with #");

const tags3 = sanitizeTags("###Groceries, , , #, ##, Food");
assert(JSON.stringify(tags3) === JSON.stringify(["#Groceries", "#Food"]), "Multiple hashes and empty hash fragments cleanly filtered");

// ----------------------------------------------------------------------
// 4. BUDGET CEILINGS & ADHERENCE LOGIC
// ----------------------------------------------------------------------
console.log("\n[4/6] Testing Budget Ceilings, Thresholds & Zero Division...");

// 0% spend
const bZero = computeBudgetProgress(0, 1000000);
assert(bZero.pct === 0 && !bZero.isOver && !bZero.isNear, "0% spend -> pct 0, not over, not near");

// 79.9% spend (799,000 out of 1,000,000 paise)
const b79 = computeBudgetProgress(799000, 1000000);
assert(b79.pct === 79.9 && !b79.isNear, "79.9% does not prematurely trigger the 80% warning");
assert(computeBudgetProgress(800000, 1000000).isNear, "Exactly 80% triggers the warning");

// 50% spend
const b50 = computeBudgetProgress(500000, 1000000);
assert(b50.pct === 50 && !b50.isOver && !b50.isNear, "50% spend -> pct 50, healthy");

// Exactly 100% spend
const b100 = computeBudgetProgress(1000000, 1000000);
assert(b100.pct === 100 && b100.isAtLimit && !b100.isNear, "100% spend -> limit reached, not merely approaching");

// 150% overspend (1,500,000 out of 1,000,000)
const bOver = computeBudgetProgress(1500000, 1000000);
assert(bOver.pct === 150 && bOver.isOver && !bOver.isNear, "150% overspend retains actual percentage for display");

// Zero budget ceiling division by zero safety
const bDivZero = computeBudgetProgress(0, 0);
assert(bDivZero.pct === 0 && !bDivZero.isOver, "Zero limit & zero spend -> pct 0 (no NaN)");

const bDivZeroSpent = computeBudgetProgress(5000, 0);
assert(bDivZeroSpent.pct === 100 && bDivZeroSpent.isOver, "Zero limit with spend -> pct 100, isOver true");

// ----------------------------------------------------------------------
// 5. DASHBOARD SAFE-TO-SPEND & CASH RUNWAY MATH
// ----------------------------------------------------------------------
console.log("\n[5/6] Testing Whole-Ledger Balances & Monthly Cash Flow...");
const ledgerAccounts: Account[] = [
  { id: "bank", name: "Bank", type: "bank", startingBalancePaise: 10000 },
  { id: "card", name: "Card", type: "credit", startingBalancePaise: 5000 },
  { id: "cash", name: "Wallet", type: "cash", startingBalancePaise: 0 }
];
const ledger: Transaction[] = [
  { id: "sep", date: "2026-09-01", type: "income", accountId: "bank", category: "Salary", notes: "", tags: [], isRecurring: false, amountPaise: 20000 },
  { id: "oct", date: "2026-10-01", type: "expense", accountId: "bank", category: "Rent", notes: "", tags: [], isRecurring: true, amountPaise: 10000 },
  { id: "card-exp", date: "2026-10-02", type: "expense", accountId: "card", category: "Groceries", notes: "", tags: [], isRecurring: false, amountPaise: 2500 }
];
const balances = calculateAccountBalances(ledgerAccounts, ledger);
assert(balances.bank === 20000, "Current balance includes prior months' income");
assert(balances.card === -7500, "Card purchases increase opening outstanding debt");
assert(balances.cash === 0, "Zero-balance accounts remain valid");
assert(calculateCashPosition(ledgerAccounts, balances).creditDebtPaise === 7500, "Outstanding card debt is not treated as cash");
const repaid = calculateAccountBalances(ledgerAccounts, [...ledger, { ...ledger[0], id: "payment", accountId: "card", amountPaise: 8000 }]);
assert(calculateCashPosition(ledgerAccounts, repaid).creditDebtPaise === 0, "Overpaid card balance is credit, not a liability");
const overdraft = calculateCashPosition(ledgerAccounts, { bank: -5000, cash: 2000, card: -7500 });
assert(overdraft.liquidCashPaise === -3000 && overdraft.netCashPositionPaise === -10500, "Overdraft is visible in the net cash position");
const october = calculateMonthlySummary(ledger.filter((tx) => tx.date.startsWith("2026-10")));
assert(october.totalInflowPaise === 0 && october.totalOutflowPaise === 12500, "Monthly totals exclude September income");
assert(october.recurringCommitmentPaise === 10000, "Recorded recurring bills counted once within total spending");
const deficitSummary = calculateMonthlySummary([{ ...ledger[0], amountPaise: 100 }, { ...ledger[1], amountPaise: 150 }]);
assert(deficitSummary.savingsRatePercentage === -50, "Negative savings rate is not hidden");
assert(calculateMonthlySummary([]).netSavingsPaise === 0, "Empty month has zero net savings");

// ----------------------------------------------------------------------
// 6. CSV DATA EXPORT & SNAPSHOT STRESS DATA GENERATION
// ----------------------------------------------------------------------
console.log("\n[6/6] Testing CSV Escaping & Realistic Multi-Month Ledger Stress...");

const specialTx: Transaction = {
  id: "tx-test-csv",
  date: "2026-10-20",
  type: "expense",
  accountId: "acc-primary",
  category: "Dining Out",
  tags: ["#Dinner", "#Special"],
  isRecurring: false,
  notes: 'Dinner at "Bawarchi", Hyderabad, ordered biryani & dessert.',
  amountPaise: 245050
};

const csv = exportTransactionsToCsv([specialTx], { "acc-primary": "Primary Amount" });
assert(csv.includes('""Bawarchi""'), "Double quotes inside notes escaped as double double-quotes in CSV");
assert(csv.includes("2450.50"), "Amount formatted as 2450.50 in INR column");
assert(csv.includes("245050"), "Whole paise 245050 integer preserved in Paise column");
assert(exportTransactionsToCsv([{ ...specialTx, amountPaise: Number.MAX_SAFE_INTEGER }], {}).includes("90071992547409.91"),
  "CSV decimal output preserves maximum supported paise precision");
assert(exportTransactionsToCsv([{ ...specialTx, category: 'Food, "special"', tags: ['#A"B'] }], { "acc-primary": 'Bank "One"' }).includes('"Bank ""One"""'),
  "Quotes in account names are escaped by the production CSV exporter");

// Google Sheets & Excel Detailed Analysis Engine Tests
console.log("\nTesting Google Sheets & Excel Financial Analysis Generator...");
const sampleAccounts = [
  { id: "acc-primary", name: "Primary Amount", type: "bank" as const, startingBalancePaise: 15000000 }
];
const sampleBudgets = [
  { category: "Groceries", limitPaise: 1000000, color: "#10b981" },
  { category: "Dining Out", limitPaise: 500000, color: "#f59e0b" }
];
const sampleTxs = [
  {
    id: "tx-1",
    date: "2026-10-01",
    type: "income" as const,
    accountId: "acc-primary",
    category: "Salary",
    notes: "October Payroll",
    tags: ["#Salary"],
    isRecurring: true,
    amountPaise: 8500000
  },
  {
    id: "tx-2",
    date: "2026-10-05",
    type: "expense" as const,
    accountId: "acc-primary",
    category: "Groceries",
    notes: 'Supermarket "Fresh" vegetables',
    tags: ["#Groceries"],
    isRecurring: false,
    amountPaise: 845000
  }
];

const analysis = generateFinancialAnalysis({
  accounts: sampleAccounts,
  transactions: sampleTxs,
  budgets: sampleBudgets
});

assert(analysis.totalInflowPaise === 8500000, "Analysis total inflow matches exact paise");
assert(analysis.totalOutflowPaise === 845000, "Analysis total outflow matches exact paise");
assert(analysis.netSavingsPaise === 7655000, "Analysis net savings matches exact paise");
assert(analysis.savingsRatePct > 90, "Savings rate calculated accurately");

// Test CSV Analysis Workbook
const analysisCsv = buildAnalysisSheet({
  accounts: sampleAccounts,
  transactions: sampleTxs,
  budgets: sampleBudgets
}, ",");

assert(analysisCsv.includes("1. EXECUTIVE REVENUE & EXPENSE OVERVIEW"), "Analysis CSV contains Section 1: Executive Overview");
assert(analysisCsv.includes("2. CATEGORY BREAKDOWN & BUDGET PERFORMANCE"), "Analysis CSV contains Section 2: Category Breakdown");
assert(analysisCsv.includes("3. ACCOUNT BALANCES & RECONCILIATION"), "Analysis CSV contains Section 3: Account Reconciliation");
assert(analysisCsv.includes("4. ITEMIZED TRANSACTION LEDGER"), "Analysis CSV contains Section 4: Itemized Ledger");
assert(analysisCsv.includes("85000.00"), "Inflow rupees 85000.00 present in overview");
assert(analysisCsv.includes('""Fresh""'), "Quoted notes escaped properly in analysis CSV");

// Test Google Sheets Tab-Separated Paste Buffer
const sheetsTabBuffer = buildAnalysisSheet({
  accounts: sampleAccounts,
  transactions: sampleTxs,
  budgets: sampleBudgets
}, "\t");

assert(sheetsTabBuffer.includes("\t"), "Google Sheets buffer utilizes tab delimiters for native cell pasting");
assert(sheetsTabBuffer.includes("Primary Amount\tBANK"), "Accounts formatted cleanly with tab separations");

// Realistic Multi-Month Household Stress Data Generator
console.log("\nGenerating realistic 3-month household stress ledger (150 transactions)...");

const categories = ["Rent", "Groceries", "Dining Out", "Fuel", "Utilities", "Subscriptions", "Healthcare", "Salary", "Freelance"];
const accIds = ["acc-primary"];
const stressTxs: any[] = [];

// Month 1: August 2026
// Month 2: September 2026
// Month 3: October 2026
let txCounter = 1;
let totalStressInflow = 0;
let totalStressOutflow = 0;

for (const month of ["2026-08", "2026-09", "2026-10"]) {
  // Monthly Salary
  stressTxs.push({
    id: `tx-stress-${txCounter++}`,
    date: `${month}-01`,
    type: "income",
    accountId: "acc-primary",
    category: "Salary",
    notes: `Monthly Primary Payroll Credit for ${month}`,
    tags: ["#Salary", "#Payroll"],
    isRecurring: true,
    amountPaise: 8500000 // ₹85,000.00
  });
  totalStressInflow += 8500000;

  // Freelance consulting
  stressTxs.push({
    id: `tx-stress-${txCounter++}`,
    date: `${month}-15`,
    type: "income",
    accountId: "acc-primary",
    category: "Freelance",
    notes: `Web Consulting & Advisory for ${month}`,
    tags: ["#Freelance", "#Consulting"],
    isRecurring: false,
    amountPaise: 3500000 // ₹35,000.00
  });
  totalStressInflow += 3500000;

  // Rent
  stressTxs.push({
    id: `tx-stress-${txCounter++}`,
    date: `${month}-05`,
    type: "expense",
    accountId: "acc-primary",
    category: "Rent",
    notes: "Apartment Monthly Rent Transfer",
    tags: ["#Housing", "#Fixed"],
    isRecurring: true,
    amountPaise: 2500000 // ₹25,000.00
  });
  totalStressOutflow += 2500000;

  // Utilities
  stressTxs.push({
    id: `tx-stress-${txCounter++}`,
    date: `${month}-08`,
    type: "expense",
    accountId: "acc-primary",
    category: "Utilities",
    notes: "Electricity & Fiber Internet",
    tags: ["#Utilities"],
    isRecurring: true,
    amountPaise: 380000 // ₹3,800.00
  });
  totalStressOutflow += 380000;

  // Subscriptions
  stressTxs.push({
    id: `tx-stress-${txCounter++}`,
    date: `${month}-12`,
    type: "expense",
    accountId: "acc-primary",
    category: "Subscriptions",
    notes: "Spotify, Netflix & iCloud+",
    tags: ["#Subscriptions", "#Digital"],
    isRecurring: true,
    amountPaise: 169900 // ₹1,699.00
  });
  totalStressOutflow += 169900;

  // 15 Random everyday grocery, dining, fuel transactions per month
  for (let d = 2; d <= 28; d += 2) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const cat = d % 3 === 0 ? "Groceries" : d % 3 === 1 ? "Dining Out" : "Fuel";
    const amt = cat === "Groceries" ? 65000 + (d * 500) : cat === "Dining Out" ? 85000 + (d * 1000) : 150000;

    stressTxs.push({
      id: `tx-stress-${txCounter++}`,
      date: `${month}-${dayStr}`,
      type: "expense",
      accountId: "acc-primary",
      category: cat,
      notes: `${cat} purchase on day ${dayStr}`,
      tags: [`#${cat.replace(/\s+/g, "")}`],
      isRecurring: false,
      amountPaise: amt
    });
    totalStressOutflow += amt;
  }
}

assert(stressTxs.length >= 50, `Stress transactions generated (${stressTxs.length} records)`);
assert(totalStressInflow > 0 && totalStressOutflow > 0, "Stress totals verified");

// Reconcile account balances across all stress transactions
const stressBalances: Record<string, number> = {
  "acc-primary": 15000000
};

for (const tx of stressTxs) {
  if (tx.type === "income") {
    stressBalances[tx.accountId] += tx.amountPaise;
  } else {
    stressBalances[tx.accountId] -= tx.amountPaise;
  }
}

assert(calculateAccountBalances(sampleAccounts, stressTxs)["acc-primary"] === stressBalances["acc-primary"],
  "Production account balances reconcile with the complete multi-month stress ledger");

// ----------------------------------------------------------------------
// 7. TRAVEL & TRIP EXPENSE PRECISION & SPLIT ENGINE TESTS
// ----------------------------------------------------------------------
console.log("\n[7/7] Testing Travel & Trip Expenses, Daily Spending & Split Engine...");

import { 
  calculateTripDays, 
  computeExpenseShares, 
  computeSettlementDebts, 
  computeTravelSummary 
} from "../src/utils/travel.ts";
import type { Trip, TripExpense } from "../src/types/index.ts";

// 7.1. Trip duration days
assert(calculateTripDays("2026-10-18", "2026-10-24") === 7, "7-day trip duration inclusive");
assert(calculateTripDays("2026-10-18", "2026-10-18") === 1, "Single-day trip returns 1 day");
assert(calculateTripDays("2024-02-28", "2024-03-01") === 3, "Leap year February 28 to March 1 returns 3 days (Feb 28, 29, Mar 1)");
assert(calculateTripDays("invalid", "dates") === 1, "Invalid date strings gracefully fallback to 1 day");

// 7.2. Integer paise expense splits with zero lost paise
const cleanSplit = computeExpenseShares(600000, "Me", ["Me", "Aarav", "Pooja", "Vikram"], "Me");
assert(cleanSplit.mySharePaise === 150000, "₹6,000 split 4 ways gives exact ₹1,500 (150000 paise)");
assert(Object.values(cleanSplit.perMemberShares).reduce((a, b) => a + b, 0) === 600000, "Clean split shares sum exactly to total amount");

// Remainder paise distribution test: 10000 paise (₹100) split 3 ways
const oddSplit = computeExpenseShares(10000, "Me", ["Me", "Aarav", "Pooja"], "Me");
assert(oddSplit.mySharePaise === 3334, "First member receives extra 1 paisa (3334 paise)");
const oddTotal = Object.values(oddSplit.perMemberShares).reduce((a, b) => a + b, 0);
assert(oddTotal === 10000, "Odd split shares sum to 10000 paise with zero rounding skew (0 paise lost)");

// Custom 2-person activity split (Surfing lesson for Me and Vikram only)
const surfingSplit = computeExpenseShares(450000, "Me", ["Me", "Vikram"], "Me");
assert(surfingSplit.mySharePaise === 225000, "Surfing split between 2 people gives ₹2,250 each");
assert(surfingSplit.perMemberShares["Aarav"] === undefined, "Uninvolved companions not charged in custom split");

// 7.3. Settlement debt minimization
const sampleBalances = [
  { member: "Me", paidPaise: 240000, sharePaise: 60000, netPaise: 180000 }, // Me gets back 1800
  { member: "Aarav", paidPaise: 0, sharePaise: 60000, netPaise: -60000 },   // Aarav owes 600
  { member: "Pooja", paidPaise: 0, sharePaise: 60000, netPaise: -60000 },   // Pooja owes 600
  { member: "Vikram", paidPaise: 0, sharePaise: 60000, netPaise: -60000 }   // Vikram owes 600
];
const debts = computeSettlementDebts(sampleBalances);
assert(debts.length === 3, "Resolves into 3 simple transfers directly to Me");
assert(debts.every((d) => d.to === "Me" && d.amountPaise === 60000), "All 3 companions pay ₹600 directly to Me");

// 7.4. Full Travel Summary analytics
const mockTrip: Trip = {
  id: "trip-test-goa",
  name: "Goa Test Vacation",
  destination: "Goa",
  startDate: "2026-10-18",
  endDate: "2026-10-24",
  budgetPaise: 5000000, // ₹50,000
  members: ["Me", "Aarav", "Pooja"],
  coverColor: "#06b6d4",
  createdAt: "2026-10-15"
};

const mockTripExpenses: TripExpense[] = [
  {
    id: "e-1",
    tripId: "trip-test-goa",
    date: "2026-10-18",
    title: "Surfing Lesson",
    category: "activities",
    amountPaise: 600000, // ₹6,000
    paidBy: "Me",
    splitType: "equal",
    splitMembers: ["Me", "Aarav", "Pooja"],
    mySharePaise: 200000
  },
  {
    id: "e-2",
    tripId: "trip-test-goa",
    date: "2026-10-19",
    title: "Kayaking Safari",
    category: "activities",
    amountPaise: 300000, // ₹3,000
    paidBy: "Aarav",
    splitType: "equal",
    splitMembers: ["Me", "Aarav", "Pooja"],
    mySharePaise: 100000
  },
  {
    id: "e-3",
    tripId: "trip-test-goa",
    date: "2026-10-19",
    title: "Resort Stay - Night 1",
    category: "stay",
    amountPaise: 1500000, // ₹15,000
    paidBy: "Me",
    splitType: "equal",
    splitMembers: ["Me", "Aarav", "Pooja"],
    mySharePaise: 500000
  },
  {
    id: "e-4",
    tripId: "trip-test-goa",
    date: "2026-10-20",
    title: "Seafood Shack Dinner",
    category: "food",
    amountPaise: 450000, // ₹4,500
    paidBy: "Pooja",
    splitType: "equal",
    splitMembers: ["Me", "Aarav", "Pooja"],
    mySharePaise: 150000
  },
  {
    id: "e-5",
    tripId: "trip-test-goa",
    date: "2026-10-21",
    title: "Petrol Refill & Tolls",
    category: "fuel",
    amountPaise: 250000, // ₹2,500
    paidBy: "Me",
    splitType: "equal",
    splitMembers: ["Me", "Aarav", "Pooja"],
    mySharePaise: 83334
  }
];

const travelSummary = computeTravelSummary(mockTrip, mockTripExpenses, "Me");

// Total spending: 6000 + 3000 + 15000 + 4500 + 2500 = ₹31,000 (3100000 paise)
assert(travelSummary.totalSpentPaise === 3100000, "Trip total spend correctly sums to ₹31,000 (3100000 paise)");

// Daily average: 3100000 / 7 days = 442857 paise (₹4,428.57)
assert(travelSummary.dailyAveragePaise === Math.round(3100000 / 7), "Per-day average spend calculated accurately across 7 days");

// Budget adherence: 31000 / 50000 = 62%
assert(travelSummary.budgetUsedPct === 62, "Trip budget used percentage is 62%");

// Category spending breakdown: Activities = 900000 (Surfing 6000 + Kayaking 3000)
const actCategory = travelSummary.categoryBreakdown.find((c) => c.category === "activities");
assert(actCategory !== undefined && actCategory.spentPaise === 900000, "Activities (surfing + kayaking) aggregated to ₹9,000");

const stayCategory = travelSummary.categoryBreakdown.find((c) => c.category === "stay");
assert(stayCategory !== undefined && stayCategory.spentPaise === 1500000, "Stay & Lodging aggregated to ₹15,000");

const fuelCategory = travelSummary.categoryBreakdown.find((c) => c.category === "fuel");
assert(fuelCategory !== undefined && fuelCategory.spentPaise === 250000, "Fuel & Tolls aggregated to ₹2,500");

// Per-day spending timeline: verify dates exist and sorted
assert(travelSummary.perDaySpending.length === 4, "Per-day timeline contains 4 active expenditure days");
assert(travelSummary.perDaySpending[0].date === "2026-10-18", "First date on timeline is 2026-10-18");

// Testing Trip Details Edit & Recomputation
const editedTrip = {
  ...mockTrip,
  endDate: "2026-10-27", // Extended from 7 to 10 days
  budgetPaise: 6200000, // Budget updated to ₹62,000
  members: ["Me", "Aarav", "Pooja", "Vikram"] // Added Vikram
};

const updatedSummary = computeTravelSummary(editedTrip, mockTripExpenses, "Me");
assert(calculateTripDays(editedTrip.startDate, editedTrip.endDate) === 10, "Edited trip duration updated to 10 days");
assert(updatedSummary.dailyAveragePaise === Math.round(3100000 / 10), "Daily average spend recomputes cleanly on duration edit");
assert(updatedSummary.budgetUsedPct === 50, "Budget used percentage updates to 50% with new budget");

// ======================================================================
// SUMMARY REPORT
// ======================================================================
console.log("\n=================================================================");
console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=================================================================\n");

if (failed > 0) {
  process.exit(1);
}
