<script lang="ts">
  import { presence } from '$lib/stores/presence';
  import type { User } from '$lib/types';
  import Avatar from '../ui/Avatar.svelte';

  let { user, busy, onmessage }: { user: User; busy: boolean; onmessage: () => void } = $props();

  const online = $derived($presence[user.id] ?? user.online);
</script>

<li class="user-item">
  <Avatar name={user.username} size={40} {online} presenceSize="sm" />
  <span class="user-meta">
    <span class="user-name">{user.username}</span>
    <span class="user-status" class:is-online={online}>{online ? 'Online' : 'Offline'}</span>
  </span>
  <button
    type="button"
    class="btn btn-soft btn-sm"
    onclick={onmessage}
    disabled={busy}
    aria-label="Message {user.username}"
  >
    {#if busy}<span class="spinner spinner-sm" aria-hidden="true"></span>{/if}Message
  </button>
</li>
