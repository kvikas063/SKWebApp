/** All monetary values stored as integer paise (1 INR = 100 paise) */

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Round half up to nearest rupee for display */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(rupees));
}

export function formatINRDecimal(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

const CRORE = 10_000_000;
const LAKH = 100_000;
const THOUSAND = 1_000;

/** Drop trailing zeros from a fixed-decimal string: "4.40" -> "4.4", "4.00" -> "4". */
function trimTrailingZeros(fixed: string): string {
  return fixed.replace(/\.?0+$/, "");
}

/**
 * Indian shorthand for a rupee amount: Cr (crore), L (lakh), K (thousand).
 * Paise are scaled to rupees first, so 440638200 -> "₹4.41 Cr".
 *
 * Written by hand rather than with `Intl`'s `notation: "compact"`, which would
 * roll over to T or B above a hundred crores and emits suffixes glued to the
 * number ("4.4Cr"). Here the scale stops at Cr, and the suffix is spaced and
 * prefixed with ₹ the way the figure is written out.
 *
 * Decimals are capped at 2 with trailing zeros dropped, so this reads
 * "₹4.4 Cr" rather than "₹4.40 Cr". Below a thousand rupees the full rupee
 * amount is shown, since abbreviating it would lose more than it saves.
 *
 * Accepts `bigint` because `Project.budgetPaise` is a BigInt column; those
 * values are converted with `Number()`, which stays exact well past any
 * plausible project budget.
 */
export function formatINRCompact(paise: number | bigint): string {
  const rupees = Number(paise) / 100;
  const sign = rupees < 0 ? "-" : "";
  const abs = Math.abs(rupees);

  if (abs >= CRORE) return `${sign}₹${trimTrailingZeros((abs / CRORE).toFixed(2))} Cr`;
  if (abs >= LAKH) return `${sign}₹${trimTrailingZeros((abs / LAKH).toFixed(2))} L`;
  if (abs >= THOUSAND) return `${sign}₹${trimTrailingZeros((abs / THOUSAND).toFixed(2))} K`;
  return formatINR(Number(paise));
}

/** Apply percentage to paise amount, round to nearest paise */
export function applyPercent(paise: number, percent: number): number {
  return Math.round((paise * percent) / 100);
}
