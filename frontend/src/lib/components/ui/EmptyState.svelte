<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon, { type IconName } from './Icon.svelte';

  let {
    icon,
    title,
    text,
    error = false,
    large = false,
    children,
  }: {
    icon?: IconName;
    title: string;
    text?: string;
    error?: boolean;
    large?: boolean;
    children?: Snippet;
  } = $props();
</script>

<div class="empty {large ? 'empty-lg' : ''}">
  {#if icon}
    <div class="empty-icon {error ? 'is-error' : ''}"><Icon name={icon} /></div>
  {:else if large}
    <div class="empty-art" aria-hidden="true">
      <span class="art-bubble art-a"></span><span class="art-bubble art-b"></span><span
        class="art-bubble art-c"
      ></span>
    </div>
  {/if}
  <h2 class="empty-title">{title}</h2>
  {#if text}<p class="empty-text">{text}</p>{/if}
  {@render children?.()}
</div>
