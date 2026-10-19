<script lang="ts">
  import Icon from '../ui/Icon.svelte';

  let { value = $bindable('') }: { value?: string } = $props();
</script>

<div class="search">
  <Icon name="search" size="sm" class="search-icon" />
  <label class="sr-only" for="people-search">Search by username</label>
  <input
    id="people-search"
    class="search-input"
    type="search"
    placeholder="Search by username"
    bind:value
    autocomplete="off"
  />
  {#if value}
    <button
      type="button"
      class="search-clear"
      aria-label="Clear search"
      onclick={() => (value = '')}
    >
      <Icon name="close" size="sm" />
    </button>
  {/if}
</div>
