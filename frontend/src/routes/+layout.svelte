<script lang="ts">
  import '../styles/tokens.css';
  import '../styles/base.css';
  import '../styles/auth.css';
  import '../styles/sidebar.css';
  import '../styles/chat.css';
  import '../styles/stories.css';
  import { onMount } from 'svelte';
  import Toasts from '$lib/components/ui/Toasts.svelte';
  import { auth, initAuth } from '$lib/stores/auth';

  let { children } = $props();

  onMount(() => {
    void initAuth();
  });
</script>

<div class="app">
  {#if $auth.ready}
    {@render children()}
  {:else}
    <div class="boot" role="status">
      <span class="spinner spinner-lg" aria-hidden="true"></span><span class="sr-only">Loading</span
      >
    </div>
  {/if}
  <Toasts />
</div>

<style>
  .boot {
    height: 100%;
    display: grid;
    place-items: center;
    color: var(--color-accent);
  }
  .boot :global(.spinner-lg) {
    color: var(--color-accent);
  }
</style>
