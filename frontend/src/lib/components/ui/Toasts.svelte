<script lang="ts">
  import { dismissToast, toasts } from '$lib/stores/toasts';
  import Icon from './Icon.svelte';

  const icons = { success: 'check', error: 'alert', info: 'chat' } as const;
</script>

<div class="toasts" aria-live="polite">
  {#each $toasts as t (t.id)}
    <div class="toast toast-{t.kind}" role="status">
      <span class="toast-icon" aria-hidden="true"><Icon name={icons[t.kind]} size="sm" /></span>
      <span class="toast-text">{t.text}</span>
      <button
        type="button"
        class="icon-btn icon-btn-sm"
        aria-label="Dismiss notification"
        onclick={() => dismissToast(t.id)}
      >
        <Icon name="close" size="sm" />
      </button>
    </div>
  {/each}
</div>
