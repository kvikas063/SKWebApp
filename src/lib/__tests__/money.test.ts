import { describe, it, expect } from "vitest";
import { formatINRCompact, rupeesToPaise } from "@/lib/money";

// The formatter takes paise; these cases are written in rupees for legibility.
const paise = rupeesToPaise;

describe("formatINRCompact", () => {
  it("abbreviates crores", () => {
    expect(formatINRCompact(paise(44_063_820))).toBe("₹4.41 Cr");
    expect(formatINRCompact(paise(10_000_000))).toBe("₹1 Cr");
    expect(formatINRCompact(paise(99_000_000))).toBe("₹9.9 Cr");
  });

  it("abbreviates lakhs below a crore", () => {
    expect(formatINRCompact(paise(581_025))).toBe("₹5.81 L");
    expect(formatINRCompact(paise(100_000))).toBe("₹1 L");
  });

  it("abbreviates thousands below a lakh", () => {
    expect(formatINRCompact(paise(50_450))).toBe("₹50.45 K");
    expect(formatINRCompact(paise(1_000))).toBe("₹1 K");
  });

  it("shows the full amount below a thousand rupees", () => {
    expect(formatINRCompact(paise(999))).toBe("₹999");
    expect(formatINRCompact(paise(500))).toBe("₹500");
    expect(formatINRCompact(0)).toBe("₹0");
  });

  it("drops trailing zeros but keeps significant ones", () => {
    expect(formatINRCompact(paise(40_000_000))).toBe("₹4 Cr");
    expect(formatINRCompact(paise(44_000_000))).toBe("₹4.4 Cr");
    expect(formatINRCompact(paise(44_400_000))).toBe("₹4.44 Cr");
    // A zero between non-zero digits must survive.
    expect(formatINRCompact(paise(100_500_000))).toBe("₹10.05 Cr");
  });

  it("rounds to two decimals rather than truncating", () => {
    expect(formatINRCompact(paise(44_449_990))).toBe("₹4.44 Cr");
    expect(formatINRCompact(paise(44_499_990))).toBe("₹4.45 Cr");
  });

  it("keeps counting in crores past a hundred crores instead of switching to T", () => {
    expect(formatINRCompact(paise(2_500_000_000))).toBe("₹250 Cr");
  });

  it("handles negatives", () => {
    expect(formatINRCompact(paise(-44_063_820))).toBe("-₹4.41 Cr");
    expect(formatINRCompact(paise(-500))).toBe("-₹500");
  });

  it("scales paise, not rupees", () => {
    // 100 paise is 1 rupee, which must not read as ₹1 K.
    expect(formatINRCompact(100)).toBe("₹1");
    expect(formatINRCompact(paise(1_000_000))).toBe("₹10 L");
  });

  it("rounds up to the next unit at a boundary", () => {
    // 9,99,999 rounds to "100 L" rather than "99.99 L"; same for thousands.
    expect(formatINRCompact(paise(9_999_999))).toBe("₹100 L");
    expect(formatINRCompact(paise(99_999))).toBe("₹100 K");
  });

  it("accepts bigint, as Project.budgetPaise is a BigInt column", () => {
    expect(formatINRCompact(BigInt(paise(44_063_820)))).toBe("₹4.41 Cr");
    expect(formatINRCompact(BigInt(paise(50_450)))).toBe("₹50.45 K");
    expect(formatINRCompact(BigInt(paise(500)))).toBe("₹500");
  });
});
