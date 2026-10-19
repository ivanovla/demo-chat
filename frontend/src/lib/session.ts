import { goto } from '$app/navigation';
import { get } from 'svelte/store';
import { setUnauthorizedHandler } from './api';
import { closeSocket, openSocket } from './socket';
import { auth, clearAuth } from './stores/auth';
import { markConnected, markReconnecting, resetConnection } from './stores/connection';
import {
  activeConversationId,
  loadConversations,
  markConversationRead,
  resetConversations,
  storeConversation,
} from './stores/conversations';
import { loadThread, receiveIncoming, resetThreads } from './stores/messages';
import { presence, setPresence } from './stores/presence';
import { loadStories, resetStories } from './stores/stories';
import { resetUsers } from './stores/users';
import type { Conversation, Message } from './types';

export function startRealtime() {
  const { token } = get(auth);
  if (!token) return;
  const socket = openSocket(token);
  let connectedOnce = false;

  socket.on('connect', () => {
    markConnected();
    if (connectedOnce) {
      void loadConversations().catch(() => undefined);
      void loadStories();
      const active = get(activeConversationId);
      if (active) void loadThread(active, true);
    }
    connectedOnce = true;
  });
  socket.on('disconnect', () => markReconnecting());
  socket.on('connect_error', (err) => {
    if (err.message === 'Unauthorized') logout();
    else markReconnecting();
  });
  socket.on(
    'message:new',
    ({ message, conversation }: { message: Message; conversation: Conversation }) => {
      storeConversation(conversation);
      receiveIncoming(message);
      const me = get(auth).user?.id;
      if (
        message.senderId !== me &&
        get(activeConversationId) === conversation.id &&
        document.hasFocus()
      ) {
        markConversationRead(conversation.id);
      }
    },
  );
  socket.on('presence', ({ userId, online }: { userId: string; online: boolean }) =>
    setPresence(userId, online),
  );
  socket.on('story:new', () => void loadStories());
}

export function logout() {
  closeSocket();
  clearAuth();
  resetConnection();
  resetConversations();
  resetThreads();
  resetStories();
  resetUsers();
  presence.set({});
  void goto('/login');
}

setUnauthorizedHandler(logout);
