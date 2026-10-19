<script lang="ts">
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { activeConversationId } from '$lib/stores/conversations';
  import { sidebarTab } from '$lib/stores/ui';

  $effect(() => {
    activeConversationId.set(null);
  });
</script>

<svelte:head><title>Demo Chat App</title></svelte:head>

<EmptyState large title="Select a chat or find someone in People">
  <button type="button" class="btn btn-soft" onclick={() => sidebarTab.set('people')}
    >Find people</button
  >
</EmptyState>
