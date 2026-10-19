import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { isDuplicateKeyError } from '../common/errors';
import { ConversationsService } from '../conversations/conversations.service';
import { RealtimeService } from '../realtime/realtime.service';
import { MessageDto } from './message.dto';
import { Message, MessageDocument } from './message.schema';

@Injectable()
export class MessagesService implements OnModuleInit {
  constructor(
    @InjectModel(Message.name) private readonly messages: Model<Message>,
    private readonly conversations: ConversationsService,
    private readonly realtime: RealtimeService,
  ) {}

  async onModuleInit() {
    await this.messages.init();
  }

  async send(
    meId: string,
    conversationId: string,
    text: string,
    clientId?: string,
  ): Promise<MessageDto> {
    const body = text.trim();
    if (!body) throw new BadRequestException('Message cannot be empty');
    const conv = await this.conversations.getForParticipant(conversationId, meId);
    const senderId = new Types.ObjectId(meId);

    const existing = clientId ? await this.messages.findOne({ senderId, clientId }).exec() : null;
    if (existing) return this.toDto(existing);

    let message: MessageDocument;
    try {
      message = await this.messages.create({
        conversationId: conv._id,
        senderId,
        text: body,
        clientId,
      });
    } catch (err) {
      const duplicate =
        isDuplicateKeyError(err) && (await this.messages.findOne({ senderId, clientId }).exec());
      if (duplicate) return this.toDto(duplicate);
      throw err;
    }
    const updated = await this.conversations.applyMessage(conv, message);
    const dto = this.toDto(message);

    await Promise.all(
      updated.participants.map(async (participant) => {
        const userId = participant.toString();
        const conversation = await this.conversations.toDtoFor(updated, userId);
        this.realtime.toUser(userId, 'message:new', { message: dto, conversation });
      }),
    );
    return dto;
  }

  async list(meId: string, conversationId: string, before: string | undefined, limit: number) {
    const conv = await this.conversations.getForParticipant(conversationId, meId);
    const filter: FilterQuery<Message> = { conversationId: conv._id };
    if (before) filter._id = { $lt: new Types.ObjectId(before) };

    const docs = await this.messages
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();
    const hasMore = docs.length > limit;
    return {
      items: docs
        .slice(0, limit)
        .reverse()
        .map((m) => this.toDto(m)),
      hasMore,
    };
  }

  toDto(m: MessageDocument): MessageDto {
    const dto: MessageDto = {
      id: m.id,
      conversationId: m.conversationId.toString(),
      senderId: m.senderId.toString(),
      text: m.text,
      createdAt: m.createdAt.toISOString(),
    };
    if (m.clientId) dto.clientId = m.clientId;
    return dto;
  }
}
