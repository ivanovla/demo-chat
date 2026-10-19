import { IsMongoId } from 'class-validator';
import { MessageDto } from '../messages/message.dto';
import { UserDto } from '../users/user.dto';

export interface ConversationDto {
  id: string;
  peer: UserDto;
  lastMessage: MessageDto | null;
  unreadCount: number;
  updatedAt: string;
}

export class CreateConversationBody {
  @IsMongoId({ message: 'Invalid user id' })
  userId: string;
}

export class ConversationRef {
  @IsMongoId({ message: 'Invalid conversation id' })
  conversationId: string;
}
