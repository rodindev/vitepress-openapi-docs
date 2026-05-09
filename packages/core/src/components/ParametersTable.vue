<template>
  <div class="vod-endpoint__params">
    <div class="vod-endpoint__params-scroll">
      <table class="vod-endpoint__params-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th class="vod-endpoint__params-desc-col">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in visibleParams" :key="`${p.in}:${p.name}`">
            <td>
              <code>{{ p.name }}</code>
              <span v-if="p.required" class="vod-chip vod-chip--danger">required</span>
            </td>
            <td class="vod-endpoint__param-type">
              <span class="vod-endpoint__param-in">{{ p.in }}</span>
              <template v-if="p.typeLabel"> · {{ p.typeLabel }}</template>
            </td>
            <td v-if="p.description" class="vod-endpoint__params-desc-col">
              {{ p.description }}
            </td>
            <td v-else class="vod-endpoint__params-desc-col" />
          </tr>
        </tbody>
      </table>
    </div>
    <button
      v-if="hiddenCount > 0"
      class="vod-endpoint__params-toggle"
      :data-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show fewer' : `Show all ${params.length} parameters` }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ParsedParameter } from '../parser/types'

interface Props {
  params: ParsedParameter[]
  visibleLimit: number
}

const props = defineProps<Props>()
const expanded = ref(false)

const visibleParams = computed(() => {
  if (props.params.length <= props.visibleLimit || expanded.value) return props.params
  return props.params.slice(0, props.visibleLimit)
})

const hiddenCount = computed(() => {
  const total = props.params.length
  return total > props.visibleLimit ? total - props.visibleLimit : 0
})
</script>
