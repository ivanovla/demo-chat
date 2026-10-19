import { writable } from 'svelte/store';
import { usersApi } from '../api';
import type { LoadStatus, User } from '../types';
import { trackUsers } from './presence';

export interface UsersState {
  items: User[];
  status: LoadStatus;
  query: string;
}

export const users = writable<UsersState>({ items: [], status: 'idle', query: '' });

let seq = 0;

export async function searchUsers(query: string) {
  const id = ++seq;
  users.update((s) => ({ ...s, query, status: 'loading' }));
  try {
    const items = await usersApi.list(query.trim());
    if (id !== seq) return;
    trackUsers(items);
    users.set({ items, status: 'ready', query });
  } catch {
    if (id === seq) users.update((s) => ({ ...s, status: 'error' }));
  }
}

export function resetUsers() {
  seq++;
  users.set({ items: [], status: 'idle', query: '' });
}
