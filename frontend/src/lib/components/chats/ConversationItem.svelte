<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { now } from '$lib/stores/clock';
  import { presence } from '$lib/stores/presence';
  import type { Conversation } from '$lib/types';
  import { relShort } from '$lib/utils/format';
  import Avatar from '../ui/Avatar.svelte';

  let { conversation, active }: { conversation: Conversation; active: boolean } = $props();

  const last = $derived(conversation.lastMessage);
  const mine = $derived(last?.senderId === $auth.user?.id);
  const online = $derived($presence[conversation.peer.id] ?? conversation.peer.online);
  const unread = $derived(conversation.unreadCount);
</script>

<a
  href="/chat/{conversation.id}"
  class="conv-item"
  class:is-active={active}
  aria-current={active ? 'page' : undefined}
>
  <Avatar name={conversation.peer.username} size={48} {online} />
  <span class="conv-main">
    <span class="conv-row">
      <span class="conv-name">{conversation.peer.username}</span>
      <span class="conv-time" class:is-unread={unread > 0}>
        {relShort(last?.createdAt ?? conversation.updatedAt, $now)}
      </span>
    </span>
    <span class="conv-row">
      {#if last}
        <span class="conv-preview"
          >{#if mine}<span class="conv-you">{'You: '}</span>{/if}{last.text}</span
        >
      {:else}
        <span class="conv-preview is-empty">No messages yet</span>
      {/if}
      {#if unread > 0}
        <span class="badge" aria-label="{unread} unread messages"
          >{unread > 99 ? '99+' : unread}</span
        >
      {/if}
    </span>
  </span>
</a>

<style>
  a.conv-item {
    text-decoration: none;
  }
</style>
