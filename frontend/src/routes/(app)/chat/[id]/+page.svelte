<script lang="ts">
  import { page } from '$app/state';
  import Composer from '$lib/components/chat/Composer.svelte';
  import ChatHeader from '$lib/components/chat/ChatHeader.svelte';
  import MessageList from '$lib/components/chat/MessageList.svelte';
  import MessageSkeleton from '$lib/components/chat/MessageSkeleton.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { auth } from '$lib/stores/auth';
  import {
    activeConversationId,
    conversations,
    markConversationRead,
  } from '$lib/stores/conversations';
  import { emptyThread, loadThread, sendMessage, threads } from '$lib/stores/messages';

  const id = $derived(page.params.id ?? '');
  const conversation = $derived($conversations.items.find((c) => c.id === id));
  const thread = $derived($threads[id] ?? emptyThread());
  const meId = $derived($auth.user?.id ?? '');

  $effect(() => {
    activeConversationId.set(id);
    void loadThread(id);
    return () => activeConversationId.set(null);
  });

  $effect(() => {
    if (conversation && conversation.unreadCount > 0 && document.hasFocus())
      markConversationRead(id);
  });
</script>

<svelte:window onfocus={() => markConversationRead(id)} />

<svelte:head
  ><title>{conversation ? `${conversation.peer.username} · ` : ''}Demo Chat App</title></svelte:head
>

{#if conversation}
  <ChatHeader peer={conversation.peer} />
  {#key id}
    <MessageList conversationId={id} {thread} {meId} peer={conversation.peer} />
    <Composer
      conversationId={id}
      peerName={conversation.peer.username}
      onsend={(text) => sendMessage(id, meId, text)}
    />
  {/key}
{:else if $conversations.status === 'ready'}
  <EmptyState
    icon="chat"
    title="Conversation not found"
    text="It may have been removed or you don’t have access."
  >
    <a class="btn btn-soft" href="/">Back to chats</a>
  </EmptyState>
{:else if $conversations.status === 'error'}
  <EmptyState
    icon="alert"
    error
    title="Couldn’t load this chat"
    text="Check your connection and try again."
  />
{:else}
  <div class="messages"><div class="messages-inner"><MessageSkeleton /></div></div>
{/if}
