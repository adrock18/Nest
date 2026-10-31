import type { Account, Transaction, MonthlyFinancialSummary } from "../types/index.ts";
import { addPaise } from "./money.ts";

export function calculateMonthlySummary(transactions: Transaction[]): MonthlyFinancialSummary {
  let totalInflowPaise = 0;
  let totalOutflowPaise = 0;
  let recurringCommitmentPaise = 0;
  for (const tx of transactions) {
    if (tx.type === "income") totalInflowPaise = addPaise(totalInflowPaise, tx.amountPaise);
    else {
      totalOutflowPaise = addPaise(totalOutflowPaise, tx.amountPaise);
      if (tx.isRecurring) recurringCommitmentPaise = addPaise(recurringCommitmentPaise, tx.amountPaise);
    }
  }
  const netSavingsPaise = addPaise(totalInflowPaise, -totalOutflowPaise);
  return {
    totalInflowPaise, totalOutflowPaise, netSavingsPaise, recurringCommitmentPaise,
    savingsRatePercentage: totalInflowPaise > 0 ? netSavingsPaise / totalInflowPaise * 100 : 0
  };
}

export function calculateAccountBalances(accounts: Account[], transactions: Transaction[]): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const account of accounts) {
    // Positive credit starting balances represent outstanding debt, not cash.
    balances[account.id] = account.type === "credit" ? -account.startingBalancePaise : account.startingBalancePaise;
  }
  for (const tx of transactions) {
    if (balances[tx.accountId] !== undefined) {
      balances[tx.accountId] = addPaise(balances[tx.accountId], tx.type === "income" ? tx.amountPaise : -tx.amountPaise);
    }
  }
  return balances;
}

export function calculateCashPosition(accounts: Account[], balances: Record<string, number>) {
  let liquidCashPaise = 0;
  let creditDebtPaise = 0;
  for (const account of accounts) {
    const balance = balances[account.id];
    if (account.type === "credit") creditDebtPaise = addPaise(creditDebtPaise, Math.max(0, -balance));
    else liquidCashPaise = addPaise(liquidCashPaise, balance);
  }
  return { liquidCashPaise, creditDebtPaise, netCashPositionPaise: addPaise(liquidCashPaise, -creditDebtPaise) };
}

export function computeBudgetProgress(spentPaise: number, limitPaise: number) {
  const pct = limitPaise > 0 ? spentPaise / limitPaise * 100 : (spentPaise > 0 ? 100 : 0);
  const isOver = spentPaise > limitPaise;
  const isAtLimit = spentPaise === limitPaise && limitPaise > 0;
  const isNear = pct >= 80 && !isOver && !isAtLimit;
  return { pct, isOver, isAtLimit, isNear, remainingPaise: Math.max(0, limitPaise - spentPaise) };
}
