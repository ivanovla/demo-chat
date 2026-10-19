import type { MessageDto } from '@chat/contracts';

export type {
  AuthResponse,
  ConversationDto as Conversation,
  MessageDto as Message,
  MessageNewEvent,
  MessagePage,
  PresenceEvent,
  StoryDto as Story,
  StoryGroupDto as StoryGroup,
  UserDto as User,
} from '@chat/contracts';

export type MessageStatus = 'sent' | 'pending' | 'failed';

export interface ChatMessage extends MessageDto {
  status: MessageStatus;
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
