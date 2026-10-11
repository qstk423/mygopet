<script setup lang="ts">
defineProps<{ name: string }>()
const paths: Record<string, string> = {
  star: 'm12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4L12 17.6l-5.7 3 1.1-6.4L2.8 9.7l6.4-.9Z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  bag: 'M5 7h14l2 14H3L5 7Zm4 0V5a3 3 0 0 1 6 0v2',
  home: 'm3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7',
  close: 'm6 6 12 12M18 6 6 18',
  moon: 'M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z',
  walk: 'm9 8 3 2 4-1M12 10l-2 5-4 5M10 15l4 2 2 4M14 3h.01',
  hand: 'M8 12V6a1.5 1.5 0 0 1 3 0v6V4a1.5 1.5 0 0 1 3 0v8V6a1.5 1.5 0 0 1 3 0v7V9a1.5 1.5 0 0 1 3 0v7c0 4-3 6-6 6h-1c-3 0-5-2-6-4l-3-5a1.5 1.5 0 0 1 2-2l3 3',
  gift: 'M3 8h18v4H3V8Zm2 4v9h14v-9M12 8v13M12 8C3 8 5 1 9 3l3 5Zm0 0c9 0 7-7 3-5l-3 5Z',
  biscuit: 'M21 11a5 5 0 0 1-6-7A9 9 0 1 0 21 11ZM8 8h.01M7 14h.01M12 17h.01M12 11h.01M17 15h.01',
  matcha: 'm4 11 14-6 3 6H4Zm0 0v9h17v-9M4 15h17M14 5V3',
  rice: 'M10 4a2.3 2.3 0 0 1 4 0l7 13a2 2 0 0 1-2 3H5a2 2 0 0 1-2-3l7-13ZM9 20v-7h6v7',
  plus: 'M12 5v14M5 12h14',
  pause: 'M8 5v14M16 5v14',
  check: 'm5 12 4 4L19 6',
  sound: 'm11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14',
}
</script>
<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] ?? paths.star" /></svg></template>
