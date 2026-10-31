import type { Transaction, Account, CategoryBudget } from "../types/index.ts";

export interface AnalysisExportData {
  accounts: Account[];
  transactions: Transaction[];
  budgets: CategoryBudget[];
}

export function generateFinancialAnalysis(data: AnalysisExportData) {
  const { accounts, transactions, budgets: _budgets } = data;

  const safeAccounts = accounts || [];
  const safeTransactions = transactions || [];

  const accountMap = safeAccounts.reduce((acc, a) => {
    acc[a.id] = a.name;
    return acc;
  }, {} as Record<string, string>);

  // Compute Totals
  let totalInflowPaise = 0;
  let totalOutflowPaise = 0;
  let recurringPaise = 0;

  for (const t of safeTransactions) {
    if (t.type === "income") {
      totalInflowPaise += t.amountPaise;
    } else {
      totalOutflowPaise += t.amountPaise;
      if (t.isRecurring) {
        recurringPaise += t.amountPaise;
      }
    }
  }

  const netSavingsPaise = totalInflowPaise - totalOutflowPaise;
  const savingsRatePct = totalInflowPaise > 0 
    ? Math.max(0, (netSavingsPaise / totalInflowPaise) * 100)
    : 0;

  // Account Balances
  const accountBalances: Record<string, { starting: number; inflow: number; outflow: number; current: number }> = {};
  for (const a of safeAccounts) {
    accountBalances[a.id] = {
      starting: a.startingBalancePaise,
      inflow: 0,
      outflow: 0,
      current: a.startingBalancePaise
    };
  }

  for (const t of safeTransactions) {
    if (!accountBalances[t.accountId]) continue;
    if (t.type === "income") {
      accountBalances[t.accountId].inflow += t.amountPaise;
      accountBalances[t.accountId].current += t.amountPaise;
    } else {
      accountBalances[t.accountId].outflow += t.amountPaise;
      accountBalances[t.accountId].current -= t.amountPaise;
    }
  }

  // Liquid Cash vs Liabilities
  let liquidCashPaise = 0;
  let creditDebtPaise = 0;
  for (const a of safeAccounts) {
    const bal = accountBalances[a.id]?.current ?? a.startingBalancePaise;
    if (a.type === "credit") {
      creditDebtPaise += Math.abs(bal);
    } else {
      liquidCashPaise += Math.max(0, bal);
    }
  }

  // Category Breakdown
  const categorySpent: Record<string, number> = {};
  for (const t of safeTransactions) {
    if (t.type === "expense") {
      categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amountPaise;
    }
  }

  return {
    totalInflowPaise,
    totalOutflowPaise,
    netSavingsPaise,
    savingsRatePct,
    recurringPaise,
    liquidCashPaise,
    creditDebtPaise,
    accountBalances,
    categorySpent,
    accountMap
  };
}

export function buildAnalysisSheet(data: AnalysisExportData, delimiter: "," | "\t" = ","): string {
  const d = delimiter;
  const q = (str: string) => {
    if (delimiter === "\t") {
      return (str || "").replace(/[\t\r\n]/g, " ");
    }
    return `"${(str || "").replace(/"/g, '""')}"`;
  };
  const fmtInr = (paise: number) => (paise / 100).toFixed(2);

  const analysis = generateFinancialAnalysis(data);
  const safeBudgets = data.budgets || [];
  const safeAccounts = data.accounts || [];
  const safeTransactions = data.transactions || [];
  const lines: string[] = [];

  // Title Header
  lines.push([q("NEST FINANCIAL OS — DETAILED REVENUE & SPENDING ANALYSIS")].join(d));
  lines.push([q(`Generated: ${new Date().toISOString().split("T")[0]} | Mode: 100% Offline Local SQLite`)].join(d));
  lines.push("");

  // SECTION 1: EXECUTIVE REVENUE & EXPENSE OVERVIEW
  lines.push([q("1. EXECUTIVE REVENUE & EXPENSE OVERVIEW"), q("VALUE (INR)"), q("VALUE (PAISE)"), q("ANALYSIS & CONTEXT")].join(d));
  lines.push([q("Total Inflow / Revenue"), fmtInr(analysis.totalInflowPaise), analysis.totalInflowPaise.toString(), q("All verified income credits")].join(d));
  lines.push([q("Total Outflow / Spending"), fmtInr(analysis.totalOutflowPaise), analysis.totalOutflowPaise.toString(), q("Total household expenditures")].join(d));
  lines.push([q("Net Monthly Savings / Surplus"), fmtInr(analysis.netSavingsPaise), analysis.netSavingsPaise.toString(), q(analysis.netSavingsPaise >= 0 ? "Positive financial surplus" : "Deficit spend")].join(d));
  lines.push([q("Savings Rate (%)"), `${analysis.savingsRatePct.toFixed(1)}%`, "", q("Net savings as % of total revenue")].join(d));
  lines.push([q("Fixed Recurring Commitments"), fmtInr(analysis.recurringPaise), analysis.recurringPaise.toString(), q("Rent, utilities & active subscriptions")].join(d));
  lines.push([q("Liquid Cash Position"), fmtInr(analysis.liquidCashPaise), analysis.liquidCashPaise.toString(), q("Available bank balances + cash in hand")].join(d));
  lines.push([q("Credit Card Liabilities"), fmtInr(analysis.creditDebtPaise), analysis.creditDebtPaise.toString(), q("Active outstanding credit obligations")].join(d));
  lines.push("");

  // SECTION 2: CATEGORY BREAKDOWN & BUDGET PERFORMANCE
  lines.push([q("2. CATEGORY BREAKDOWN & BUDGET PERFORMANCE"), q("ACTUAL SPENT (INR)"), q("BUDGET CEILING (INR)"), q("UTILIZATION %"), q("VARIANCE (INR)"), q("STATUS")].join(d));
  for (const b of safeBudgets) {
    const spent = analysis.categorySpent[b.category] || 0;
    const pct = b.limitPaise > 0 ? ((spent / b.limitPaise) * 100).toFixed(1) : (spent > 0 ? "100.0" : "0.0");
    const variance = (b.limitPaise - spent) / 100;
    const status = spent > b.limitPaise ? "Over Limit" : Number(pct) >= 80 ? "Near Limit (80%+)" : "On Target";
    lines.push([
      q(b.category),
      fmtInr(spent),
      fmtInr(b.limitPaise),
      `${pct}%`,
      variance.toFixed(2),
      q(status)
    ].join(d));
  }
  lines.push("");

  // SECTION 3: ACCOUNT BALANCES & RECONCILIATION
  lines.push([q("3. ACCOUNT BALANCES & RECONCILIATION"), q("ACCOUNT TYPE"), q("STARTING BALANCE (INR)"), q("TOTAL INFLOWS (INR)"), q("TOTAL OUTFLOWS (INR)"), q("NET BALANCE (INR)")].join(d));
  for (const a of safeAccounts) {
    const info = analysis.accountBalances[a.id] || { starting: a.startingBalancePaise, inflow: 0, outflow: 0, current: a.startingBalancePaise };
    lines.push([
      q(a.name),
      q(a.type.toUpperCase()),
      fmtInr(info.starting),
      fmtInr(info.inflow),
      fmtInr(info.outflow),
      fmtInr(info.current)
    ].join(d));
  }
  lines.push("");

  // SECTION 4: COMPLETE ITEMIZED TRANSACTION LEDGER
  lines.push([q("4. ITEMIZED TRANSACTION LEDGER"), q("DATE"), q("FLOW TYPE"), q("ACCOUNT"), q("CATEGORY"), q("RECURRING"), q("NOTES / MERCHANT"), q("TAGS"), q("AMOUNT (INR)"), q("AMOUNT (PAISE)")].join(d));
  for (const t of safeTransactions) {
    lines.push([
      q(t.id),
      q(t.date),
      q(t.type),
      q(analysis.accountMap[t.accountId] || "Primary Account"),
      q(t.category || ""),
      t.isRecurring ? q("YES") : q("NO"),
      q(t.notes || ""),
      q((t.tags || []).join(" ")),
      fmtInr(t.amountPaise),
      t.amountPaise.toString()
    ].join(d));
  }

  return lines.join("\n");
}
