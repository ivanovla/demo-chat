import { io, type Socket } from 'socket.io-client';

const READY_TIMEOUT_MS = 3000;

let socket: Socket | null = null;
let ready: Promise<void> = Promise.resolve();
let release: () => void = () => undefined;

export const getSocket = () => socket;

export const socketReady = () => ready;

export function openSocket(token: string): Socket {
  closeSocket();
  ready = new Promise((resolve) => {
    release = resolve;
    setTimeout(resolve, READY_TIMEOUT_MS);
  });
  socket = io({ auth: { token }, transports: ['websocket', 'polling'] });
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
