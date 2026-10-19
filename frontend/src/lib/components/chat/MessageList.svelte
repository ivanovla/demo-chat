<script lang="ts">
  import { tick } from 'svelte';
  import { now } from '$lib/stores/clock';
  import { loadOlder, loadThread, retryMessage, type Thread } from '$lib/stores/messages';
  import type { User } from '$lib/types';
  import { buildRows } from '$lib/utils/messages';
  import Avatar from '../ui/Avatar.svelte';
  import EmptyState from '../ui/EmptyState.svelte';
  import Icon from '../ui/Icon.svelte';
  import MessageBubble from './MessageBubble.svelte';

  let {
    conversationId,
    thread,
    meId,
    peer,
  }: { conversationId: string; thread: Thread; meId: string; peer: User } = $props();

  const skeleton = [
    'theirs w-40',
    'theirs w-25',
    'mine w-45',
    'theirs w-55',
    'mine w-30',
    'mine w-50',
    'theirs w-35',
  ];

  let el = $state<HTMLDivElement>();
  const rows = $derived(buildRows(thread.items, meId, $now));

  let prev: { count: number; first?: string; last?: string } = { count: 0 };
  let prevHeight = 0;
  let prevTop = 0;
  let nearBottom = true;

  $effect.pre(() => {
    void thread.items;
    if (!el) return;
    prevHeight = el.scrollHeight;
    prevTop = el.scrollTop;
    nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  });

  $effect(() => {
    const items = thread.items;
    const first = items[0]?.id;
    const lastItem = items.at(-1);
    void tick().then(() => {
      if (!el) return;
      const prepended = prev.count > 0 && first !== prev.first && lastItem?.id === prev.last;
      const appended = lastItem?.id !== prev.last;
      if (prev.count === 0) el.scrollTop = el.scrollHeight;
      else if (prepended) el.scrollTop = el.scrollHeight - prevHeight + prevTop;
      else if (appended && (nearBottom || lastItem?.senderId === meId))
        el.scrollTop = el.scrollHeight;
      prev = { count: items.length, first, last: lastItem?.id };
    });
  });

  function onscroll() {
    if (el && el.scrollTop < 80 && thread.hasMore && !thread.loadingOlder)
      void loadOlder(conversationId);
  }
</script>

<div
  class="messages"
  bind:this={el}
  {onscroll}
  role="log"
  aria-live="polite"
  aria-label="Messages with {peer.username}"
>
  <div class="messages-inner">
    {#if (thread.status === 'loading' || thread.status === 'idle') && thread.items.length === 0}
      <div class="sk-messages" aria-hidden="true">
        {#each skeleton as cls, i (i)}<span class="skeleton sk-bubble {cls}"></span>{/each}
      </div>
    {:else if thread.status === 'error'}
      <EmptyState
        icon="alert"
        error
        title="Couldn’t load messages"
        text="Check your connection and try again."
      >
        <button
          type="button"
          class="btn btn-secondary"
          onclick={() => loadThread(conversationId, true)}
        >
          <Icon name="retry" size="sm" />Retry
        </button>
      </EmptyState>
    {:else}
      <div class="older">
        {#if thread.loadingOlder}
          <span class="spinner spinner-sm" aria-hidden="true"></span><span
            >Loading older messages…</span
          >
        {:else if thread.hasMore}
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            onclick={() => loadOlder(conversationId)}>Load older messages</button
          >
        {:else if thread.items.length}
          <span class="older-start">This is the beginning of your chat with @{peer.username}</span>
        {/if}
      </div>
      {#if thread.items.length === 0}
        <div class="empty chat-empty">
          <Avatar name={peer.username} size={80} />
          <h3 class="empty-title">Say hi to @{peer.username} 👋</h3>
          <p class="empty-text">Messages are delivered instantly while you’re both online.</p>
        </div>
      {/if}
      <div class="msg-stack">
        {#each rows as row (row.key)}
          {#if row.type === 'day'}
            <div class="day-sep"><span>{row.label}</span></div>
          {:else}
            <MessageBubble
              message={row.message}
              mine={row.mine}
              group={row.group}
              onretry={() => retryMessage(conversationId, row.message.clientId ?? row.message.id)}
            />
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</div>
