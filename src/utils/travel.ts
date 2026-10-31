// Travel & Trip Financial Precision Utilities
import type { 
  Trip, 
  TripExpense, 
  TravelCategory, 
  TravelSummary, 
  TravelCategoryBreakdown, 
  PerDaySpend, 
  MemberBalance, 
  SettlementDebt 
} from "../types/index.ts";

export interface CategoryMeta {
  key: TravelCategory;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  presets: string[];
}

export const TRAVEL_CATEGORIES: Record<TravelCategory, CategoryMeta> = {
  activities: {
    key: "activities",
    label: "Activities & Rides",
    color: "#06b6d4", // Ocean Cyan
    bgColor: "rgba(6, 182, 212, 0.12)",
    borderColor: "rgba(6, 182, 212, 0.3)",
    description: "Surfing, kayaking, scuba, boat rides, trekking, theme parks",
    presets: [
      "Surfing Lesson & Board Rental",
      "Sea Kayaking Adventure",
      "Scuba Diving at Coral Island",
      "Sunset Boat Cruise",
      "Trekking Guide & Park Pass",
      "Jet Ski & Parasailing"
    ]
  },
  stay: {
    key: "stay",
    label: "Stay & Lodging",
    color: "#8b5cf6", // Indigo/Purple
    bgColor: "rgba(139, 92, 246, 0.12)",
    borderColor: "rgba(139, 92, 246, 0.3)",
    description: "Hotels, beach resorts, Airbnb villas, homestays, hostels",
    presets: [
      "Beach Resort Villa - Night 1",
      "Boutique Hotel Booking",
      "Airbnb Homestay Deposit",
      "Hostel Dorm Beds",
      "Early Check-in Surcharge"
    ]
  },
  food: {
    key: "food",
    label: "Food & Dining",
    color: "#f59e0b", // Amber
    bgColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(245, 158, 11, 0.3)",
    description: "Beach shacks, cafes, fine dining, street food, drinks, snacks",
    presets: [
      "Beach Shack Seafood Feast",
      "Artisan Cafe Breakfast & Coffee",
      "Sunset Drinks & Cocktails",
      "Local Street Food Crawl",
      "Supermarket Snacks & Water"
    ]
  },
  transport: {
    key: "transport",
    label: "Transportation",
    color: "#3b82f6", // Vibrant Blue
    bgColor: "rgba(59, 130, 246, 0.12)",
    borderColor: "rgba(59, 130, 246, 0.3)",
    description: "Flights, trains, cabs/taxis, scooter rentals, ferries",
    presets: [
      "Airport Taxi Transfer",
      "Scooter / Bike Daily Rental",
      "Intercity Train Tickets",
      "Self-Drive Car Rental",
      "Island Ferry Tickets"
    ]
  },
  fuel: {
    key: "fuel",
    label: "Fuel & Tolls",
    color: "#ec4899", // Magenta/Pink
    bgColor: "rgba(236, 72, 153, 0.12)",
    borderColor: "rgba(236, 72, 153, 0.3)",
    description: "Petrol/diesel tank refills, highway FASTag tolls, parking",
    presets: [
      "Petrol Tank Fill at Highway Pump",
      "Highway FASTag Toll Charges",
      "Resort Parking Fees",
      "Scooter Petrol Top-up"
    ]
  },
  shopping: {
    key: "shopping",
    label: "Shopping & Souvenirs",
    color: "#10b981", // Emerald
    bgColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    description: "Night markets, local handicrafts, spices, gifts, attire",
    presets: [
      "Flea Market Handicrafts & Souvenirs",
      "Local Spices & Cashew Boxes",
      "Beachwear & Flip Flops"
    ]
  },
  other: {
    key: "other",
    label: "Other & Permits",
    color: "#94a3b8", // Slate
    bgColor: "rgba(148, 163, 184, 0.12)",
    borderColor: "rgba(148, 163, 184, 0.3)",
    description: "Forest permits, photography fees, tips, first aid",
    presets: [
      "National Park Entry Permits",
      "Service Tips & Porterage",
      "Travel First Aid & Sunscreen"
    ]
  }
};

/**
 * Calculates total inclusive days between two YYYY-MM-DD dates
 * e.g. 2026-10-18 to 2026-10-24 -> 7 days
 */
export function calculateTripDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  try {
    const start = new Date(`${startDate}T00:00:00Z`).getTime();
    const end = new Date(`${endDate}T00:00:00Z`).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 1;
    const diffMs = end - start;
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, days);
  } catch {
    return 1;
  }
}

/**
 * Formats date range nicely (e.g. "18 Oct – 24 Oct 2026")
 */
export function formatTripDateRange(startDate: string, endDate: string): string {
  try {
    const s = new Date(`${startDate}T00:00:00`);
    const e = new Date(`${endDate}T00:00:00`);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return `${startDate} to ${endDate}`;

    const sDay = s.getDate();
    const sMonth = s.toLocaleDateString("en-IN", { month: "short" });
    const eDay = e.getDate();
    const eMonth = e.toLocaleDateString("en-IN", { month: "short" });
    const year = e.getFullYear();

    if (sMonth === eMonth && s.getFullYear() === e.getFullYear()) {
      return `${sDay} – ${eDay} ${sMonth} ${year}`;
    }
    return `${sDay} ${sMonth} – ${eDay} ${eMonth} ${year}`;
  } catch {
    return `${startDate} – ${endDate}`;
  }
}

/**
 * Calculates integer paise split with zero lost paise
 * Distributes remainder paise evenly across members so sum(shares) === amountPaise
 */
export function computeExpenseShares(
  amountPaise: number,
  _paidBy: string,
  splitMembers: string[],
  myName: string = "Me"
): { mySharePaise: number; perMemberShares: Record<string, number> } {
  const members = splitMembers && splitMembers.length > 0 ? splitMembers : [myName];
  const count = members.length;
  
  if (count === 0 || amountPaise <= 0) {
    return { mySharePaise: 0, perMemberShares: {} };
  }

  const baseShare = Math.floor(amountPaise / count);
  const remainder = amountPaise % count;

  const perMemberShares: Record<string, number> = {};
  for (let i = 0; i < count; i++) {
    const member = members[i];
    // Give 1 extra paisa to the first `remainder` members
    perMemberShares[member] = baseShare + (i < remainder ? 1 : 0);
  }

  const mySharePaise = perMemberShares[myName] || 0;

  return { mySharePaise, perMemberShares };
}

/**
 * Computes all analytics for a given trip and its expenses
 */
export function computeTravelSummary(
  trip: Trip,
  expenses: TripExpense[],
  myName: string = "Me"
): TravelSummary {
  const safeExpenses = expenses || [];
  const membersList = trip.members && trip.members.length > 0 ? trip.members : [myName];
  const allMembers = Array.from(new Set([myName, ...membersList]));

  let totalSpentPaise = 0;
  let myTotalSpentPaise = 0;

  // Track payments and shares per member
  const memberPaid: Record<string, number> = {};
  const memberShares: Record<string, number> = {};
  for (const m of allMembers) {
    memberPaid[m] = 0;
    memberShares[m] = 0;
  }

  // Category aggregations
  const categorySpent: Record<TravelCategory, number> = {
    activities: 0,
    stay: 0,
    food: 0,
    transport: 0,
    fuel: 0,
    shopping: 0,
    other: 0
  };

  // Per day aggregations
  const dayMap: Record<string, { totalPaise: number; count: number }> = {};

  for (const exp of safeExpenses) {
    totalSpentPaise += exp.amountPaise;

    // Track payer
    const payer = exp.paidBy || myName;
    memberPaid[payer] = (memberPaid[payer] || 0) + exp.amountPaise;

    // Split shares
    const { mySharePaise, perMemberShares } = computeExpenseShares(
      exp.amountPaise,
      payer,
      exp.splitMembers && exp.splitMembers.length > 0 ? exp.splitMembers : allMembers,
      myName
    );

    myTotalSpentPaise += mySharePaise;

    for (const [member, share] of Object.entries(perMemberShares)) {
      memberShares[member] = (memberShares[member] || 0) + share;
    }

    // Category
    const cat = exp.category in categorySpent ? exp.category : "other";
    categorySpent[cat] = (categorySpent[cat] || 0) + exp.amountPaise;

    // Day
    if (!dayMap[exp.date]) {
      dayMap[exp.date] = { totalPaise: 0, count: 0 };
    }
    dayMap[exp.date].totalPaise += exp.amountPaise;
    dayMap[exp.date].count += 1;
  }

  // Days count and daily average
  const daysCount = calculateTripDays(trip.startDate, trip.endDate);
  const dailyAveragePaise = daysCount > 0 ? Math.round(totalSpentPaise / daysCount) : totalSpentPaise;

  // Budget comparison
  const budgetPaise = trip.budgetPaise || 0;
  const budgetUsedPct = budgetPaise > 0 
    ? Math.round((totalSpentPaise / budgetPaise) * 100)
    : 0;

  // Per Day Spending list sorted by date
  const tripStartMs = new Date(`${trip.startDate}T00:00:00Z`).getTime();
  const sortedDates = Object.keys(dayMap).sort();
  const perDaySpending: PerDaySpend[] = sortedDates.map((date) => {
    let dayIndex = 1;
    try {
      const curMs = new Date(`${date}T00:00:00Z`).getTime();
      if (!isNaN(tripStartMs) && !isNaN(curMs) && curMs >= tripStartMs) {
        dayIndex = Math.round((curMs - tripStartMs) / (1000 * 60 * 60 * 24)) + 1;
      }
    } catch {
      // fallback
    }
    return {
      date,
      dayIndex,
      totalPaise: dayMap[date].totalPaise,
      count: dayMap[date].count
    };
  });

  // Category breakdown list sorted by spentPaise descending
  const categoryBreakdown: TravelCategoryBreakdown[] = (Object.keys(TRAVEL_CATEGORIES) as TravelCategory[])
    .map((catKey) => {
      const spent = categorySpent[catKey] || 0;
      const pct = totalSpentPaise > 0 ? Math.round((spent / totalSpentPaise) * 100) : 0;
      return {
        category: catKey,
        label: TRAVEL_CATEGORIES[catKey].label,
        spentPaise: spent,
        pct,
        color: TRAVEL_CATEGORIES[catKey].color
      };
    })
    .sort((a, b) => b.spentPaise - a.spentPaise);

  // Member Balances & Simplified Settlement Debts
  const memberBalances: MemberBalance[] = allMembers.map((member) => {
    const paid = memberPaid[member] || 0;
    const share = memberShares[member] || 0;
    return {
      member,
      paidPaise: paid,
      sharePaise: share,
      netPaise: paid - share
    };
  });

  // Calculate who owes whom (debt minimization)
  const settlementDebts = computeSettlementDebts(memberBalances);

  return {
    totalSpentPaise,
    myTotalSpentPaise,
    dailyAveragePaise,
    budgetPaise,
    budgetUsedPct,
    daysCount,
    perDaySpending,
    categoryBreakdown,
    memberBalances,
    settlementDebts
  };
}

/**
 * Greedily resolves net positive and negative balances into minimal transactions
 */
export function computeSettlementDebts(memberBalances: MemberBalance[]): SettlementDebt[] {
  // Separate into debtors (net < 0) and creditors (net > 0)
  const debtors = memberBalances
    .filter((b) => b.netPaise < -1) // -1 paisa tolerance
    .map((b) => ({ member: b.member, amount: Math.abs(b.netPaise) }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = memberBalances
    .filter((b) => b.netPaise > 1)
    .map((b) => ({ member: b.member, amount: b.netPaise }))
    .sort((a, b) => b.amount - a.amount);

  const debts: SettlementDebt[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > 0) {
      debts.push({
        from: debtor.member,
        to: creditor.member,
        amountPaise: settledAmount
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount <= 1) dIdx++;
    if (creditor.amount <= 1) cIdx++;
  }

  return debts;
}
