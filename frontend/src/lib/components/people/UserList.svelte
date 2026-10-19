<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { errorText } from '$lib/api';
  import { openConversationWith } from '$lib/stores/conversations';
  import { toast } from '$lib/stores/toasts';
  import { sidebarTab } from '$lib/stores/ui';
  import { searchUsers, users } from '$lib/stores/users';
  import EmptyState from '../ui/EmptyState.svelte';
  import Icon from '../ui/Icon.svelte';
  import ListSkeleton from '../ui/ListSkeleton.svelte';
  import SearchInput from './SearchInput.svelte';
  import UserItem from './UserItem.svelte';

  let query = $state($users.query);
  let openingId = $state<string | null>(null);
  let first = true;

  $effect(() => {
    const q = query;
    if (first) {
      first = false;
      untrack(() => {
        if ($users.status === 'idle' || $users.status === 'error' || q !== $users.query)
          void searchUsers(q);
      });
      return;
    }
    const id = setTimeout(() => searchUsers(q), 250);
    return () => clearTimeout(id);
  });

  async function message(userId: string) {
    openingId = userId;
    try {
      const conv = await openConversationWith(userId);
      sidebarTab.set('chats');
      await goto(`/chat/${conv.id}`);
    } catch (err) {
      toast('error', errorText(err));
    } finally {
      openingId = null;
    }
  }
</script>

<SearchInput bind:value={query} />

{#if $users.status === 'loading' && $users.items.length === 0}
  <ListSkeleton variant="people" />
{:else if $users.status === 'error'}
  <EmptyState
    icon="alert"
    error
    title="Couldn’t load people"
    text="Check your connection and try again."
  >
    <button type="button" class="btn btn-secondary" onclick={() => searchUsers(query)}>
      <Icon name="retry" size="sm" />Retry
    </button>
  </EmptyState>
{:else if $users.items.length === 0 && $users.status === 'ready'}
  {#if $users.query.trim()}
    <EmptyState
      icon="search"
      title="No users match “{$users.query.trim()}”"
      text="Check the spelling or try another username."
    />
  {:else}
    <EmptyState
      icon="search"
      title="No one else is here yet"
      text="Invite a friend to create an account."
    />
  {/if}
{:else}
  <ul class="user-list">
    {#each $users.items as user (user.id)}
      <UserItem {user} busy={openingId === user.id} onmessage={() => message(user.id)} />
    {/each}
  </ul>
{/if}
