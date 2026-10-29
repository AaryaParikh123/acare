// Date and currency formatting utilities

export function formatDate(isoDate: string | undefined | null): string {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return toIsoDate(d);
}

export function addWeeks(isoDate: string, weeks: number): string {
  return addDays(isoDate, weeks * 7);
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86400000);
}

export function isOverdue(dueDate: string): boolean {
  return daysBetween(today(), dueDate) < 0;
}

export function isDueSoon(dueDate: string, withinDays = 7): boolean {
  const diff = daysBetween(today(), dueDate);
  return diff >= 0 && diff <= withinDays;
}
