<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { markStorySeen, stories } from '$lib/stores/stories';
  import { storyViewer } from '$lib/stores/ui';
  import { relAgo } from '$lib/utils/format';
  import Avatar from '../ui/Avatar.svelte';
  import Icon from '../ui/Icon.svelte';

  let { queue }: { queue: string[] } = $props();

  const groups = $derived(
    queue
      .map((id) => $stories.groups.find((g) => g.user.id === id))
      .filter((g) => g && g.stories.length),
  );

  let ui = $state(0);
  let si = $state(untrack(() => firstUnseen(0)));
  let progress = $state(0);
  let paused = $state(false);
  let loading = $state(true);
  let failed = $state(false);
  let video = $state<HTMLVideoElement>();
  let closeBtn = $state<HTMLButtonElement>();

  const group = $derived(groups[ui]);
  const story = $derived(group?.stories[si]);

  function firstUnseen(index: number) {
    const i = groups[index]?.stories.findIndex((s) => !s.seen) ?? -1;
    return i < 0 ? 0 : i;
  }

  const close = () => storyViewer.set(null);

  function go(nextUi: number, nextSi: number) {
    ui = nextUi;
    si = nextSi;
    progress = 0;
    failed = false;
    loading = true;
  }

  function next() {
    if (!group) return close();
    if (si < group.stories.length - 1) go(ui, si + 1);
    else if (ui < groups.length - 1) go(ui + 1, firstUnseen(ui + 1));
    else close();
  }

  function prev() {
    if (si > 0) go(ui, si - 1);
    else if (ui > 0) go(ui - 1, (groups[ui - 1]?.stories.length ?? 1) - 1);
    else restart();
  }

  function restart() {
    progress = 0;
    if (video) video.currentTime = 0;
  }

  function jumpUser(delta: number) {
    const target = ui + delta;
    if (target >= 0 && target < groups.length) go(target, 0);
  }

  $effect(() => {
    if (!story) {
      if (groups.length === 0) close();
      return;
    }
    markStorySeen(story.id);
  });

  $effect(() => {
    if (!video || !story) return;
    if (paused) video.pause();
    else if (!loading && !failed)
      video.play().catch(() => {
        if (video && !video.muted) {
          video.muted = true;
          void video.play().catch(() => undefined);
        }
      });
  });

  $effect(() => {
    if (!failed) return;
    const id = setTimeout(next, 2500);
    return () => clearTimeout(id);
  });

  function syncProgress() {
    if (!video || !story || loading) return;
    const total =
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : story.durationMs / 1000;
    if (total > 0) progress = Math.min(1, video.currentTime / total);
  }

  onMount(() => {
    closeBtn?.focus();
    let raf = 0;
    const loop = () => {
      syncProgress();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let held = false;

  function pressStart() {
    held = false;
    pressTimer = setTimeout(() => {
      held = true;
      paused = true;
    }, 250);
  }

  function pressEnd() {
    clearTimeout(pressTimer);
    if (held) paused = false;
  }

  function tap(action: () => void) {
    if (held) {
      held = false;
      return;
    }
    action();
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === ' ') {
      e.preventDefault();
      paused = !paused;
    }
  }
</script>

<svelte:window {onkeydown} />

{#if group && story}
  <div
    class="overlay overlay-viewer"
    role="dialog"
    aria-modal="true"
    aria-label="{group.user.username}’s stories"
  >
    <div class="viewer-wrap">
      <button
        type="button"
        class="viewer-nav"
        aria-label="Previous person’s stories"
        onclick={() => jumpUser(-1)}
        disabled={ui === 0}
      >
        <Icon name="back" />
      </button>

      <div class="story-frame viewer-frame">
        {#key story.id}
          <!-- svelte-ignore a11y_media_has_caption -->
          <video
            class="frame-video is-mirrored"
            src={story.url}
            playsinline
            autoplay
            bind:this={video}
            oncanplay={() => (loading = false)}
            onwaiting={() => (loading = true)}
            onplaying={() => (loading = false)}
            ontimeupdate={syncProgress}
            onended={next}
            onerror={() => {
              loading = false;
              failed = true;
            }}
          ></video>
        {/key}

        {#if loading && !failed}
          <div class="frame-state" role="status">
            <span class="spinner spinner-lg" aria-hidden="true"></span><span class="sr-only"
              >Loading story</span
            >
          </div>
        {/if}
        {#if failed}
          <div class="frame-state frame-state-solid" role="status">
            <span class="frame-state-icon"><Icon name="clock" size="lg" /></span>
            <p class="frame-state-title">Story unavailable</p>
            <p class="frame-state-text">This story has expired or can’t be played.</p>
          </div>
        {/if}

        <button
          type="button"
          class="viewer-tap viewer-tap-prev"
          aria-label="Previous story"
          onclick={() => tap(prev)}
          onpointerdown={pressStart}
          onpointerup={pressEnd}
          onpointerleave={pressEnd}
          onpointercancel={pressEnd}
        ></button>
        <button
          type="button"
          class="viewer-tap viewer-tap-next"
          aria-label="Next story"
          onclick={() => tap(next)}
          onpointerdown={pressStart}
          onpointerup={pressEnd}
          onpointerleave={pressEnd}
          onpointercancel={pressEnd}
        ></button>

        <div class="viewer-top">
          <div class="viewer-bars" aria-hidden="true">
            {#each group.stories as s, i (s.id)}
              <span class="viewer-bar">
                <span
                  class="viewer-bar-fill"
                  style="width: {i < si ? 100 : i === si ? progress * 100 : 0}%"
                ></span>
              </span>
            {/each}
          </div>
          <div class="viewer-meta">
            <Avatar name={group.user.username} size={32} />
            <span class="viewer-name">{group.user.username}</span>
            <span class="viewer-time">{relAgo(story.createdAt)}</span>
            <span class="viewer-spacer"></span>
            <button
              type="button"
              class="viewer-icon-btn"
              aria-label={paused ? 'Play' : 'Pause'}
              onclick={() => (paused = !paused)}
            >
              <Icon name={paused ? 'play' : 'pause'} />
            </button>
            <button
              type="button"
              class="viewer-icon-btn"
              aria-label="Close stories"
              onclick={close}
              bind:this={closeBtn}
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="viewer-nav"
        aria-label="Next person’s stories"
        onclick={() => jumpUser(1)}
        disabled={ui >= groups.length - 1}
      >
        <Icon name="forward" />
      </button>
    </div>
  </div>
{/if}
