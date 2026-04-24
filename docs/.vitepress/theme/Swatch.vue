<template>
  <span class="doc-swatch" :style="{ background: color }" :title="color" aria-hidden="true" />
</template>

<script setup lang="ts">
defineProps<{ color: string }>()
</script>

<style scoped>
.doc-swatch {
  display: inline-block;
  width: 0.9em;
  height: 0.9em;
  margin-right: 0.35em;
  vertical-align: -0.1em;
  border: 1px solid var(--vp-c-divider);
  border-radius: 3px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}
</style>
