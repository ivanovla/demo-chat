import type { ClientToServerEvents, ServerToClientEvents } from '@chat/contracts';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

export type ChatServer = Server<ClientToServerEvents, ServerToClientEvents>;
type EventArgs<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>;

export const userRoom = (userId: string) => `user:${userId}`;

@Injectable()
export class RealtimeService {
  private server?: ChatServer;

  attach(server: ChatServer) {
    this.server = server;
  }

  toUser<E extends keyof ServerToClientEvents>(userId: string, event: E, ...args: EventArgs<E>) {
    this.server?.to(userRoom(userId)).emit(event, ...args);
  }

  broadcast<E extends keyof ServerToClientEvents>(event: E, ...args: EventArgs<E>) {
    this.server?.emit(event, ...args);
  }
}
