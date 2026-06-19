export function minorToMajor(minor: number): number {
  return minor / 100;
}

export function majorToMinor(major: number): number {
  return Math.round(major * 100);
}

export function formatCurrency(minor: number, symbol = '₱'): string {
  const major = minorToMajor(Math.abs(minor));
  const formatted = major.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${minor < 0 ? '-' : ''}${symbol}${formatted}`;
}

export function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
