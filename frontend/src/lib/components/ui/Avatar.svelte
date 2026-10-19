<script lang="ts">
  import { avClass, initials } from '$lib/utils/avatar';

  let {
    name,
    size = 40,
    online = false,
    presenceSize = 'md',
  }: {
    name: string;
    size?: 32 | 36 | 40 | 48 | 56 | 80;
    online?: boolean;
    presenceSize?: 'sm' | 'md';
  } = $props();
</script>

{#snippet face()}
  <span class="avatar avatar-{size} {avClass(name)}" aria-hidden="true">{initials(name)}</span>
{/snippet}

{#if online}
  <span class="avatar-wrap">
    {@render face()}
    <span class="presence {presenceSize === 'sm' ? 'presence-sm' : ''}" aria-label="Online"></span>
  </span>
{:else}
  {@render face()}
{/if}
