// Itemized Bill Parsing and Zero-Loss Split Engine for Nest
import type { ExpenseItem, ItemizedSplitResult, TravelCategory } from "../types/index.ts";

export interface BillPreset {
  id: string;
  name: string;
  category: TravelCategory;
  description: string;
  vendor: string;
  defaultTitle: string;
  taxPaise: number;
  serviceChargePaise: number;
  items: Array<{
    name: string;
    quantity: number;
    pricePaise: number;
    totalPaise: number;
    isMine: boolean;
    isShared: boolean;
    myConsumedQuantity?: number;
  }>;
}

/**
 * Computes exact itemized split in integer paise with zero lost paise.
 * Accounts for personal items, shared items, and distributes taxes/service charges proportionally.
 */
export function computeItemizedSplit(
  items: ExpenseItem[],
  members: string[],
  taxPaise: number = 0,
  serviceChargePaise: number = 0,
  discountPaise: number = 0,
  tipPaise: number = 0,
  myName: string = "Me"
): ItemizedSplitResult {
  const allMembers = members && members.length > 0 ? members : [myName];
  const count = allMembers.length;

  let itemsSubtotalPaise = 0;
  let myDirectItemsPaise = 0;
  let mySharedItemsPaise = 0;

  // Track each member's itemized direct + shared costs
  const memberItemCost: Record<string, number> = {};
  for (const m of allMembers) {
    memberItemCost[m] = 0;
  }

  for (const item of items) {
    const totalItemPaise = item.totalPaise > 0 
      ? item.totalPaise 
      : item.quantity * item.pricePaise;
    
    itemsSubtotalPaise += totalItemPaise;

    if (item.isShared) {
      // Divided among sharedWith members or all members
      const participants = item.sharedWith && item.sharedWith.length > 0 
        ? item.sharedWith 
        : allMembers;
      const pCount = participants.length;

      if (pCount > 0) {
        const baseShare = Math.floor(totalItemPaise / pCount);
        const remainder = totalItemPaise % pCount;

        for (let i = 0; i < pCount; i++) {
          const m = participants[i];
          const share = baseShare + (i < remainder ? 1 : 0);
          memberItemCost[m] = (memberItemCost[m] || 0) + share;
          if (m === myName) {
            mySharedItemsPaise += share;
          }
        }
      }
    } else if (item.isMine) {
      // Directly consumed by "Me"
      let myPortion = totalItemPaise;
      if (
        item.myConsumedQuantity && 
        item.myConsumedQuantity > 0 && 
        item.myConsumedQuantity < item.quantity
      ) {
        myPortion = Math.round((item.myConsumedQuantity / item.quantity) * totalItemPaise);
      }
      myDirectItemsPaise += myPortion;
      memberItemCost[myName] = (memberItemCost[myName] || 0) + myPortion;

      // If partial quantity was consumed, remainder is attributed to other members
      const unconsumed = totalItemPaise - myPortion;
      if (unconsumed > 0) {
        const others = allMembers.filter((m) => m !== myName);
        const oCount = others.length;
        if (oCount > 0) {
          const baseOther = Math.floor(unconsumed / oCount);
          const remOther = unconsumed % oCount;
          for (let i = 0; i < oCount; i++) {
            const m = others[i];
            memberItemCost[m] = (memberItemCost[m] || 0) + baseOther + (i < remOther ? 1 : 0);
          }
        }
      }
    } else {
      // Consumed by other group members
      const others = allMembers.filter((m) => m !== myName);
      const oCount = others.length > 0 ? others.length : 1;
      const targetGroup = others.length > 0 ? others : [allMembers[0]];
      const baseOther = Math.floor(totalItemPaise / oCount);
      const remOther = totalItemPaise % oCount;

      for (let i = 0; i < oCount; i++) {
        const m = targetGroup[i];
        memberItemCost[m] = (memberItemCost[m] || 0) + baseOther + (i < remOther ? 1 : 0);
      }
    }
  }

  // Calculate Net Fees (Tax + Service Charge + Tip - Discount)
  const netFeesPaise = taxPaise + serviceChargePaise + tipPaise - discountPaise;
  const totalBillPaise = Math.max(0, itemsSubtotalPaise + netFeesPaise);

  let myTaxSharePaise = 0;
  let myServiceChargeSharePaise = 0;
  let myDiscountSharePaise = 0;
  const memberShares: Record<string, number> = {};

  if (itemsSubtotalPaise > 0) {
    // Proportional distribution of taxes, service fees, discounts based on consumed share
    for (const m of allMembers) {
      const spent = memberItemCost[m] || 0;
      const ratio = spent / itemsSubtotalPaise;

      const mTax = Math.round(taxPaise * ratio);
      const mService = Math.round(serviceChargePaise * ratio);
      const mTip = Math.round(tipPaise * ratio);
      const mDiscount = Math.round(discountPaise * ratio);

      memberShares[m] = Math.max(0, spent + mTax + mService + mTip - mDiscount);

      if (m === myName) {
        myTaxSharePaise = mTax;
        myServiceChargeSharePaise = mService + mTip;
        myDiscountSharePaise = mDiscount;
      }
    }
  } else {
    // Equal distribution if no items
    const baseShare = Math.floor(totalBillPaise / count);
    const remainder = totalBillPaise % count;
    for (let i = 0; i < count; i++) {
      const m = allMembers[i];
      memberShares[m] = baseShare + (i < remainder ? 1 : 0);
    }
  }

  // Ensure sum of all member shares equals totalBillPaise exactly (zero-loss guarantee)
  const sharesSum = Object.values(memberShares).reduce((acc, v) => acc + v, 0);
  const diff = totalBillPaise - sharesSum;
  if (diff !== 0 && allMembers.length > 0) {
    // Reconcile rounding difference to first non-zero member
    const firstMember = allMembers[0];
    memberShares[firstMember] = Math.max(0, (memberShares[firstMember] || 0) + diff);
  }

  const mySharePaise = memberShares[myName] !== undefined 
    ? memberShares[myName] 
    : (myDirectItemsPaise + mySharedItemsPaise + myTaxSharePaise + myServiceChargeSharePaise - myDiscountSharePaise);

  const groupRemainderPaise = Math.max(0, totalBillPaise - mySharePaise);

  return {
    totalBillPaise,
    itemsSubtotalPaise,
    myDirectItemsPaise,
    mySharedItemsPaise,
    myTaxSharePaise,
    myServiceChargeSharePaise,
    myDiscountSharePaise,
    mySharePaise,
    groupRemainderPaise,
    memberShares
  };
}

/**
 * Intelligent text receipt parser that extracts items, quantities, and prices from pasted bill text
 */
export function parseRawBillText(rawText: string): {
  items: ExpenseItem[];
  taxPaise: number;
  serviceChargePaise: number;
  detectedTotalPaise?: number;
} {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: ExpenseItem[] = [];
  let taxPaise = 0;
  let serviceChargePaise = 0;
  let detectedTotalPaise = 0;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Detect Tax / GST / VAT lines
    const taxMatch = line.match(/(?:gst|vat|tax|cgst|sgst).*?(\d+(?:[.,]\d{1,2})?)/i);
    if (taxMatch && !line.match(/total/i)) {
      const val = parseFloat(taxMatch[1].replace(/,/g, ""));
      if (!isNaN(val)) taxPaise += Math.round(val * 100);
      continue;
    }

    // Detect Service Charge / Tip
    const serviceMatch = line.match(/(?:service\s*(?:charge|fee)|tip|gratuity).*?(\d+(?:[.,]\d{1,2})?)/i);
    if (serviceMatch) {
      const val = parseFloat(serviceMatch[1].replace(/,/g, ""));
      if (!isNaN(val)) serviceChargePaise += Math.round(val * 100);
      continue;
    }

    // Detect Grand Total
    const totalMatch = line.match(/(?:grand\s*total|net\s*total|total\s*due|total\s*amount|bill\s*total)[\s:]*₹?\s*(\d+(?:[.,]\d{1,2})?)/i);
    if (totalMatch) {
      const val = parseFloat(totalMatch[1].replace(/,/g, ""));
      if (!isNaN(val)) detectedTotalPaise = Math.round(val * 100);
      continue;
    }

    // Skip generic headers / metadata
    if (line.match(/^(subtotal|cash|card|upi|balance|change|date|table|waiter|receipt|invoice)/i)) {
      continue;
    }

    // Parse regular item line: e.g. "2 Butter Chicken 450 900" or "Garlic Naan x 4 @ 60 = 240" or "Biryani 380"
    // Extract numbers at the end of the line
    const priceMatch = line.match(/(\d+(?:[.,]\d{1,2})?)\s*$/);
    if (priceMatch) {
      const lastNumber = parseFloat(priceMatch[1].replace(/,/g, ""));
      const remainingLine = line.substring(0, priceMatch.index).trim();

      // Check if there is an explicit quantity
      let quantity = 1;
      let itemName = remainingLine;

      const qtyMatch = remainingLine.match(/^(\d+)\s*[xX]?\s+(.+)$/) || remainingLine.match(/^(.+?)\s+[xX]\s*(\d+)$/);
      if (qtyMatch) {
        if (/^\d+$/.test(qtyMatch[1])) {
          quantity = parseInt(qtyMatch[1], 10);
          itemName = qtyMatch[2];
        } else {
          itemName = qtyMatch[1];
          quantity = parseInt(qtyMatch[2], 10);
        }
      }

      // Check if there is a unit price before the total price
      const unitPriceMatch = itemName.match(/@?\s*(\d+(?:[.,]\d{1,2})?)\s*$/);
      let unitPricePaise = Math.round(lastNumber * 100);
      let totalPaise = unitPricePaise;

      if (unitPriceMatch && quantity > 1) {
        const parsedUnit = parseFloat(unitPriceMatch[1].replace(/,/g, ""));
        unitPricePaise = Math.round(parsedUnit * 100);
        itemName = itemName.substring(0, unitPriceMatch.index).trim();
      } else if (quantity > 1) {
        // If last number was total, derive unit
        unitPricePaise = Math.round(totalPaise / quantity);
      }

      // Clean item name
      itemName = itemName.replace(/[=–—\-:@]+$/, "").trim();

      if (itemName.length > 1 && totalPaise > 0) {
        const isSharedDefault = /shared|basket|pitcher|platter|starter|naan|roti|water|rental|tolls|fuel/i.test(itemName);
        items.push({
          id: `item-${Date.now()}-${idx}`,
          name: itemName,
          quantity: Math.max(1, quantity),
          pricePaise: unitPricePaise,
          totalPaise: totalPaise,
          isMine: true,
          isShared: isSharedDefault
        });
      }
    }
  }

  return { items, taxPaise, serviceChargePaise, detectedTotalPaise };
}

/**
 * Realistic built-in presets for quick 1-click testing
 */
export const BILL_PRESETS: BillPreset[] = [
  {
    id: "dinner-9-people",
    name: "🍽️ Seafood Dinner Bill (9 People)",
    category: "food",
    description: "Multi-dish dinner at beachside shack for 9 friends with personal dishes and shared starters",
    vendor: "Fisherman's Wharf Beach Shack, Goa",
    defaultTitle: "Seafood Shack Dinner with 9 Friends",
    taxPaise: 27500, // 5% GST on ₹5,500
    serviceChargePaise: 55000, // 10% Service Charge
    items: [
      {
        name: "Butter Garlic Tiger Prawns (Shared Starter)",
        quantity: 2,
        pricePaise: 70000,
        totalPaise: 140000,
        isMine: true,
        isShared: true
      },
      {
        name: "Kingfish Rava Fry (Personal Dish)",
        quantity: 1,
        pricePaise: 65000,
        totalPaise: 65000,
        isMine: true,
        isShared: false
      },
      {
        name: "Goan Prawn Curry & Steamed Rice",
        quantity: 2,
        pricePaise: 55000,
        totalPaise: 110000,
        isMine: false,
        isShared: false
      },
      {
        name: "Chicken Dum Biryani Handi",
        quantity: 2,
        pricePaise: 42000,
        totalPaise: 84000,
        isMine: false,
        isShared: false
      },
      {
        name: "Paneer Butter Masala (Veg Table)",
        quantity: 1,
        pricePaise: 38000,
        totalPaise: 38000,
        isMine: false,
        isShared: false
      },
      {
        name: "Garlic Butter Naan Basket (Shared by 9)",
        quantity: 6,
        pricePaise: 6000,
        totalPaise: 36000,
        isMine: true,
        isShared: true
      },
      {
        name: "Fresh Lime Soda Sweet & Salt (Personal Drink)",
        quantity: 1,
        pricePaise: 11000,
        totalPaise: 11000,
        isMine: true,
        isShared: false
      },
      {
        name: "Cold Draught Beer Pitchers (Shared by 4)",
        quantity: 2,
        pricePaise: 80000,
        totalPaise: 160000,
        isMine: false,
        isShared: false
      },
      {
        name: "Mineral Water Bottles (Shared Table)",
        quantity: 4,
        pricePaise: 4000,
        totalPaise: 16000,
        isMine: true,
        isShared: true
      },
      {
        name: "Sizzling Brownie with Vanilla Ice Cream",
        quantity: 2,
        pricePaise: 25000,
        totalPaise: 50000,
        isMine: true,
        isShared: true
      }
    ]
  },
  {
    id: "beach-rides-adventure",
    name: "🏄 Beach Rides & Water Sports Adventure",
    category: "activities",
    description: "Adventure session with surfing lessons, sea kayaking, and dolphin boat charter",
    vendor: "Ashwem Coastal Surf & Adventure Club",
    defaultTitle: "Morning Surfing & Sea Kayaking Adventure",
    taxPaise: 35000,
    serviceChargePaise: 0,
    items: [
      {
        name: "Surfing 2-Hour Lesson & Board Rental (Personal)",
        quantity: 1,
        pricePaise: 250000,
        totalPaise: 250000,
        isMine: true,
        isShared: false
      },
      {
        name: "Sea Kayaking Double Boat Rental (Shared)",
        quantity: 2,
        pricePaise: 120000,
        totalPaise: 240000,
        isMine: true,
        isShared: true
      },
      {
        name: "Speedboat Dolphin Safari Charter (Shared by all)",
        quantity: 1,
        pricePaise: 350000,
        totalPaise: 350000,
        isMine: true,
        isShared: true
      },
      {
        name: "Snorkeling Mask & Fins Kit (Personal)",
        quantity: 1,
        pricePaise: 60000,
        totalPaise: 60000,
        isMine: false,
        isShared: false
      },
      {
        name: "Locker Rental & Waterproof Bags (Shared)",
        quantity: 2,
        pricePaise: 20000,
        totalPaise: 40000,
        isMine: true,
        isShared: true
      }
    ]
  },
  {
    id: "shopping-supplies",
    name: "🛒 Travel Supplies & Supermarket Run",
    category: "shopping",
    description: "Group supermarket grocery and beach supplies run",
    vendor: "Newton's Supermarket, Candolim",
    defaultTitle: "Beach Trip Supplies & Snacks Run",
    taxPaise: 12000,
    serviceChargePaise: 0,
    items: [
      {
        name: "High SPF 50 Water-Resistant Sunscreen (Personal)",
        quantity: 1,
        pricePaise: 55000,
        totalPaise: 55000,
        isMine: true,
        isShared: false
      },
      {
        name: "20L Mineral Drinking Water Dispenser Jar (Shared)",
        quantity: 2,
        pricePaise: 15000,
        totalPaise: 30000,
        isMine: true,
        isShared: true
      },
      {
        name: "Variety Snack & Energy Bars Box (Shared by 9)",
        quantity: 1,
        pricePaise: 65000,
        totalPaise: 65000,
        isMine: true,
        isShared: true
      },
      {
        name: "First Aid Kit, Bandages & ORS Sachets (Shared)",
        quantity: 1,
        pricePaise: 35000,
        totalPaise: 35000,
        isMine: true,
        isShared: true
      },
      {
        name: "Microfiber Quick-dry Beach Towel (Personal)",
        quantity: 1,
        pricePaise: 45000,
        totalPaise: 45000,
        isMine: false,
        isShared: false
      }
    ]
  },
  {
    id: "highway-fuel-tolls",
    name: "⛽ Road Trip Fuel & Highway Tolls",
    category: "fuel",
    description: "Full fuel tank refill and highway FASTag passes for the rental Thar",
    vendor: "Indian Oil Highway Hub & FASTag",
    defaultTitle: "Highway Fuel Refill & Toll Charges",
    taxPaise: 0,
    serviceChargePaise: 0,
    items: [
      {
        name: "Diesel Tank Refill 42 Liters (Shared by all)",
        quantity: 1,
        pricePaise: 395000,
        totalPaise: 395000,
        isMine: true,
        isShared: true
      },
      {
        name: "Highway FASTag Expressway Toll Plaza (Shared)",
        quantity: 1,
        pricePaise: 45000,
        totalPaise: 45000,
        isMine: true,
        isShared: true
      },
      {
        name: "Candolim Beach Day Parking Pass (Shared)",
        quantity: 1,
        pricePaise: 20000,
        totalPaise: 20000,
        isMine: true,
        isShared: true
      }
    ]
  }
];
