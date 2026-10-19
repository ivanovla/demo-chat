<script lang="ts">
  import type { ChatMessage } from '$lib/types';
  import { fmtTime } from '$lib/utils/format';
  import type { Group } from '$lib/utils/messages';
  import Icon from '../ui/Icon.svelte';

  let {
    message,
    mine,
    group,
    onretry,
  }: { message: ChatMessage; mine: boolean; group: Group; onretry: () => void } = $props();
</script>

<div class="msg-row g-{group}" class:mine class:theirs={!mine}>
  <div
    class="bubble"
    class:is-pending={message.status === 'pending'}
    class:is-failed={message.status === 'failed'}
  >
    <span class="bubble-text">{message.text}</span>
    <span class="bubble-meta">
      <time datetime={message.createdAt}>{fmtTime(message.createdAt)}</time>
      {#if mine}
        {#if message.status === 'pending'}
          <Icon name="clock" size="xs" label="Sending" />
        {:else if message.status === 'failed'}
          <Icon name="alert" size="xs" label="Not sent" />
        {:else}
          <Icon name="check" size="xs" label="Sent" />
        {/if}
      {/if}
    </span>
  </div>
  {#if message.status === 'failed'}
    <p class="msg-failed">
      Not sent ·<button type="button" class="link-btn link-error" onclick={onretry}>Retry</button>
    </p>
  {/if}
</div>
