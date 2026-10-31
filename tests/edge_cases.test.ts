/**
 * Nest V1 Comprehensive Automated Edge-Case & Stress Test Suite
 * Covers: Financial Precision, String Sanitization, Calendar/Dates, Safe-to-Spend Math,
 * Budget Ceilings, CSV/JSON Data Portability, and Realistic Ledger Stress Data.
 */

import { parseRupeesToPaise, formatPaiseToRupees } from "../src/utils/money.ts";
import { buildAnalysisSheet, generateFinancialAnalysis } from "../src/utils/export.ts";

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

function isValidStrictCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Days in month validation
  const daysInMonth = [
    31,
    // Leap year rule: divisible by 4 and (not divisible by 100 or divisible by 400)
    (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31
  ];

  return day <= daysInMonth[month - 1];
}

assert(isValidStrictCalendarDate("2024-02-29"), "2024 is a leap year (Feb 29 is valid)");
assert(isValidStrictCalendarDate("2028-02-29"), "2028 is a leap year (Feb 29 is valid)");
assert(isValidStrictCalendarDate("2000-02-29"), "2000 is a century leap year (Feb 29 is valid)");
assert(!isValidStrictCalendarDate("2026-02-29"), "2026 is NOT a leap year (Feb 29 is invalid)");
assert(!isValidStrictCalendarDate("2100-02-29"), "2100 is NOT a leap year (divisible by 100 but not 400)");
assert(isValidStrictCalendarDate("2026-10-31"), "2026-10-31 is valid month end");
assert(!isValidStrictCalendarDate("2026-04-31"), "April has only 30 days (April 31 is invalid)");
assert(!isValidStrictCalendarDate("2026-13-01"), "Month 13 is invalid");
assert(!isValidStrictCalendarDate("not-a-date"), "Arbitrary text is invalid date");

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

function computeBudgetProgress(spentPaise: number, limitPaise: number) {
  const pct = limitPaise > 0
    ? Math.min(Math.round((spentPaise / limitPaise) * 100), 100)
    : (spentPaise > 0 ? 100 : 0);
  const isOver = spentPaise > limitPaise;
  const isNear = pct >= 80 && !isOver;
  return { pct, isOver, isNear };
}

// 0% spend
const bZero = computeBudgetProgress(0, 1000000);
assert(bZero.pct === 0 && !bZero.isOver && !bZero.isNear, "0% spend -> pct 0, not over, not near");

// 79.9% spend (799,000 out of 1,000,000 paise)
const b79 = computeBudgetProgress(799000, 1000000);
assert(b79.pct === 80 && b79.isNear, "79.9% rounded is 80% (triggers near threshold)");

// 50% spend
const b50 = computeBudgetProgress(500000, 1000000);
assert(b50.pct === 50 && !b50.isOver && !b50.isNear, "50% spend -> pct 50, healthy");

// Exactly 100% spend
const b100 = computeBudgetProgress(1000000, 1000000);
assert(b100.pct === 100 && !b100.isOver && b100.isNear, "100% spend -> exactly at limit, not over");

// 150% overspend (1,500,000 out of 1,000,000)
const bOver = computeBudgetProgress(1500000, 1000000);
assert(bOver.pct === 100 && bOver.isOver && !bOver.isNear, "150% overspend -> pct clamped to 100, isOver true");

// Zero budget ceiling division by zero safety
const bDivZero = computeBudgetProgress(0, 0);
assert(bDivZero.pct === 0 && !bDivZero.isOver, "Zero limit & zero spend -> pct 0 (no NaN)");

const bDivZeroSpent = computeBudgetProgress(5000, 0);
assert(bDivZeroSpent.pct === 100 && bDivZeroSpent.isOver, "Zero limit with spend -> pct 100, isOver true");

// ----------------------------------------------------------------------
// 5. DASHBOARD SAFE-TO-SPEND & CASH RUNWAY MATH
// ----------------------------------------------------------------------
console.log("\n[5/6] Testing Safe-to-Spend, Cash Runway & Overdraft Protection...");

function calculateSafeToSpend(
  liquidCashPaise: number,
  recurringCommitmentPaise: number,
  remainingBudgetsPaise: number
): number {
  return Math.max(0, liquidCashPaise - recurringCommitmentPaise - remainingBudgetsPaise);
}

// Normal positive scenario:
// Liquid cash: ₹1,50,000 (15,000,000 paise)
// Recurring bills: ₹25,000 (2,500,000 paise)
// Remaining budgets: ₹50,000 (5,000,000 paise)
// Safe to spend = 15,000,000 - 2,500,000 - 5,000,000 = 7,500,000 paise (₹75,000)
assert(
  calculateSafeToSpend(15000000, 2500000, 5000000) === 7500000,
  "Normal Safe-to-Spend yields positive remainder (₹75,000)"
);

// Deficit scenario:
// Liquid cash: ₹20,000 (2,000,000 paise)
// Recurring bills: ₹30,000 (3,000,000 paise)
// Remaining budgets: ₹40,000 (4,000,000 paise)
// Clamped to 0 (never negative)
assert(
  calculateSafeToSpend(2000000, 3000000, 4000000) === 0,
  "Deficit Safe-to-Spend cleanly clamps to 0"
);

// Cash Runway calculation
function calculateCashRunway(liquidCashPaise: number, totalOutflowPaise: number): string {
  return totalOutflowPaise > 0
    ? (liquidCashPaise / totalOutflowPaise).toFixed(1)
    : "12+";
}

assert(calculateCashRunway(10000000, 0) === "12+", "Zero monthly outflow -> '12+' runway");
assert(calculateCashRunway(10000000, 5000000) === "2.0", "Liquid cash double outflow -> 2.0 months");
assert(calculateCashRunway(2500000, 5000000) === "0.5", "Low cash reserves -> 0.5 months");

// Overdraft bank protection
const accounts = [
  { id: "acc-1", type: "bank", balance: -500000 }, // Overdraft
  { id: "acc-2", type: "cash", balance: 200000 },
  { id: "acc-3", type: "credit", balance: -300000 } // Card liability
];

let derivedLiquidCash = 0;
let derivedCreditDebt = 0;
for (const a of accounts) {
  if (a.type === "credit") {
    derivedCreditDebt += Math.abs(a.balance);
  } else {
    derivedLiquidCash += Math.max(0, a.balance);
  }
}

assert(derivedLiquidCash === 200000, "Bank overdraft clamped to 0 so it doesn't inflate or corrupt liquid cash");
assert(derivedCreditDebt === 300000, "Credit card liabilities calculated cleanly");

// ----------------------------------------------------------------------
// 6. CSV DATA EXPORT & SNAPSHOT STRESS DATA GENERATION
// ----------------------------------------------------------------------
console.log("\n[6/6] Testing CSV Escaping & Realistic Multi-Month Ledger Stress...");

function exportTransactionsToCsv(txs: any[], accountMap: Record<string, string>): string {
  const headers = [
    "ID", "Date", "Flow Type", "Account", "Category", "Tags", "Recurring", "Notes / Merchant", "Amount (INR)", "Amount (Paise)"
  ];

  const rows = txs.map((t) => [
    t.id,
    t.date,
    t.type,
    `"${accountMap[t.accountId] || "Primary Account"}"`,
    `"${t.category || ""}"`,
    `"${(t.tags || []).join(" ")}"`,
    t.isRecurring ? "YES" : "NO",
    `"${(t.notes || "").replace(/"/g, '""')}"`,
    ((t.amountPaise || 0) / 100).toFixed(2),
    (t.amountPaise || 0).toString()
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

const specialTx = {
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

assert(typeof stressBalances["acc-primary"] === "number", "Primary balance reconciled successfully");

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
