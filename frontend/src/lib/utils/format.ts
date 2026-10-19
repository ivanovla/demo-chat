const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const toTime = (t: number | string) => (typeof t === 'number' ? t : new Date(t).getTime());

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const dayDiff = (t: number, now: number) =>
  Math.round((startOfDay(now) - startOfDay(t)) / 86_400_000);

export function relShort(value: number | string, now = Date.now()): string {
  const t = toTime(value);
  const diff = now - t;
  if (diff < MINUTE) return 'now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  const days = dayDiff(t, now);
  if (days === 0) return `${Math.floor(diff / HOUR)}h`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return new Date(t).toLocaleDateString('en-US', { weekday: 'short' });
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function relAgo(value: number | string, now = Date.now()): string {
  const diff = now - toTime(value);
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  return `${Math.floor(diff / HOUR)}h ago`;
}

export const fmtTime = (value: number | string) =>
  new Date(toTime(value)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export function dayLabel(value: number | string, now = Date.now()): string {
  const t = toTime(value);
  const days = dayDiff(t, now);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return new Date(t).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function fmtClock(ms: number): string {
  const s = Math.min(15, Math.floor(ms / 1000));
  return `0:${s < 10 ? '0' : ''}${s}`;
}
