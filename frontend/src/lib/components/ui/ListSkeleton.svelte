<script lang="ts">
  let { variant = 'conversations' }: { variant?: 'conversations' | 'people' } = $props();

  const widths = [
    ['w-45', 'w-80'],
    ['w-35', 'w-65'],
    ['w-50', 'w-75'],
    ['w-30', 'w-60'],
    ['w-40', 'w-85'],
    ['w-35', 'w-55'],
  ];
</script>

<div class="sk-list" aria-hidden="true">
  {#each widths as [a, b], i (i)}
    <div class="sk-row">
      {#if variant === 'people'}
        <span class="skeleton sk-circle-40"></span>
        <span class="sk-lines"
          ><span class="skeleton sk-line {a}"></span><span class="skeleton sk-line w-20"
          ></span></span
        >
        <span class="skeleton sk-pill"></span>
      {:else}
        <span class="skeleton sk-circle-48"></span>
        <span class="sk-lines"
          ><span class="skeleton sk-line {a}"></span><span class="skeleton sk-line {b}"
          ></span></span
        >
      {/if}
    </div>
  {/each}
</div>
