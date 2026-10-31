// Nest Financial Types - Strict Financial Precision

export type FlowType = "income" | "expense";
export type AccountType = "bank" | "credit" | "cash";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  startingBalancePaise: number;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: FlowType;
  accountId: string; // Account attribution (e.g. 'acc-primary')
  category: string;
  notes: string;
  tags: string[]; // Multi-dimensional tags (e.g. ['#Work', '#TaxDeductible'])
  isRecurring: boolean; // Recurring bill or subscription marker
  amountPaise: number; // Stored strictly as positive integer paise (₹10.50 -> 1050)
  tripExpenseId?: string | null;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isIncome: boolean;
}

export interface CategoryBudget {
  category: string;
  limitPaise: number;
  color: string;
}

export interface MonthlyFinancialSummary {
  totalInflowPaise: number;
  totalOutflowPaise: number;
  netSavingsPaise: number;
  savingsRatePercentage: number;
  recurringCommitmentPaise: number;
}

// Travel & Trip Expenses Types
export type TravelCategory = 
  | "stay" 
  | "food" 
  | "activities" 
  | "transport" 
  | "fuel" 
  | "shopping" 
  | "other";

export type SplitType = "equal" | "custom" | "personal" | "itemized";

export interface ExpenseItem {
  id: string;
  name: string;
  quantity: number;
  pricePaise: number; // Unit price in integer paise
  totalPaise: number; // quantity * pricePaise
  isMine: boolean; // Selected as consumed / eaten by me
  isShared: boolean; // Shared among all or selected members
  sharedWith?: string[]; // Specific members if not all
  myConsumedQuantity?: number; // e.g. 1 out of 3
}

export interface ItemizedSplitResult {
  totalBillPaise: number;
  itemsSubtotalPaise: number;
  myDirectItemsPaise: number;
  mySharedItemsPaise: number;
  myTaxSharePaise: number;
  myServiceChargeSharePaise: number;
  myDiscountSharePaise: number;
  mySharePaise: number;
  groupRemainderPaise: number;
  memberShares: Record<string, number>;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  budgetPaise: number; // Stored strictly as positive integer paise
  members: string[]; // List of companions, e.g. ["Me", "Aarav", "Pooja"]
  coverColor: string;
  createdAt: string;
}

export interface TripExpense {
  id: string;
  tripId: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: TravelCategory;
  amountPaise: number; // Stored strictly as positive integer paise
  paidBy: string; // Member name, e.g. "Me"
  splitType: SplitType;
  splitMembers: string[]; // Members who share this cost
  mySharePaise: number; // User's calculated portion in integer paise
  notes?: string;
  items?: ExpenseItem[];
  receiptImage?: string;
}

export interface MemberBalance {
  member: string;
  paidPaise: number;
  sharePaise: number;
  netPaise: number; // Positive = owed money back, negative = owes group
}

export interface SettlementDebt {
  from: string;
  to: string;
  amountPaise: number;
}

export interface PerDaySpend {
  date: string;
  dayIndex: number;
  totalPaise: number;
  count: number;
}

export interface TravelCategoryBreakdown {
  category: TravelCategory;
  label: string;
  spentPaise: number;
  pct: number;
  color: string;
}

export interface TravelSummary {
  totalSpentPaise: number;
  myTotalSpentPaise: number;
  dailyAveragePaise: number;
  budgetPaise: number;
  budgetUsedPct: number;
  daysCount: number;
  perDaySpending: PerDaySpend[];
  categoryBreakdown: TravelCategoryBreakdown[];
  memberBalances: MemberBalance[];
  settlementDebts: SettlementDebt[];
}
