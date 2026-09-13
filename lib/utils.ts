export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactIndianCurrency(amount: number): string {
  const absoluteAmount = Math.abs(amount);

  if (absoluteAmount >= 100000) {
    return `${amount < 0 ? "-" : ""}₹${(absoluteAmount / 100000).toFixed(1)}L`;
  }

  if (absoluteAmount >= 1000) {
    return `${amount < 0 ? "-" : ""}₹${(absoluteAmount / 1000).toFixed(1)}K`;
  }

  return `${amount < 0 ? "-" : ""}₹${absoluteAmount.toFixed(0)}`;
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}