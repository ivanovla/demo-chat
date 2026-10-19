import { derived, get, writable } from 'svelte/store';
import { conversationsApi } from '../api';
import { getSocket } from '../socket';
import type { Conversation, LoadStatus, Message } from '../types';
import { trackUsers } from './presence';

export interface ConversationsState {
  items: Conversation[];
  status: LoadStatus;
}

export const conversations = writable<ConversationsState>({ items: [], status: 'idle' });
export const activeConversationId = writable<string | null>(null);

export const unreadTotal = derived(conversations, ($c) =>
  $c.items.reduce((sum, c) => sum + c.unreadCount, 0),
);

export function upsertConversation(list: Conversation[], conv: Conversation): Conversation[] {
  return [...list.filter((c) => c.id !== conv.id), conv].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function setUnread(list: Conversation[], id: string, unreadCount: number): Conversation[] {
  return list.map((c) => (c.id === id ? { ...c, unreadCount } : c));
}

export async function loadConversations() {
  conversations.update((s) => ({ ...s, status: s.items.length ? s.status : 'loading' }));
  try {
    const items = await conversationsApi.list();
    trackUsers(items.map((c) => c.peer));
    conversations.set({ items, status: 'ready' });
  } catch (err) {
    conversations.update((s) => ({ ...s, status: s.items.length ? s.status : 'error' }));
    throw err;
  }
}

export async function openConversationWith(userId: string): Promise<Conversation> {
  const existing = get(conversations).items.find((c) => c.peer.id === userId);
  if (existing) return existing;
  const conv = await conversationsApi.open(userId);
  storeConversation(conv);
  return conv;
}

export function storeConversation(conv: Conversation) {
  trackUsers([conv.peer]);
  conversations.update((s) => ({ ...s, items: upsertConversation(s.items, conv) }));
}

export function applyOwnMessage(message: Message) {
  conversations.update((s) => {
    const conv = s.items.find((c) => c.id === message.conversationId);
    if (!conv) return s;
    const updated = { ...conv, lastMessage: message, updatedAt: message.createdAt };
    return { ...s, items: upsertConversation(s.items, updated) };
  });
}

export function markConversationRead(id: string) {
  const conv = get(conversations).items.find((c) => c.id === id);
  if (!conv || conv.unreadCount === 0) return;
  conversations.update((s) => ({ ...s, items: setUnread(s.items, id, 0) }));
  const socket = getSocket();
  if (socket?.connected) socket.emit('conversation:read', { conversationId: id });
  else void conversationsApi.read(id).catch(() => undefined);
}

export function resetConversations() {
  conversations.set({ items: [], status: 'idle' });
  activeConversationId.set(null);
}
