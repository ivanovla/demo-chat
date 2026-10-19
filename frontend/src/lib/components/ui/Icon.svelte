<script lang="ts" module>
  const paths = {
    alert:
      '<circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v5.5"></path><path d="M12 16.5h.01"></path>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"></path><circle cx="12" cy="12" r="3"></circle>',
    eyeOff:
      '<path d="M3 3l18 18"></path><path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16.5 16.5 0 0 1-3.2 3.9M6.6 7.6C4 9.3 2.5 12 2.5 12S6 18 12 18a9.3 9.3 0 0 0 4.4-1.1"></path><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>',
    logout:
      '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path>',
    plus: '<path d="M12 5v14M5 12h14"></path>',
    chat: '<path d="M20 12a7.5 7.5 0 0 1-11 6.6L4 20l1.4-4.6A7.5 7.5 0 1 1 20 12z"></path>',
    search: '<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>',
    close: '<path d="M6 6l12 12M18 6L6 18"></path>',
    retry:
      '<path d="M20 11a8 8 0 0 0-14.7-3.5L4 9"></path><path d="M4 4v5h5"></path><path d="M4 13a8 8 0 0 0 14.7 3.5L20 15"></path><path d="M20 20v-5h-5"></path>',
    back: '<path d="M15 5l-7 7 7 7"></path>',
    forward: '<path d="M9 5l7 7-7 7"></path>',
    clock: '<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"></path>',
    send: '<path d="M12 19V5"></path><path d="M6 11l6-6 6 6"></path>',
    camera:
      '<rect x="3" y="6.5" width="12.5" height="11" rx="2.5"></rect><path d="M15.5 10.5l5-3v9l-5-3z"></path>',
    cameraOff:
      '<rect x="3" y="6.5" width="12.5" height="11" rx="2.5"></rect><path d="M15.5 10.5l5-3v9l-5-3z"></path><path d="M3 3l18 18"></path>',
    play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"></path>',
    pause: '<path d="M9 6v12M15 6v12"></path>',
  };

  export type IconName = keyof typeof paths;
</script>

<script lang="ts">
  let {
    name,
    size,
    label,
    class: className = '',
  }: { name: IconName; size?: 'xs' | 'sm' | 'lg'; label?: string; class?: string } = $props();
</script>

<svg
  class="icon {size ? `icon-${size}` : ''} {className}"
  viewBox="0 0 24 24"
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  {@html paths[name]}
</svg>
