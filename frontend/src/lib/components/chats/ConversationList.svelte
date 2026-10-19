<script lang="ts">
  import {
    activeConversationId,
    conversations,
    loadConversations,
  } from '$lib/stores/conversations';
  import { sidebarTab } from '$lib/stores/ui';
  import EmptyState from '../ui/EmptyState.svelte';
  import Icon from '../ui/Icon.svelte';
  import ListSkeleton from '../ui/ListSkeleton.svelte';
  import ConversationItem from './ConversationItem.svelte';
</script>

{#if $conversations.status === 'loading' || $conversations.status === 'idle'}
  <ListSkeleton />
{:else if $conversations.status === 'error'}
  <EmptyState
    icon="alert"
    error
    title="Couldn’t load your chats"
    text="Check your connection and try again."
  >
    <button
      type="button"
      class="btn btn-secondary"
      onclick={() => loadConversations().catch(() => undefined)}
    >
      <Icon name="retry" size="sm" />Retry
    </button>
  </EmptyState>
{:else if $conversations.items.length === 0}
  <EmptyState icon="chat" title="No conversations yet" text="Find someone in People and say hi.">
    <button type="button" class="btn btn-primary" onclick={() => sidebarTab.set('people')}
      >Find people</button
    >
  </EmptyState>
{:else}
  <ul class="conv-list">
    {#each $conversations.items as conversation (conversation.id)}
      <li>
        <ConversationItem {conversation} active={conversation.id === $activeConversationId} />
      </li>
    {/each}
  </ul>
{/if}
