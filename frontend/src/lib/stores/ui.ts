import { writable } from 'svelte/store';

export type SidebarTab = 'chats' | 'people';

export const sidebarTab = writable<SidebarTab>('chats');
export const recorderOpen = writable(false);
export const storyViewer = writable<{ queue: string[] } | null>(null);
