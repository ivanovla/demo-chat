import { get, writable } from 'svelte/store';
import { ApiError, conversationsApi, errorText } from '../api';
import { getSocket } from '../socket';
import type { ChatMessage, LoadStatus, Message } from '../types';
import { applyOwnMessage } from './conversations';
import { toast } from './toasts';

export interface Thread {
  items: ChatMessage[];
  hasMore: boolean;
  status: LoadStatus;
  loadingOlder: boolean;
}

export const emptyThread = (): Thread => ({
  items: [],
  hasMore: false,
  status: 'idle',
  loadingOlder: false,
});

const sent = (m: Message): ChatMessage => ({ ...m, status: 'sent' });

export function addPending(
  t: Thread,
  p: { clientId: string; conversationId: string; senderId: string; text: string },
): Thread {
  const item: ChatMessage = {
    ...p,
    id: p.clientId,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  return { ...t, items: [...t.items, item] };
}

export function ackMessage(t: Thread, clientId: string, message: Message): Thread {
  return { ...t, items: t.items.map((m) => (m.clientId === clientId ? sent(message) : m)) };
}

export function setStatus(t: Thread, clientId: string, status: 'pending' | 'failed'): Thread {
  return {
    ...t,
    items: t.items.map((m) =>
      m.clientId === clientId && m.status !== 'sent' ? { ...m, status } : m,
    ),
  };
}

export const failMessage = (t: Thread, clientId: string) => setStatus(t, clientId, 'failed');

export function receiveMessage(t: Thread, message: Message): Thread {
  if (t.items.some((m) => m.id === message.id)) return t;
  if (message.clientId && t.items.some((m) => m.clientId === message.clientId)) {
    return ackMessage(t, message.clientId, message);
  }
  return { ...t, items: [...t.items, sent(message)] };
}

export function prependOlder(t: Thread, older: Message[], hasMore: boolean): Thread {
  const known = new Set(t.items.map((m) => m.id));
  return { ...t, items: [...older.filter((m) => !known.has(m.id)).map(sent), ...t.items], hasMore };
}

export function mergeLatest(t: Thread, page: Message[], hasMore: boolean): Thread {
  const ids = new Set(page.map((m) => m.id));
  const clientIds = new Set(page.map((m) => m.clientId).filter(Boolean));
  const first = page[0]?.createdAt;
  const last = page.at(-1)?.createdAt;
  const fresh = (m: ChatMessage) => !ids.has(m.id) && !(m.clientId && clientIds.has(m.clientId));
  const older = first
    ? t.items.filter((m) => m.status === 'sent' && fresh(m) && m.createdAt < first)
    : [];
  const newer = t.items.filter(
    (m) => fresh(m) && (m.status !== 'sent' || !last || m.createdAt > last),
  );
  return {
    ...t,
    items: [...older, ...page.map(sent), ...newer],
    hasMore: older.length ? t.hasMore : hasMore,
    status: 'ready',
  };
}

export const threads = writable<Record<string, Thread>>({});

function patch(convId: string, fn: (t: Thread) => Thread) {
  threads.update((all) => ({ ...all, [convId]: fn(all[convId] ?? emptyThread()) }));
}

const inflight = new Map<string, Promise<void>>();

export function loadThread(convId: string, force = false): Promise<void> {
  const running = inflight.get(convId);
  if (running && !force) return running;
  if (!force && get(threads)[convId]?.status === 'ready') return Promise.resolve();
  const request = fetchLatest(convId).finally(() => {
    if (inflight.get(convId) === request) inflight.delete(convId);
  });
  inflight.set(convId, request);
  return request;
}

async function fetchLatest(convId: string) {
  patch(convId, (t) => ({ ...t, status: t.items.length ? t.status : 'loading' }));
  try {
    const page = await conversationsApi.messages(convId);
    patch(convId, (t) => mergeLatest(t, page.items, page.hasMore));
  } catch (err) {
    patch(convId, (t) => ({ ...t, status: t.items.length ? 'ready' : 'error' }));
    toast('error', errorText(err));
  }
}

export async function loadOlder(convId: string) {
  const t = get(threads)[convId];
  const first = t?.items.find((m) => m.status === 'sent');
  if (!t || !t.hasMore || t.loadingOlder || !first) return;
  patch(convId, (x) => ({ ...x, loadingOlder: true }));
  try {
    const page = await conversationsApi.messages(convId, first.id);
    patch(convId, (x) => ({ ...prependOlder(x, page.items, page.hasMore), loadingOlder: false }));
  } catch (err) {
    patch(convId, (x) => ({ ...x, loadingOlder: false }));
    toast('error', errorText(err));
  }
}

const ACK_TIMEOUT_MS = 10_000;

class SendRejected extends Error {}

async function deliver(convId: string, clientId: string, text: string) {
  try {
    const socket = getSocket();
    let message: Message;
    if (socket?.connected) {
      const res = await socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck('message:send', { conversationId: convId, text, clientId });
      if (!res.ok) throw new SendRejected(res.error);
      message = res.message;
    } else {
      message = await conversationsApi.send(convId, text, clientId);
    }
    patch(convId, (t) => ackMessage(t, clientId, message));
    applyOwnMessage(message);
  } catch (err) {
    patch(convId, (t) => failMessage(t, clientId));
    const rejected =
      err instanceof SendRejected ||
      (err instanceof ApiError && err.status >= 400 && err.status < 500);
    if (rejected) toast('error', (err as Error).message);
  }
}

export function sendMessage(convId: string, senderId: string, text: string) {
  const clientId = crypto.randomUUID();
  patch(convId, (t) => addPending(t, { clientId, conversationId: convId, senderId, text }));
  void deliver(convId, clientId, text);
}

export function retryMessage(convId: string, clientId: string) {
  const msg = get(threads)[convId]?.items.find((m) => m.clientId === clientId);
  if (!msg) return;
  patch(convId, (t) => setStatus(t, clientId, 'pending'));
  void deliver(convId, clientId, msg.text);
}

export function receiveIncoming(message: Message) {
  if (!get(threads)[message.conversationId]) return;
  patch(message.conversationId, (t) => receiveMessage(t, message));
}

export function invalidateThreads(except: string | null) {
  threads.update((all) =>
    Object.fromEntries(
      Object.entries(all).map(([id, t]) => [
        id,
        id === except ? t : { ...t, status: 'idle' as const },
      ]),
    ),
  );
}

export function resetThreads() {
  inflight.clear();
  threads.set({});
}
