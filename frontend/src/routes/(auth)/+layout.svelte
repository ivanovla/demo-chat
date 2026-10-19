<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';

  let { children } = $props();

  $effect(() => {
    if ($auth.user) void goto('/', { replaceState: true });
  });
</script>

{#if !$auth.user}
  {@render children()}
{/if}
