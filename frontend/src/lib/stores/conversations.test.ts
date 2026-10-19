import { describe, expect, it } from 'vitest';
import type { Conversation } from '../types';
import { mergeSnapshot, setUnread, upsertConversation } from './conversations';

const conv = (id: string, updatedAt: string, unreadCount = 0): Conversation => ({
  id,
  peer: { id: `u-${id}`, username: id, online: false },
  lastMessage: null,
  unreadCount,
  updatedAt,
});

describe('conversation list reducers', () => {
  it('inserts and keeps the list sorted by latest activity', () => {
    let list = [conv('a', '2026-01-02T00:00:00Z'), conv('b', '2026-01-01T00:00:00Z')];
    list = upsertConversation(list, conv('c', '2026-01-03T00:00:00Z'));
    expect(list.map((c) => c.id)).toEqual(['c', 'a', 'b']);

    list = upsertConversation(list, conv('b', '2026-01-04T00:00:00Z', 2));
    expect(list.map((c) => c.id)).toEqual(['b', 'c', 'a']);
    expect(list[0].unreadCount).toBe(2);
  });

  it('updates the unread counter', () => {
    const list = setUnread([conv('a', '2026-01-01T00:00:00Z', 3)], 'a', 0);
    expect(list[0].unreadCount).toBe(0);
  });
});

describe('mergeSnapshot', () => {
  it('keeps conversations updated locally while the snapshot was in flight', () => {
    const local = [conv('a', '2026-01-05T00:00:00Z', 1), conv('n', '2026-01-06T00:00:00Z', 1)];
    const snapshot = [conv('a', '2026-01-04T00:00:00Z', 0), conv('b', '2026-01-01T00:00:00Z')];
    const merged = mergeSnapshot(local, snapshot, new Set(['a', 'n']));
    expect(merged.map((c) => [c.id, c.unreadCount])).toEqual([
      ['n', 1],
      ['a', 1],
      ['b', 0],
    ]);
  });

  it('takes the snapshot for conversations not touched locally', () => {
    const local = [conv('a', '2026-01-05T00:00:00Z', 4)];
    const snapshot = [conv('a', '2026-01-05T00:00:00Z', 0)];
    expect(mergeSnapshot(local, snapshot, new Set())[0].unreadCount).toBe(0);
  });
});
