<script lang="ts">
  import { logout } from '$lib/session';
  import { auth } from '$lib/stores/auth';
  import { connection } from '$lib/stores/connection';
  import { unreadTotal } from '$lib/stores/conversations';
  import { sidebarTab } from '$lib/stores/ui';
  import ConversationList from '../chats/ConversationList.svelte';
  import UserList from '../people/UserList.svelte';
  import StoriesBar from '../stories/StoriesBar.svelte';
  import Avatar from '../ui/Avatar.svelte';
  import Icon from '../ui/Icon.svelte';
  import ConnectionBanner from './ConnectionBanner.svelte';

  const connLabel = $derived(
    $connection === 'connected'
      ? 'Connected'
      : $connection === 'reconnecting'
        ? 'Reconnecting…'
        : 'Connecting…',
  );
</script>

<aside class="sidebar" aria-label="Chats and people">
  <header class="sidebar-top">
    <div class="me">
      <Avatar name={$auth.user?.username ?? ''} size={36} />
      <div class="me-meta">
        <span class="me-name">{$auth.user?.username}</span>
        <span class="conn" class:conn-reconnecting={$connection !== 'connected'} role="status">
          <span class="conn-dot" aria-hidden="true"></span>{connLabel}
        </span>
      </div>
    </div>
    <button type="button" class="icon-btn" aria-label="Log out" onclick={logout}
      ><Icon name="logout" /></button
    >
  </header>

  <div class="sidebar-banner"><ConnectionBanner /></div>

  <StoriesBar />

  <div class="segmented" role="tablist" aria-label="Sidebar sections">
    <button
      type="button"
      role="tab"
      class="seg-btn"
      class:is-active={$sidebarTab === 'chats'}
      aria-selected={$sidebarTab === 'chats'}
      onclick={() => sidebarTab.set('chats')}
    >
      Chats
      {#if $unreadTotal > 0}
        <span class="seg-badge" aria-label="{$unreadTotal} unread"
          >{$unreadTotal > 99 ? '99+' : $unreadTotal}</span
        >
      {/if}
    </button>
    <button
      type="button"
      role="tab"
      class="seg-btn"
      class:is-active={$sidebarTab === 'people'}
      aria-selected={$sidebarTab === 'people'}
      onclick={() => sidebarTab.set('people')}
    >
      People
    </button>
  </div>

  <div class="panel" role="tabpanel" aria-label={$sidebarTab === 'chats' ? 'Chats' : 'People'}>
    {#if $sidebarTab === 'chats'}
      <ConversationList />
    {:else}
      <UserList />
    {/if}
  </div>
</aside>

<style>
  .sidebar-banner {
    display: none;
  }
  @media (max-width: 640px) {
    .sidebar-banner {
      display: block;
    }
  }
</style>
