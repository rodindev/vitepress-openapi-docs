<template>
  <div
    v-if="open"
    class="vod-jumper__backdrop"
    role="dialog"
    aria-modal="true"
    :aria-label="ariaLabel"
    @click.self="close"
    @keydown.down.prevent="move(1)"
    @keydown.up.prevent="move(-1)"
    @keydown.enter.prevent="choose(ranked[activeIndex]?.item)"
    @keydown.esc.prevent="close"
    @keydown.tab="trapFocus"
  >
    <div ref="panelRef" class="vod-jumper__panel">
      <input
        ref="inputRef"
        v-model="query"
        class="vod-jumper__input"
        type="search"
        :placeholder="placeholder"
        :aria-label="ariaLabel"
        autocomplete="off"
        spellcheck="false"
      />
      <ul
        v-if="ranked.length > 0"
        class="vod-jumper__results"
        role="listbox"
        :aria-label="`${ranked.length} matching results`"
        tabindex="0"
      >
        <li
          v-for="(result, i) in ranked"
          :key="`${result.item.specName}:${result.item.kind}:${result.item.id}`"
          role="option"
          :aria-selected="i === activeIndex"
          class="vod-jumper__result"
          :class="{ 'vod-jumper__result--active': i === activeIndex }"
          @mouseenter="activeIndex = i"
          @click="choose(result.item)"
        >
          <template v-if="result.item.kind === 'operation'">
            <span class="vod-jumper__method" :data-method="result.item.method">
              {{ result.item.method!.toUpperCase() }}
            </span>
            <span class="vod-jumper__summary">
              {{ result.item.summary || result.item.id }}
            </span>
            <code class="vod-jumper__path">{{ result.item.path }}</code>
            <span v-if="result.item.tag" class="vod-jumper__tag">{{ result.item.tag }}</span>
          </template>
          <template v-else>
            <span class="vod-jumper__method vod-jumper__method--schema">SCHEMA</span>
            <span class="vod-jumper__summary">{{ result.item.id }}</span>
            <code v-if="result.item.description" class="vod-jumper__path">{{
              result.item.description
            }}</code>
            <span class="vod-jumper__tag">{{ result.item.specName }}</span>
          </template>
        </li>
      </ul>
      <p v-else class="vod-jumper__empty" role="status">No operations or schemas match.</p>
      <footer class="vod-jumper__footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span><kbd>Enter</kbd> open</span>
        <span><kbd>Esc</kbd> close</span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter, withBase } from 'vitepress'
import { useSpecRegistry } from '../runtime/registry'
import { rankByFuzzy } from '../runtime/fuzzy'

interface Props {
  /** Public URL prefix per spec, used to build navigation hrefs. */
  prefixes?: Record<string, string>
  /** Override the input placeholder. */
  placeholder?: string
  /** Override the dialog aria-label. */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  prefixes: () => ({}),
  placeholder: 'Jump to an operation or schema…',
  ariaLabel: 'Jump to an operation or schema',
})

interface JumperEntry {
  kind: 'operation' | 'schema'
  id: string
  summary: string
  method?: string
  path?: string
  tag?: string
  description?: string
  specName: string
  href: string
}

const registry = useSpecRegistry()
const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
let triggerElement: HTMLElement | null = null

const allEntries = computed<JumperEntry[]>(() => {
  const entries: JumperEntry[] = []
  for (const spec of Object.values(registry.specs)) {
    const prefix = props.prefixes[spec.name] ?? `/api/${spec.name}`
    for (const op of spec.operations) {
      entries.push({
        kind: 'operation',
        id: op.id,
        summary: op.summary ?? '',
        method: op.method,
        path: op.path,
        tag: op.tags[0] ?? '',
        specName: spec.name,
        href: withBase(`${prefix}/${op.id}`),
      })
    }
    for (const schema of Object.values(spec.componentSchemas ?? {})) {
      entries.push({
        kind: 'schema',
        id: schema.name,
        summary: schema.description ?? '',
        description: schema.description ?? '',
        specName: spec.name,
        href: withBase(`/schemas/${spec.name}/${schema.name}`),
      })
    }
  }
  return entries
})

const ranked = computed(() =>
  rankByFuzzy(allEntries.value, query.value, (entry) => {
    const fields = [entry.id, entry.summary]
    if (entry.path) fields.push(entry.path)
    if (entry.tag) fields.push(entry.tag)
    if (entry.description) fields.push(entry.description)
    return fields
  }).slice(0, 30)
)

watch(query, () => {
  activeIndex.value = 0
})

watch(open, async (value) => {
  if (value) {
    if (typeof document !== 'undefined') {
      triggerElement = document.activeElement as HTMLElement | null
    }
    await nextTick()
    inputRef.value?.focus()
  } else {
    triggerElement?.focus()
    triggerElement = null
  }
})

function close() {
  open.value = false
  query.value = ''
}

function trapFocus(event: KeyboardEvent) {
  const panel = panelRef.value
  if (!panel) return
  const focusable = panel.querySelectorAll<HTMLElement>(
    'input, button, [tabindex]:not([tabindex="-1"]), a[href]'
  )
  if (focusable.length === 0) return
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function move(delta: number) {
  if (ranked.value.length === 0) return
  activeIndex.value = (activeIndex.value + delta + ranked.value.length) % ranked.value.length
}

const router = useRouter()

function choose(entry: JumperEntry | undefined) {
  if (!entry) return
  close()
  router.go(entry.href)
}

function handleGlobalKeydown(event: KeyboardEvent) {
  const modifier = event.metaKey || event.ctrlKey
  if (modifier && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    open.value = true
  }
}

onMounted(() => {
  // capture: true fires before VitePress's local search handler
  if (typeof window !== 'undefined')
    window.addEventListener('keydown', handleGlobalKeydown, { capture: true })
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined')
    window.removeEventListener('keydown', handleGlobalKeydown, { capture: true })
})

defineExpose({ open, close, query })
</script>
