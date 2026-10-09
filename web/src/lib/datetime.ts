import { toDateInputValue } from "@/lib/format";

/**
 * Convert a yyyy-MM-dd value from <input type="date"> into an ISO string
 * without shifting the calendar day because of timezone.
 * If the date is today, the current time is used.
 */
export function dateToIsoWithNow(date: string): string {
  if (!date) return "";
  if (date === toDateInputValue(new Date())) return new Date().toISOString();
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d, 9, 0, 0).toISOString();
}

/** Noon local time keeps the same calendar day in UTC for most timezones. */
export function dateToNoonIso(date: string): string {
  if (!date) return "";
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}