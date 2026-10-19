import { writable } from 'svelte/store';
import type { User } from '../types';

export const presence = writable<Record<string, boolean>>({});

export function trackUsers(users: User[]) {
  presence.update((map) => {
    const next = { ...map };
    for (const u of users) next[u.id] = u.online;
    return next;
  });
}

export function setPresence(userId: string, online: boolean) {
  presence.update((map) => ({ ...map, [userId]: online }));
}
