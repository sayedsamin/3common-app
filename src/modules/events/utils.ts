import { ApiError } from '@/lib/api-client';
import { externalUrlSchema } from './schemas';

export function eventErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Unable to load events. Please try again.';
}
export function statusLabel(value?: string) {
  if (!value) return 'Status unavailable';
  return value === 'schedule' ? 'Scheduled' : value.charAt(0).toUpperCase() + value.slice(1);
}
export function eventDate(value?: string, timeZone?: string) {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: timeZone || 'UTC' }).format(date);
  } catch { return date.toISOString(); }
}
export function eventMoney(cents?: number | null, currency?: string) {
  if (cents === undefined || cents === null) return 'Not provided';
  if (!currency) return `${cents / 100} (currency not provided)`;
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100); }
  catch { return `${(cents / 100).toFixed(2)} ${currency}`; }
}
export function eventListDate(value?: string, timeZone?: string) {
  if (!value) return 'Date to be announced';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  try { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: timeZone || 'UTC' }).format(date); }
  catch { return eventDate(value, 'UTC'); }
}

export function eventDetailsLayout(contentWidth: number, fontScale: number) {
  const gap = 20;
  const hasColumns = contentWidth >= 760 && fontScale <= 1.2;
  const hasSideBySideStats = contentWidth >= 360 && fontScale <= 1.2;
  return {
    hasColumns,
    columnWidth: hasColumns ? (contentWidth - gap) / 2 : contentWidth,
    statWidth: hasSideBySideStats ? (contentWidth - 12) / 2 : contentWidth,
  };
}
export function safeEventUrl(value?: string) {
  const result = externalUrlSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

// Event HTML is displayed as readable text on all platforms, never executed.
export function eventText(html: string): string {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?\s*>|<\/(?:p|div|h[1-6]|li)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '• ').replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match: string, entity: string) => {
      if (!entity.startsWith('#')) return entities[entity.toLowerCase()] ?? match;
      const code = entity.toLowerCase().startsWith('#x') ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }).replace(/\n{3,}/g, '\n\n').trim();
}
