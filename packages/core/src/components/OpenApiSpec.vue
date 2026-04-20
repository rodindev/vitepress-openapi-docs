<template>
  <div v-if="!spec" class="vod-spec vod-spec--missing" role="alert">
    <p>
      <strong>Unknown spec:</strong> <code>{{ name }}</code> is not registered.
    </p>
  </div>
  <div v-else class="vod-spec">
    <header v-if="showHeader" class="vod-spec__header">
      <h2 class="vod-spec__title">
        {{ spec.title }} <small class="vod-spec__version">v{{ spec.version }}</small>
      </h2>
      <div
        v-if="spec.descriptionHtml"
        class="vod-spec__description vp-doc"
        v-html="spec.descriptionHtml"
      />
    </header>
    <section v-for="group in groups" :key="group.tag" class="vod-spec__group" :data-tag="group.tag">
      <h3 v-if="group.tag" class="vod-spec__group-title">{{ group.tag }}</h3>
      <OpenApiEndpoint
        v-for="op in group.operations"
        :key="op.id"
        :id="`${spec.name}.${op.id}`"
        :operation="op"
        :servers="spec.servers"
        :layout="layout"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSpecRegistry } from '../runtime/registry'
import OpenApiEndpoint from './OpenApiEndpoint.vue'
import type { ParsedOperation } from '../parser/types'

interface Props {
  /** Spec name from `OpenApiSpecConfig.name`. Single-spec sites can omit this. */
  name?: string
  /** Show the spec title and description block. Set to false when the page already provides its own heading. */
  showHeader?: boolean
  /** Card layout forwarded to every rendered endpoint. `columns` splits docs/code into a two-column grid; `stacked` keeps everything vertical. */
  layout?: 'columns' | 'stacked'
}

const props = withDefaults(defineProps<Props>(), {
  name: undefined,
  showHeader: true,
  layout: undefined,
})
const registry = useSpecRegistry()

const spec = computed(() => {
  if (props.name) return registry.specs[props.name]
  const all = Object.values(registry.specs)
  return all.length === 1 ? all[0] : undefined
})

const groups = computed<{ tag: string; operations: ParsedOperation[] }[]>(() => {
  if (!spec.value) return []
  const map = new Map<string, ParsedOperation[]>()
  for (const op of spec.value.operations) {
    const tag = op.tags[0] ?? ''
    const list = map.get(tag) ?? []
    list.push(op)
    map.set(tag, list)
  }
  return [...map.entries()].map(([tag, operations]) => ({ tag, operations }))
})

const name = computed(() => props.name ?? '(default)')
</script>
