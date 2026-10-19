<script lang="ts">
  import Avatar from '../ui/Avatar.svelte';

  let {
    username,
    label,
    ring,
    caption = username,
    onclick,
  }: {
    username: string;
    label: string;
    ring: 'unseen' | 'seen' | 'none';
    caption?: string;
    onclick: () => void;
  } = $props();
</script>

<button type="button" class="story-btn" aria-label={label} {onclick}>
  <span class="story-ring" class:ring-seen={ring === 'seen'} class:ring-none={ring === 'none'}>
    <Avatar name={username} size={56} />
  </span>
  <span class="story-name" class:is-unseen={ring === 'unseen'}>{caption}</span>
</button>
