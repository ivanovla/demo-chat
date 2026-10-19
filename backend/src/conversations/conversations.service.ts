import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isDuplicateKeyError } from '../common/errors';
import { MessageDocument } from '../messages/message.schema';
import { UserDocument } from '../users/user.schema';
import { UsersService } from '../users/users.service';
import { ConversationDto } from './conversation.dto';
import { Conversation, ConversationDocument } from './conversation.schema';

@Injectable()
export class ConversationsService implements OnModuleInit {
  constructor(
    @InjectModel(Conversation.name) private readonly conversations: Model<Conversation>,
    private readonly users: UsersService,
  ) {}

  async onModuleInit() {
    await this.conversations.init();
  }

  async findOrCreate(meId: string, peerId: string): Promise<ConversationDto> {
    if (meId === peerId) throw new BadRequestException('You can’t start a chat with yourself');
    const peer = await this.users.findById(peerId);
    if (!peer) throw new NotFoundException('User not found');

    const participants = [meId, peerId].sort();
    const key = participants.join('_');
    const upsert = () =>
      this.conversations
        .findOneAndUpdate(
          { key },
          {
            $setOnInsert: {
              key,
              participants: participants.map((id) => new Types.ObjectId(id)),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { upsert: true, new: true, timestamps: false },
        )
        .exec();

    let conv: ConversationDocument;
    try {
      conv = await upsert();
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
      conv = await upsert();
    }
    return this.toDto(conv, meId, peer);
  }

  async listFor(meId: string): Promise<ConversationDto[]> {
    const list = await this.conversations
      .find({ participants: new Types.ObjectId(meId) })
      .sort({ updatedAt: -1 })
      .exec();
    const peers = await this.users.findByIds(list.map((c) => this.peerId(c, meId)));
    const byId = new Map(peers.map((p) => [p.id as string, p]));
    return list
      .filter((c) => byId.has(this.peerId(c, meId)))
      .map((c) => this.toDto(c, meId, byId.get(this.peerId(c, meId))!));
  }

  async getForParticipant(conversationId: string, meId: string): Promise<ConversationDocument> {
    const conv = Types.ObjectId.isValid(conversationId)
      ? await this.conversations.findById(conversationId).exec()
      : null;
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.some((p) => p.equals(meId))) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }
    return conv;
  }

  async applyMessage(
    conv: ConversationDocument,
    message: MessageDocument,
    countUnread = true,
  ): Promise<ConversationDocument> {
    const recipientId = this.peerId(conv, message.senderId.toString());
    await this.conversations
      .updateOne(
        { _id: conv._id, $or: [{ lastMessage: null }, { 'lastMessage.id': { $lt: message._id } }] },
        {
          $set: {
            lastMessage: {
              id: message._id,
              senderId: message.senderId,
              text: message.text,
              createdAt: message.createdAt,
            },
          },
        },
      )
      .exec();
    const updated = await this.conversations
      .findByIdAndUpdate(conv._id, countUnread ? { $inc: { [`unread.${recipientId}`]: 1 } } : {}, {
        new: true,
        timestamps: false,
      })
      .exec();
    return updated!;
  }

  async markRead(conversationId: string, meId: string): Promise<void> {
    await this.getForParticipant(conversationId, meId);
    await this.conversations
      .updateOne(
        { _id: conversationId },
        { $set: { [`unread.${meId}`]: 0 } },
        { timestamps: false },
      )
      .exec();
  }

  async projections(conv: ConversationDocument): Promise<Map<string, ConversationDto>> {
    const users = await this.users.findByIds(conv.participants);
    const byId = new Map(users.map((u) => [u.id as string, u]));
    const result = new Map<string, ConversationDto>();
    for (const p of conv.participants) {
      const meId = p.toString();
      const peer = byId.get(this.peerId(conv, meId));
      if (peer) result.set(meId, this.toDto(conv, meId, peer));
    }
    return result;
  }

  peerId(conv: ConversationDocument, meId: string): string {
    const peer = conv.participants.find((p) => !p.equals(meId)) ?? conv.participants[0];
    return peer.toString();
  }

  private toDto(conv: ConversationDocument, meId: string, peer: UserDocument): ConversationDto {
    const last = conv.lastMessage;
    return {
      id: conv.id,
      peer: this.users.toDto(peer),
      lastMessage: last
        ? {
            id: last.id.toString(),
            conversationId: conv.id,
            senderId: last.senderId.toString(),
            text: last.text,
            createdAt: last.createdAt.toISOString(),
          }
        : null,
      unreadCount: conv.unread?.get(meId) ?? 0,
      updatedAt: conv.updatedAt.toISOString(),
    };
  }
}
