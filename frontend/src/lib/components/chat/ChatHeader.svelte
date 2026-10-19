<script lang="ts">
  import { presence } from '$lib/stores/presence';
  import { storyFeed } from '$lib/stores/stories';
  import { storyViewer } from '$lib/stores/ui';
  import type { User } from '$lib/types';
  import Avatar from '../ui/Avatar.svelte';
  import Icon from '../ui/Icon.svelte';

  let { peer }: { peer: User } = $props();

  const online = $derived($presence[peer.id] ?? peer.online);
  const storyGroup = $derived($storyFeed.others.find((g) => g.user.id === peer.id));
  const unseen = $derived(storyGroup?.stories.some((s) => !s.seen) ?? false);
</script>

<header class="chat-header">
  <a class="icon-btn back-btn" href="/" aria-label="Back to chats"><Icon name="back" /></a>
  {#if storyGroup}
    <button
      type="button"
      class="peer-story-btn"
      aria-label="View {peer.username}’s story"
      onclick={() => storyViewer.set({ queue: [peer.id] })}
    >
      <span class="peer-ring" class:ring-seen={!unseen}
        ><Avatar name={peer.username} size={40} /></span
      >
    </button>
  {:else}
    <Avatar name={peer.username} size={40} />
  {/if}
  <div class="chat-peer-meta">
    <h2 class="chat-peer-name">{peer.username}</h2>
    <p class="chat-peer-status" class:is-online={online}>
      <span class="status-dot" aria-hidden="true"></span>{online ? 'Online' : 'Offline'}
    </p>
  </div>
</header>

<style>
  .back-btn {
    display: none;
  }
  @media (max-width: 640px) {
    .back-btn {
      display: inline-grid;
    }
  }
</style>
