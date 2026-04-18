<template>
  <button type="button" class="vod-search-trigger" :aria-label="ariaLabel" @click="openJumper">
    <svg
      class="vod-search-trigger__icon"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
    <span class="vod-search-trigger__text">{{ text }}</span>
    <kbd class="vod-search-trigger__kbd">{{ shortcutLabel }}</kbd>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  text?: string
  ariaLabel?: string
}

withDefaults(defineProps<Props>(), {
  text: 'Search...',
  ariaLabel: 'Search operations and schemas',
})

const shortcutLabel = computed(() => {
  if (typeof navigator === 'undefined') return '⌘K'
  return navigator.platform?.includes('Mac') ? '⌘K' : 'Ctrl+K'
})

function openJumper() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })
  )
}
</script>
