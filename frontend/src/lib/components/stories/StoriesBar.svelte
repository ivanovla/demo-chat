<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { storyFeed } from '$lib/stores/stories';
  import { recorderOpen, storyViewer } from '$lib/stores/ui';
  import Icon from '../ui/Icon.svelte';
  import StoryAvatar from './StoryAvatar.svelte';

  const me = $derived($auth.user);
  const hasUnseen = (stories: { seen: boolean }[]) => stories.some((s) => !s.seen);

  function openMine() {
    if ($storyFeed.mine && me) storyViewer.set({ queue: [me.id] });
    else recorderOpen.set(true);
  }

  function openUser(userId: string) {
    const queue = $storyFeed.others.map((g) => g.user.id);
    storyViewer.set({ queue: queue.slice(queue.indexOf(userId)) });
  }
</script>

<section class="stories" aria-label="Stories">
  <div class="stories-scroll">
    <div class="story-item">
      <StoryAvatar
        username={me?.username ?? ''}
        caption="Your story"
        ring={$storyFeed.mine ? 'seen' : 'none'}
        label={$storyFeed.mine ? 'View your story' : 'Add to your story'}
        onclick={openMine}
      />
      <button
        type="button"
        class="story-add"
        aria-label="Add to your story"
        onclick={() => recorderOpen.set(true)}
      >
        <Icon name="plus" size="xs" />
      </button>
    </div>

    {#if $storyFeed.status === 'loading' || $storyFeed.status === 'idle'}
      {#each [1, 2, 3, 4] as k (k)}
        <div class="story-sk" aria-hidden="true">
          <span class="skeleton sk-circle-64"></span><span class="skeleton sk-line w-48px"></span>
        </div>
      {/each}
    {:else}
      {#each $storyFeed.others as group (group.user.id)}
        <StoryAvatar
          username={group.user.username}
          ring={hasUnseen(group.stories) ? 'unseen' : 'seen'}
          label="View {group.user.username}’s story{hasUnseen(group.stories) ? ' (new)' : ''}"
          onclick={() => openUser(group.user.id)}
        />
      {:else}
        <p class="stories-empty">No stories in the last 24 hours. Be the first.</p>
      {/each}
    {/if}
  </div>
</section>
