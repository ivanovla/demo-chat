import type { AuthResponse, Conversation, Message, Story, StoryGroup, User } from '../types';
import { api, upload } from './client';

export { ApiError, errorText, setToken, setUnauthorizedHandler } from './client';

export const authApi = {
  register: (body: { email: string; username: string; password: string }) =>
    api<AuthResponse>('/auth/register', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    api<AuthResponse>('/auth/login', { method: 'POST', body }),
  me: () => api<User>('/auth/me'),
};

export const usersApi = {
  list: (search = '') =>
    api<User[]>(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
};

export const conversationsApi = {
  list: () => api<Conversation[]>('/conversations'),
  open: (userId: string) =>
    api<Conversation>('/conversations', { method: 'POST', body: { userId } }),
  read: (id: string) => api<void>(`/conversations/${id}/read`, { method: 'POST' }),
  messages: (id: string, before?: string, limit = 30) =>
    api<{ items: Message[]; hasMore: boolean }>(
      `/conversations/${id}/messages?limit=${limit}${before ? `&before=${before}` : ''}`,
    ),
  send: (id: string, text: string, clientId: string) =>
    api<Message>(`/conversations/${id}/messages`, { method: 'POST', body: { text, clientId } }),
};

export const storiesApi = {
  list: () => api<StoryGroup[]>('/stories'),
  view: (id: string) => api<void>(`/stories/${id}/view`, { method: 'POST' }),
  upload: (video: Blob, durationMs: number, onProgress?: (pct: number) => void) => {
    const type = video.type.split(';')[0] || 'video/webm';
    const form = new FormData();
    form.append('durationMs', String(Math.round(durationMs)));
    form.append(
      'video',
      new Blob([video], { type }),
      `story.${type.includes('mp4') ? 'mp4' : 'webm'}`,
    );
    return upload<Story>('/stories', form, onProgress);
  },
};
