import { writable } from 'svelte/store';

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting';

export const connection = writable<ConnectionState>('connecting');
export const connectionBanner = writable<'reconnecting' | 'connected' | null>(null);

let flashTimer: ReturnType<typeof setTimeout> | undefined;
let wasDown = false;

export function markConnected() {
  connection.set('connected');
  clearTimeout(flashTimer);
  if (!wasDown) return;
  wasDown = false;
  connectionBanner.set('connected');
  flashTimer = setTimeout(() => connectionBanner.set(null), 2000);
}

export function markReconnecting() {
  wasDown = true;
  clearTimeout(flashTimer);
  connection.set('reconnecting');
  connectionBanner.set('reconnecting');
}

export function resetConnection() {
  wasDown = false;
  clearTimeout(flashTimer);
  connection.set('connecting');
  connectionBanner.set(null);
}
