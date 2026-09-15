export function formatBudget(paise: number | bigint): string {
  const rupees = Number(paise) / 100;
  if (rupees >= 100000000) {
    return `₹${Math.round(rupees / 100000000)}Cr`;
  }
  if (rupees >= 100000) {
    return `₹${Math.round(rupees / 100000)}L`;
  }
  if (rupees >= 1000) {
    return `₹${Math.round(rupees / 1000)}K`;
  }
  return `₹${Math.round(rupees)}`;
}