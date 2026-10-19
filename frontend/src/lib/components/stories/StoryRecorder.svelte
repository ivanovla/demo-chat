<script lang="ts">
  import { onDestroy } from 'svelte';
  import { errorText } from '$lib/api';
  import { publishStory } from '$lib/stores/stories';
  import { toast } from '$lib/stores/toasts';
  import { recorderOpen } from '$lib/stores/ui';
  import { fmtClock } from '$lib/utils/format';
  import { MAX_STORY_MS, pickRecorderMime } from '$lib/utils/media';
  import Icon from '../ui/Icon.svelte';

  type Step =
    | 'permission'
    | 'requesting'
    | 'denied'
    | 'live'
    | 'recording'
    | 'review'
    | 'uploading'
    | 'uploadError';

  const RING = 2 * Math.PI * 40;

  let step = $state<Step>('permission');
  let deniedReason = $state('Enable it in browser settings, then try again.');
  let elapsed = $state(0);
  let duration = $state(0);
  let progress = $state(0);
  let confirming = $state(false);
  let reviewUrl = $state<string | null>(null);

  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let blob: Blob | null = null;
  let chunks: Blob[] = [];
  let startedAt = 0;
  let ticker: ReturnType<typeof setInterval> | undefined;

  let closeBtn = $state<HTMLButtonElement>();
  let keepBtn = $state<HTMLButtonElement>();

  const hasClip = $derived(['recording', 'review', 'uploading', 'uploadError'].includes(step));

  function attachLive(el: HTMLVideoElement) {
    el.srcObject = stream;
    el.muted = true;
    void el.play().catch(() => undefined);
  }

  async function requestCamera() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      deniedReason =
        'Your browser can’t record video here. Use a recent browser over HTTPS or localhost.';
      step = 'denied';
      return;
    }
    step = 'requesting';
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      if (!$recorderOpen) return stopStream();
      step = 'live';
    } catch {
      deniedReason = 'Enable it in browser settings, then try again.';
      step = 'denied';
    }
  }

  function startRecording() {
    if (!stream) return;
    chunks = [];
    const mimeType = pickRecorderMime();
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      blob = new Blob(chunks, { type: recorder?.mimeType || mimeType || 'video/webm' });
      reviewUrl = URL.createObjectURL(blob);
      step = 'review';
    };
    recorder.start(250);
    startedAt = performance.now();
    elapsed = 0;
    step = 'recording';
    ticker = setInterval(() => {
      elapsed = Math.min(MAX_STORY_MS, performance.now() - startedAt);
      if (elapsed >= MAX_STORY_MS) stopRecording();
    }, 100);
  }

  function stopRecording() {
    clearInterval(ticker);
    duration = Math.max(500, Math.min(MAX_STORY_MS, performance.now() - startedAt));
    if (recorder?.state === 'recording') recorder.stop();
  }

  function discardClip() {
    if (reviewUrl) URL.revokeObjectURL(reviewUrl);
    reviewUrl = null;
    blob = null;
  }

  function retake() {
    discardClip();
    progress = 0;
    elapsed = 0;
    step = stream ? 'live' : 'permission';
  }

  async function share() {
    if (!blob) return;
    step = 'uploading';
    progress = 0;
    try {
      await publishStory(blob, duration, (pct) => (progress = pct));
      toast('success', 'Story published');
      closeNow();
    } catch (err) {
      step = 'uploadError';
      toast('error', errorText(err));
    }
  }

  function stopStream() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  function closeNow() {
    clearInterval(ticker);
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    stopStream();
    discardClip();
    recorderOpen.set(false);
  }

  function requestClose() {
    if (confirming) {
      confirming = false;
      return;
    }
    if (step === 'recording') stopRecording();
    if (hasClip && step !== 'uploading') confirming = true;
    else if (step !== 'uploading') closeNow();
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') requestClose();
  }

  $effect(() => {
    if (confirming) keepBtn?.focus();
    else closeBtn?.focus();
  });

  onDestroy(() => {
    clearInterval(ticker);
    stopStream();
    if (reviewUrl) URL.revokeObjectURL(reviewUrl);
  });
</script>

<svelte:window {onkeydown} />

<div class="overlay overlay-recorder" role="dialog" aria-modal="true" aria-label="Record a story">
  <button
    type="button"
    class="overlay-close"
    aria-label="Close recorder"
    onclick={requestClose}
    bind:this={closeBtn}
  >
    <Icon name="close" />
  </button>

  {#if step === 'permission'}
    <div class="rec-card">
      <div class="rec-card-icon"><Icon name="camera" size="lg" /></div>
      <h2>Allow camera and microphone access</h2>
      <p>
        Stories are short videos, up to 15 seconds. Nothing is recorded until you press the record
        button.
      </p>
      <div class="rec-card-actions">
        <button type="button" class="btn btn-primary btn-block btn-lg" onclick={requestCamera}
          >Allow access</button
        >
      </div>
    </div>
  {:else if step === 'requesting'}
    <div class="rec-card">
      <span class="spinner spinner-lg" aria-hidden="true"></span>
      <h2>Waiting for permission…</h2>
      <p>Respond to the browser prompt to continue.</p>
    </div>
  {:else if step === 'denied'}
    <div class="rec-card" role="alert">
      <div class="rec-card-icon is-error"><Icon name="cameraOff" size="lg" /></div>
      <h2>Camera access denied</h2>
      <p>{deniedReason}</p>
      <div class="rec-card-actions">
        <button type="button" class="btn btn-primary btn-block btn-lg" onclick={requestCamera}
          >Try again</button
        >
      </div>
    </div>
  {:else}
    <div class="rec-stage">
      <div class="story-frame rec-frame">
        {#if step === 'live' || step === 'recording'}
          <video class="frame-video is-mirrored" playsinline use:attachLive></video>
        {:else if reviewUrl}
          <video class="frame-video is-mirrored" src={reviewUrl} playsinline autoplay loop muted
          ></video>
        {/if}

        {#if step === 'recording'}
          <div class="rec-timer" role="timer">
            <span class="rec-dot" aria-hidden="true"></span>{fmtClock(elapsed)} / 0:15
          </div>
        {:else if step === 'review'}
          <div class="rec-timer rec-timer-neutral">{fmtClock(duration)} clip · looping</div>
          <span class="review-progress" aria-hidden="true">
            <span class="review-progress-fill" style="animation-duration: {duration / 1000}s"
            ></span>
          </span>
        {:else if step === 'uploading'}
          <div class="frame-state" role="status">
            <p class="frame-state-title">Uploading story…</p>
            <span class="progress" aria-hidden="true"
              ><span class="progress-fill" style="width: {progress}%"></span></span
            >
            <p class="frame-state-text">{progress}%</p>
          </div>
        {:else if step === 'uploadError'}
          <div class="frame-state" role="alert">
            <span class="frame-state-icon is-error"><Icon name="alert" size="lg" /></span>
            <p class="frame-state-title">Upload failed</p>
            <p class="frame-state-text">Check your connection and try again.</p>
          </div>
        {/if}
      </div>

      <div class="rec-controls">
        {#if step === 'live' || step === 'recording'}
          <button
            type="button"
            class="rec-btn"
            class:is-recording={step === 'recording'}
            aria-label={step === 'recording' ? 'Stop recording' : 'Start recording'}
            onclick={() => (step === 'recording' ? stopRecording() : startRecording())}
          >
            <svg class="rec-ring" viewBox="0 0 88 88" aria-hidden="true">
              <circle class="rec-ring-track" cx="44" cy="44" r="40"></circle>
              <circle
                class="rec-ring-progress"
                cx="44"
                cy="44"
                r="40"
                style="stroke-dashoffset: {RING *
                  (1 - (step === 'recording' ? elapsed / MAX_STORY_MS : 0))}"
              ></circle>
            </svg>
            <span class="rec-btn-core"></span>
          </button>
          <p class="rec-hint">
            {step === 'recording' ? 'Tap to stop' : 'Tap to record · up to 15 seconds'}
          </p>
        {:else if step === 'review'}
          <div class="rec-actions">
            <button type="button" class="btn btn-ghost-dark btn-lg" onclick={retake}
              ><Icon name="retry" size="sm" />Retake</button
            >
            <button type="button" class="btn btn-primary btn-lg" onclick={share}>Share story</button
            >
          </div>
        {:else if step === 'uploading'}
          <p class="rec-hint">Keep this window open until the upload finishes.</p>
        {:else if step === 'uploadError'}
          <div class="rec-actions">
            <button type="button" class="btn btn-ghost-dark btn-lg" onclick={retake}>Retake</button>
            <button type="button" class="btn btn-primary btn-lg" onclick={share}>Try again</button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if confirming}
    <div class="confirm-scrim">
      <div
        class="confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-text"
      >
        <h3 id="confirm-title">Discard this recording?</h3>
        <p id="confirm-text">
          Your clip hasn’t been shared yet. If you close now, it will be lost.
        </p>
        <div class="confirm-actions">
          <button
            type="button"
            class="btn btn-secondary"
            onclick={() => (confirming = false)}
            bind:this={keepBtn}>Keep editing</button
          >
          <button type="button" class="btn btn-danger" onclick={closeNow}>Discard</button>
        </div>
      </div>
    </div>
  {/if}
</div>
