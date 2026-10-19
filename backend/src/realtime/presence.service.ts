import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  private readonly connections = new Map<string, number>();

  connect(userId: string): boolean {
    const count = (this.connections.get(userId) ?? 0) + 1;
    this.connections.set(userId, count);
    return count === 1;
  }

  disconnect(userId: string): boolean {
    const count = (this.connections.get(userId) ?? 0) - 1;
    if (count > 0) {
      this.connections.set(userId, count);
      return false;
    }
    this.connections.delete(userId);
    return true;
  }

  isOnline(userId: string): boolean {
    return this.connections.has(userId);
  }
}
