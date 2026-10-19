import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '../types';
import { buildRows } from './messages';

const at = (d: number, h: number, m: number) => new Date(2026, 9, d, h, m).toISOString();
const msg = (id: string, senderId: string, createdAt: string): ChatMessage => ({
  id,
  conversationId: 'c',
  senderId,
  text: id,
  createdAt,
  status: 'sent',
});

describe('buildRows', () => {
  const now = new Date(2026, 9, 19, 12, 0).getTime();

  it('inserts day separators and groups consecutive messages', () => {
    const rows = buildRows(
      [
        msg('a1', 'them', at(18, 10, 0)),
        msg('a2', 'them', at(18, 10, 2)),
        msg('a3', 'them', at(18, 10, 3)),
        msg('b1', 'me', at(18, 10, 4)),
        msg('a4', 'them', at(19, 9, 0)),
        msg('a5', 'them', at(19, 9, 30)),
      ],
      'me',
      now,
    );

    expect(
      rows.map((r) => (r.type === 'day' ? `day:${r.label}` : `${r.message.id}:${r.group}`)),
    ).toEqual([
      'day:Yesterday',
      'a1:first',
      'a2:mid',
      'a3:last',
      'b1:single',
      'day:Today',
      'a4:single',
      'a5:single',
    ]);
    expect(rows.filter((r) => r.type === 'msg' && r.mine).map((r) => r.key)).toEqual(['b1']);
  });

  it('returns nothing for an empty list', () => {
    expect(buildRows([], 'me', now)).toEqual([]);
  });
});
