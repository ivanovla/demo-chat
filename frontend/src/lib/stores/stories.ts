import { derived, get, writable } from 'svelte/store';
import { storiesApi } from '../api';
import type { LoadStatus, StoryGroup } from '../types';
import { auth } from './auth';
import { trackUsers } from './presence';

export interface StoriesState {
  groups: StoryGroup[];
  status: LoadStatus;
}

export const stories = writable<StoriesState>({ groups: [], status: 'idle' });

const hasUnseen = (g: StoryGroup) => g.stories.some((s) => !s.seen);

export const storyFeed = derived([stories, auth], ([$stories, $auth]) => {
  const meId = $auth.user?.id;
  const mine = $stories.groups.find((g) => g.user.id === meId) ?? null;
  const others = $stories.groups.filter((g) => g.user.id !== meId);
  return {
    mine,
    others: [...others.filter(hasUnseen), ...others.filter((g) => !hasUnseen(g))],
    status: $stories.status,
  };
});

export async function loadStories() {
  stories.update((s) => ({ ...s, status: s.groups.length ? s.status : 'loading' }));
  try {
    const groups = await storiesApi.list();
    trackUsers(groups.map((g) => g.user));
    stories.set({ groups, status: 'ready' });
  } catch {
    stories.update((s) => ({ ...s, status: s.groups.length ? 'ready' : 'error' }));
  }
}

export function markStorySeen(storyId: string) {
  const story = get(stories)
    .groups.flatMap((g) => g.stories)
    .find((s) => s.id === storyId);
  if (!story || story.seen) return;
  stories.update((s) => ({
    ...s,
    groups: s.groups.map((g) => ({
      ...g,
      stories: g.stories.map((st) => (st.id === storyId ? { ...st, seen: true } : st)),
    })),
  }));
  void storiesApi.view(storyId).catch(() => undefined);
}

export async function publishStory(
  video: Blob,
  durationMs: number,
  onProgress: (pct: number) => void,
) {
  await storiesApi.upload(video, durationMs, onProgress);
  await loadStories();
}

export function resetStories() {
  stories.set({ groups: [], status: 'idle' });
}
