import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, symbol: string = "$"): string {
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/**
 * Format a date with timezone (receipt header style)
 * e.g. "Jan 29, 2026, 08:12 AM JST"
 */
export function formatDateTime(date: Date, timezone?: string): string {
  if (timezone) {
    try {
      return formatInTimeZone(date, timezone, "MMM dd, yyyy, hh:mm a zzz");
    } catch {
      // Fallback if timezone is invalid
    }
  }

  return format(date, "MMM dd, yyyy, hh:mm a");
}

/**
 * Calculate duration between two dates
 */
export function formatDuration(start: Date, end: Date): string {
  const durationMs = end.getTime() - start.getTime();
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}
