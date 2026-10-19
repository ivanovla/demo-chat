import { writable } from 'svelte/store';
import { authApi, ApiError, setToken } from '../api';
import type { AuthResponse, User } from '../types';

const STORAGE_KEY = 'chat.token';

export interface AuthState {
  user: User | null;
  token: string | null;
  ready: boolean;
}

export const auth = writable<AuthState>({ user: null, token: null, ready: false });

function persist(token: string | null) {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

function readToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function startSession({ accessToken, user }: AuthResponse) {
  setToken(accessToken);
  persist(accessToken);
  auth.set({ user, token: accessToken, ready: true });
}

export async function initAuth() {
  const token = readToken();
  if (!token) {
    auth.set({ user: null, token: null, ready: true });
    return;
  }
  setToken(token);
  try {
    const user = await authApi.me();
    auth.set({ user, token, ready: true });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) clearAuth();
    else auth.set({ user: null, token: null, ready: true });
  }
}

export async function login(email: string, password: string) {
  startSession(await authApi.login({ email, password }));
}

export async function register(email: string, username: string, password: string) {
  startSession(await authApi.register({ email, username, password }));
}

export function clearAuth() {
  setToken(null);
  persist(null);
  auth.set({ user: null, token: null, ready: true });
}
