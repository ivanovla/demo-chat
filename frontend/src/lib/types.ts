export interface User {
  id: string;
  username: string;
  online: boolean;
  email?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  clientId?: string;
  createdAt: string;
}

export type MessageStatus = 'sent' | 'pending' | 'failed';

export interface ChatMessage extends Message {
  status: MessageStatus;
}

export interface Conversation {
  id: string;
  peer: User;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Story {
  id: string;
  userId: string;
  url: string;
  mimeType: string;
  durationMs: number;
  createdAt: string;
  expiresAt: string;
  seen: boolean;
}

export interface StoryGroup {
  user: User;
  stories: Story[];
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
