import { writable } from 'svelte/store';

export type ToastKind = 'success' | 'error' | 'info';
export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

export const toasts = writable<Toast[]>([]);

let seq = 0;

export function dismissToast(id: number) {
  toasts.update((list) => list.filter((t) => t.id !== id));
}

export function toast(kind: ToastKind, text: string, ttl = 4000) {
  const id = ++seq;
  toasts.update((list) => [...list, { id, kind, text }].slice(-3));
  if (ttl > 0) setTimeout(() => dismissToast(id), ttl);
  return id;
}
