import type { ChatMessage } from '../types';
import { dayLabel } from './format';

export type Group = 'single' | 'first' | 'mid' | 'last';

export type Row =
  | { type: 'day'; key: string; label: string }
  | { type: 'msg'; key: string; message: ChatMessage; mine: boolean; group: Group };

const GROUP_GAP_MS = 5 * 60_000;

const dayKey = (iso: string) => new Date(iso).toDateString();

function joins(a: ChatMessage | undefined, b: ChatMessage | undefined): boolean {
  if (!a || !b || a.senderId !== b.senderId || dayKey(a.createdAt) !== dayKey(b.createdAt))
    return false;
  return (
    Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) <= GROUP_GAP_MS
  );
}

export function buildRows(messages: ChatMessage[], meId: string, now = Date.now()): Row[] {
  const rows: Row[] = [];
  messages.forEach((m, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    if (!prev || dayKey(prev.createdAt) !== dayKey(m.createdAt)) {
      rows.push({
        type: 'day',
        key: `day-${dayKey(m.createdAt)}`,
        label: dayLabel(m.createdAt, now),
      });
    }
    const withPrev = joins(prev, m);
    const withNext = joins(m, next);
    const group: Group = withPrev ? (withNext ? 'mid' : 'last') : withNext ? 'first' : 'single';
    rows.push({
      type: 'msg',
      key: m.clientId ?? m.id,
      message: m,
      mine: m.senderId === meId,
      group,
    });
  });
  return rows;
}
