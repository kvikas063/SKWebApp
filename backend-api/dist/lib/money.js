export function rupeesToPaise(rupees) {
    return Math.round(rupees * 100);
}
export function paiseToRupees(paise) {
    return paise / 100;
}
export function formatINR(paise) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(paiseToRupees(paise));
}
export function formatINRCompact(paise) {
    const rupees = paiseToRupees(paise);
    if (rupees >= 1_00_00_000) {
        return `₹${(rupees / 1_00_00_000).toFixed(2)} Cr`;
    }
    if (rupees >= 1_00_000) {
        return `₹${(rupees / 1_00_000).toFixed(2)} L`;
    }
    if (rupees >= 1_000) {
        return `₹${(rupees / 1_000).toFixed(1)} K`;
    }
    return formatINR(paise);
}
export function applyPercent(basePaise, percent) {
    return Math.round((basePaise * percent) / 100);
}
//# sourceMappingURL=money.js.map