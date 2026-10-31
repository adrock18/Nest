// Currency formatting utility adhering to Indian Rupee and Paise standards

export function formatPaiseToRupees(paise: number): string {
  if (isNaN(paise) || !isFinite(paise)) {
    return "₹0.00";
  }
  const isNegative = paise < 0;
  const absRupees = Math.abs(paise) / 100;

  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(absRupees);

  return isNegative ? `-${formatted}` : formatted;
}

export function parseRupeesToPaise(input: string): number {
  if (typeof input !== "string") {
    throw new Error("Amount must be a valid string.");
  }

  // Sanitize: strip currency symbols (₹, $), commas, and surrounding whitespace
  const sanitized = input.trim().replace(/[₹$,\s]/g, "");

  if (!sanitized) {
    throw new Error("Amount cannot be empty.");
  }

  // Validate format: positive decimal or integer only (e.g. "120", "120.5", ".50")
  if (!/^(?:\d+(?:\.\d{1,4})?|\.\d{1,4})$/.test(sanitized)) {
    throw new Error("Amount must be a valid positive number.");
  }

  const numeric = parseFloat(sanitized);
  if (isNaN(numeric) || numeric <= 0 || !isFinite(numeric)) {
    throw new Error("Amount must be a positive number.");
  }

  // Round to nearest whole integer paise (e.g., 12.50 -> 1250)
  const paise = Math.round(numeric * 100);
  if (paise <= 0) {
    throw new Error("Amount must be at least 1 paisa (₹0.01).");
  }

  return paise;
}

