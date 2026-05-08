import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import type { CurrencySymbol, TimeFormat } from '../store/useSettingsStore';

/**
 * Format elapsed seconds as HH:MM:SS
 */
export function formatHHMMSS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format decimal hours as "4h 30m"
 */
export function formatDuration(hours: number, fmt: TimeFormat = 'HH:MM'): string {
  if (fmt === 'decimal') {
    return `${hours.toFixed(1)}h`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format decimal hours as "04:30:00" (HH:MM:SS)
 */
export function formatDurationHHMM(hours: number): string {
  const totalSeconds = Math.round(hours * 3600);
  return formatHHMMSS(totalSeconds);
}

/**
 * Format a Date as German locale date string: "01. Okt. 2023"
 */
export function formatGermanDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "dd. MMM. yyyy", { locale: de });
}

/**
 * Format time range: "09:00 - 11:30" or "09:00 - Jetzt"
 */
export function formatTimeRange(startIso: string, endIso: string | null): string {
  const start = format(new Date(startIso), 'HH:mm');
  const end = endIso ? format(new Date(endIso), 'HH:mm') : 'Jetzt';
  return `${start} - ${end}`;
}

/**
 * Format earnings: "€ 125,00" or "$ 125.00"
 */
export function formatEarnings(hours: number, rate: number, symbol: CurrencySymbol): string {
  const amount = hours * rate;
  const isEuro = symbol === '€';
  const formatted = isEuro
    ? amount.toFixed(2).replace('.', ',')
    : amount.toFixed(2);
  return `${symbol} ${formatted}`;
}

/**
 * Returns seconds elapsed since an ISO start time
 */
export function elapsedSeconds(startIso: string): number {
  return Math.floor((Date.now() - new Date(startIso).getTime()) / 1000);
}

/**
 * Format date as section header
 */
export function formatSectionHeader(isoStr: string): string {
  const d = new Date(isoStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  ) {
    return 'Heute';
  }
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Gestern';
  }
  return format(d, "EEEE, dd. MMM.", { locale: de });
}

/**
 * Get the day-of-week label short (Mo, Di, Mi, Do, Fr)
 */
export const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];

/**
 * Get current weekday index 0=Mon … 4=Fri
 */
export function getCurrentWeekdayIndex(): number {
  const day = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat
  return day === 0 ? 4 : day - 1; // map to Mon=0..Fri=4, clamp weekend to Fri
}
