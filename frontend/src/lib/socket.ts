import type { ClientToServerEvents, ServerToClientEvents } from '@chat/contracts';
import { io, type Socket } from 'socket.io-client';

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const READY_TIMEOUT_MS = 3000;

let socket: ChatSocket | null = null;
let ready: Promise<void> = Promise.resolve();
let release: () => void = () => undefined;

export const getSocket = () => socket;

export const socketReady = () => ready;

export function openSocket(token: string): ChatSocket {
  closeSocket();
  ready = new Promise((resolve) => {
    release = resolve;
    setTimeout(resolve, READY_TIMEOUT_MS);
  });
  socket = io({ auth: { token }, transports: ['websocket', 'polling'] }) as ChatSocket;
  socket.once('connect', release);
  socket.once('connect_error', release);
  return socket;
}

export function closeSocket() {
  release();
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}
