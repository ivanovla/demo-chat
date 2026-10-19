import { describe, expect, it } from 'vitest';
import type { Conversation } from '../types';
import { setUnread, upsertConversation } from './conversations';

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
