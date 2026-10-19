import { describe, expect, it } from 'vitest';
import type { Message } from '../types';
import {
  ackMessage,
  addPending,
  emptyThread,
  failMessage,
  mergeLatest,
  prependOlder,
  receiveMessage,
} from './messages';

const server = (id: string, clientId?: string, text = 'hi'): Message => ({
  id,
  conversationId: 'c1',
  senderId: 'me',
  text,
  clientId,
  createdAt: new Date(2026, 0, 1).toISOString(),
});

describe('message thread reducers', () => {
  it('adds a pending message and replaces it on ack', () => {
    let t = addPending(emptyThread(), {
      clientId: 'tmp-1',
      conversationId: 'c1',
      senderId: 'me',
      text: 'hi',
    });
    expect(t.items).toHaveLength(1);
    expect(t.items[0]).toMatchObject({ id: 'tmp-1', status: 'pending' });

    t = ackMessage(t, 'tmp-1', server('m1', 'tmp-1'));
    expect(t.items).toEqual([{ ...server('m1', 'tmp-1'), status: 'sent' }]);
  });

  it('marks a pending message as failed', () => {
    let t = addPending(emptyThread(), {
      clientId: 'tmp-1',
      conversationId: 'c1',
      senderId: 'me',
      text: 'hi',
    });
    t = failMessage(t, 'tmp-1');
    expect(t.items[0].status).toBe('failed');
  });

  it('dedups echoes of own messages by clientId and by id', () => {
    let t = addPending(emptyThread(), {
      clientId: 'tmp-1',
      conversationId: 'c1',
      senderId: 'me',
      text: 'hi',
    });
    t = receiveMessage(t, server('m1', 'tmp-1'));
    expect(t.items).toHaveLength(1);
    expect(t.items[0]).toMatchObject({ id: 'm1', status: 'sent' });

    t = ackMessage(t, 'tmp-1', server('m1', 'tmp-1'));
    t = receiveMessage(t, server('m1', 'tmp-1'));
    expect(t.items).toHaveLength(1);
  });

  it('appends incoming messages from others', () => {
    const t = receiveMessage(emptyThread(), { ...server('m2'), senderId: 'peer' });
    expect(t.items.map((m) => m.id)).toEqual(['m2']);
  });

  it('prepends older pages without duplicates', () => {
    let t = receiveMessage(emptyThread(), server('m3'));
    t = prependOlder(t, [server('m1'), server('m2'), server('m3')], false);
    expect(t.items.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
    expect(t.hasMore).toBe(false);
  });
});

describe('mergeLatest', () => {
  const at = (min: number) => new Date(2026, 0, 1, 12, min).toISOString();
  const srv = (id: string, min: number, clientId?: string): Message => ({
    id,
    conversationId: 'c1',
    senderId: 'me',
    text: id,
    clientId,
    createdAt: at(min),
  });

  it('prefers the server copy of a local failed message', () => {
    let t = addPending(emptyThread(), {
      clientId: 'tmp-1',
      conversationId: 'c1',
      senderId: 'me',
      text: 'hi',
    });
    t = failMessage(t, 'tmp-1');
    t = mergeLatest(t, [srv('m1', 1), srv('m2', 2, 'tmp-1')], false);
    expect(t.items.map((m) => [m.id, m.status])).toEqual([
      ['m1', 'sent'],
      ['m2', 'sent'],
    ]);
  });

  it('keeps live messages that arrived after the snapshot and unsent local ones', () => {
    let t = receiveMessage(emptyThread(), srv('m3', 3));
    t = addPending(t, { clientId: 'tmp-9', conversationId: 'c1', senderId: 'me', text: 'later' });
    t = mergeLatest(t, [srv('m1', 1), srv('m2', 2)], false);
    expect(t.items.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'tmp-9']);
  });

  it('keeps older pages that were already loaded', () => {
    let t = receiveMessage(emptyThread(), srv('m1', 1));
    t = { ...t, hasMore: true };
    t = mergeLatest(t, [srv('m2', 2), srv('m3', 3)], true);
    expect(t.items.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
    expect(t.hasMore).toBe(true);
  });
});
