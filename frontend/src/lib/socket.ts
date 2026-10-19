import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => socket;

export function openSocket(token: string): Socket {
  socket?.disconnect();
  socket = io({ auth: { token }, transports: ['websocket', 'polling'] });
  return socket;
}

export function closeSocket() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}
