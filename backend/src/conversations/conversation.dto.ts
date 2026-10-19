import type { ConversationRefPayload, CreateConversationRequest } from '@chat/contracts';
import { IsMongoId } from 'class-validator';

export type { ConversationDto } from '@chat/contracts';

export class CreateConversationBody implements CreateConversationRequest {
  @IsMongoId({ message: 'Invalid user id' })
  userId: string;
}

export class ConversationRef implements ConversationRefPayload {
  @IsMongoId({ message: 'Invalid conversation id' })
  conversationId: string;
}
