<script lang="ts" module>
  const drafts = new Map<string, string>();
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import Icon from '../ui/Icon.svelte';

  const MAX = 4000;

  let {
    conversationId,
    peerName,
    onsend,
  }: { conversationId: string; peerName: string; onsend: (text: string) => void } = $props();

  let text = $state(untrack(() => drafts.get(conversationId)) ?? '');
  let input = $state<HTMLTextAreaElement>();

  const trimmed = $derived(text.trim());
  const tooLong = $derived(text.length > MAX);
  const disabled = $derived(!trimmed || tooLong);

  $effect(() => {
    drafts.set(conversationId, text);
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 132)}px`;
  });

  $effect(() => {
    input?.focus();
  });

  function submit(e?: Event) {
    e?.preventDefault();
    if (disabled) return;
    onsend(trimmed);
    text = '';
    input?.focus();
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) submit(e);
  }
</script>

<footer class="composer">
  <form class="composer-inner" onsubmit={submit}>
    <div class="composer-field">
      <label class="sr-only" for="composer-input">Message</label>
      <textarea
        id="composer-input"
        class="composer-input"
        rows="1"
        placeholder="Message @{peerName}"
        bind:value={text}
        bind:this={input}
        {onkeydown}></textarea>
    </div>
    <button type="submit" class="send-btn" aria-label="Send message" {disabled}
      ><Icon name="send" /></button
    >
  </form>
  {#if text.length > 3500}
    <p class="composer-counter" class:is-limit={tooLong} aria-live="polite">
      {text.length.toLocaleString('en-US')} / 4,000
    </p>
  {/if}
</footer>
