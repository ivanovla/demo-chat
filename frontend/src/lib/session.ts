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
import { clearDrafts } from './stores/drafts';
import { invalidateThreads, loadThread, receiveIncoming, resetThreads } from './stores/messages';
import { presence, setPresence } from './stores/presence';
import { loadStories, resetStories } from './stores/stories';
import { recorderOpen, sidebarTab, storyViewer } from './stores/ui';
import { resetUsers } from './stores/users';

export function startRealtime() {
  const { token } = get(auth);
  if (!token) return;
  const socket = openSocket(token);
  let loadedWithoutSocket = false;
  let connectedBefore = false;

  socket.on('connect', () => {
    markConnected();
    if (connectedBefore) {
      const active = get(activeConversationId);
      invalidateThreads(active);
      if (active) void loadThread(active, true);
    }
    connectedBefore = true;
    void loadConversations().catch(() => undefined);
    void loadStories();
  });
  socket.on('disconnect', () => markReconnecting());
  socket.on('connect_error', (err) => {
    if (err.message === 'Unauthorized') return logout();
    markReconnecting();
    if (loadedWithoutSocket) return;
    loadedWithoutSocket = true;
    void loadConversations().catch(() => undefined);
    void loadStories();
  });
  socket.on('message:new', ({ message, conversation }) => {
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
  });
  socket.on('presence', ({ userId, online }) => setPresence(userId, online));
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
  clearDrafts();
  recorderOpen.set(false);
  storyViewer.set(null);
  sidebarTab.set('chats');
  void goto('/login');
}

setUnauthorizedHandler(logout);
