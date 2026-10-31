// Currency formatting utility adhering to Indian Rupee and Paise standards

const rupeeGrouping = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatPaiseToDecimal(paise: number): string {
  if (!Number.isSafeInteger(paise)) throw new Error("Money must be a safe whole-paise amount.");
  const absolute = BigInt(Math.abs(paise));
  return `${paise < 0 ? "-" : ""}${absolute / 100n}.${String(absolute % 100n).padStart(2, "0")}`;
}

export function addPaise(left: number, right: number): number {
  const result = left + right;
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right) || !Number.isSafeInteger(result)) {
    throw new Error("Financial total exceeds the supported whole-paise precision limit.");
  }
  return result;
}

export function formatPaiseToRupees(paise: number): string {
  if (isNaN(paise) || !isFinite(paise)) {
    return "₹0.00";
  }
  const [whole, fraction] = formatPaiseToDecimal(Math.abs(paise)).split(".");
  return `${paise < 0 ? "-" : ""}₹${rupeeGrouping.format(BigInt(whole))}.${fraction}`;
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

  const [whole, fraction = ""] = sanitized.split(".");
  const digits = fraction.padEnd(3, "0");
  const paise = BigInt(whole || "0") * 100n
    + BigInt(digits.slice(0, 2))
    + (Number(digits[2]) >= 5 ? 1n : 0n);
  if (paise <= 0n) {
    throw new Error("Amount must be at least 1 paisa (₹0.01).");
  }
  if (paise > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Amount exceeds the supported precision limit.");
  }
  return Number(paise);
}
