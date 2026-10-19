import { HttpException, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { AuthUser } from '../common/current-user.decorator';
import { errorMessage, validateDto } from '../common/validate';
import { ConversationRef } from '../conversations/conversation.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { SendMessagePayload } from '../messages/message.dto';
import { MessagesService } from '../messages/messages.service';
import { PresenceService } from '../realtime/presence.service';
import { RealtimeService, userRoom } from '../realtime/realtime.service';

type AuthedSocket = Socket & { data: { user: AuthUser; expiresAt?: number } };

const MAX_TIMER_MS = 2 ** 31 - 1;

@WebSocketGateway()
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly auth: AuthService,
    private readonly realtime: RealtimeService,
    private readonly presence: PresenceService,
    private readonly messages: MessagesService,
    private readonly conversations: ConversationsService,
  ) {}

  afterInit(server: Server) {
    this.realtime.attach(server);
    server.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string' || !token) return next(new Error('Unauthorized'));
      this.auth
        .verifyToken(token)
        .then((payload) => {
          socket.data.user = { id: payload.sub, username: payload.username };
          socket.data.expiresAt = payload.exp ? payload.exp * 1000 : undefined;
          next();
        })
        .catch(() => next(new Error('Unauthorized')));
    });
  }

  async handleConnection(socket: AuthedSocket) {
    const { id } = socket.data.user;
    const { expiresAt } = socket.data;
    if (expiresAt) {
      const timer = setTimeout(
        () => socket.disconnect(true),
        Math.min(Math.max(expiresAt - Date.now(), 0), MAX_TIMER_MS),
      );
      socket.once('disconnect', () => clearTimeout(timer));
    }
    await socket.join(userRoom(id));
    if (this.presence.connect(id))
      this.realtime.broadcast('presence', { userId: id, online: true });
  }

  handleDisconnect(socket: AuthedSocket) {
    const user = socket.data.user;
    if (user && this.presence.disconnect(user.id)) {
      this.realtime.broadcast('presence', { userId: user.id, online: false });
    }
  }

  @SubscribeMessage('message:send')
  async onSend(@ConnectedSocket() socket: AuthedSocket, @MessageBody() body: unknown) {
    try {
      const dto = await validateDto(SendMessagePayload, body);
      const message = await this.messages.send(
        socket.data.user.id,
        dto.conversationId,
        dto.text,
        dto.clientId,
      );
      return { ok: true, message };
    } catch (err) {
      return this.fail(err);
    }
  }

  @SubscribeMessage('conversation:read')
  async onRead(@ConnectedSocket() socket: AuthedSocket, @MessageBody() body: unknown) {
    try {
      const dto = await validateDto(ConversationRef, body);
      await this.conversations.markRead(dto.conversationId, socket.data.user.id);
      return { ok: true };
    } catch (err) {
      return this.fail(err);
    }
  }

  private fail(err: unknown) {
    if (!(err instanceof HttpException)) this.logger.error(err instanceof Error ? err.stack : err);
    return { ok: false, error: errorMessage(err) };
  }
}
