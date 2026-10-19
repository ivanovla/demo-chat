<script lang="ts">
  const bubbles = [
    'theirs w-40',
    'theirs w-25',
    'mine w-45',
    'theirs w-55',
    'mine w-30',
    'mine w-50',
    'theirs w-35',
  ];
</script>

<div class="sk-messages" aria-hidden="true">
  {#each bubbles as cls, i (i)}<span class="skeleton sk-bubble {cls}"></span>{/each}
</div>
