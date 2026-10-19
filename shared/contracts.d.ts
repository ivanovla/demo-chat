export interface UserDto {
  id: string;
  username: string;
  online: boolean;
  email?: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  clientId?: string;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  peer: UserDto;
  lastMessage: MessageDto | null;
  unreadCount: number;
  updatedAt: string;
}

export interface StoryDto {
  id: string;
  userId: string;
  url: string;
  mimeType: string;
  durationMs: number;
  createdAt: string;
  expiresAt: string;
  seen: boolean;
}

export interface StoryGroupDto {
  user: UserDto;
  stories: StoryDto[];
}

export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

export interface MessagePage {
  items: MessageDto[];
  hasMore: boolean;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  field?: 'email' | 'username';
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateConversationRequest {
  userId: string;
}

export interface SendMessageRequest {
  text: string;
  clientId?: string;
}

export interface SendMessagePayload extends SendMessageRequest {
  conversationId: string;
}

export interface ConversationRefPayload {
  conversationId: string;
}

export interface MessageNewEvent {
  message: MessageDto;
  conversation: ConversationDto;
}

export interface PresenceEvent {
  userId: string;
  online: boolean;
}

export interface StoryNewEvent {
  userId: string;
}

export type Ack<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

export interface ClientToServerEvents {
  'message:send': (
    payload: SendMessagePayload,
    ack: (res: Ack<{ message: MessageDto }>) => void,
  ) => void;
  'conversation:read': (payload: ConversationRefPayload, ack?: (res: Ack) => void) => void;
}

export interface ServerToClientEvents {
  'message:new': (event: MessageNewEvent) => void;
  presence: (event: PresenceEvent) => void;
  'story:new': (event: StoryNewEvent) => void;
}
