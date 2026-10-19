<script lang="ts">
  import { connectionBanner } from '$lib/stores/connection';
  import Icon from '../ui/Icon.svelte';
</script>

{#if $connectionBanner}
  <div class="conn-banner conn-banner-{$connectionBanner}" role="status">
    {#if $connectionBanner === 'reconnecting'}
      <span class="spinner spinner-sm" aria-hidden="true"></span><span>Reconnecting…</span>
    {:else}
      <Icon name="check" size="sm" /><span>Connected</span>
    {/if}
  </div>
{/if}
