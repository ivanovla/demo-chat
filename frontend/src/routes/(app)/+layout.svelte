<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import ConnectionBanner from '$lib/components/layout/ConnectionBanner.svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import StoryRecorder from '$lib/components/stories/StoryRecorder.svelte';
  import StoryViewer from '$lib/components/stories/StoryViewer.svelte';
  import { startRealtime } from '$lib/session';
  import { auth } from '$lib/stores/auth';
  import { loadConversations } from '$lib/stores/conversations';
  import { loadStories } from '$lib/stores/stories';
  import { recorderOpen, storyViewer } from '$lib/stores/ui';

  let { children } = $props();

  const signedIn = $derived(!!$auth.user);
  const inChat = $derived(!!page.params.id);

  $effect(() => {
    if (!signedIn) {
      void goto('/login', { replaceState: true });
      return;
    }
    startRealtime();
    void loadConversations().catch(() => undefined);
    void loadStories();
  });
</script>

{#if signedIn}
  <div class="shell {inChat ? 'view-chat' : 'view-list'}">
    <Sidebar />
    <main class="chat">
      <ConnectionBanner />
      {@render children()}
    </main>
  </div>

  {#if $recorderOpen}<StoryRecorder />{/if}
  {#if $storyViewer}
    {#key $storyViewer}<StoryViewer queue={$storyViewer.queue} />{/key}
  {/if}
{/if}
