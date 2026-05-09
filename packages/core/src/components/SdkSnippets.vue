<template>
  <div v-if="snippets.length > 0" class="vod-snippets">
    <div class="vod-snippets__bar">
      <div class="vod-snippets__tabs" role="tablist" :aria-label="ariaLabel">
        <button
          v-for="s in snippets"
          :key="s.language"
          type="button"
          role="tab"
          class="vod-snippets__tab"
          :class="{ 'vod-snippets__tab--active': s.language === active }"
          :aria-selected="s.language === active"
          :aria-controls="`vod-snippet-${uid}-${s.language}`"
          @click="active = s.language"
        >
          {{ s.label }}
        </button>
      </div>
      <button
        type="button"
        class="vod-snippets__copy"
        :aria-label="copyAriaLabel"
        :disabled="!activeSnippet"
        @click="copy"
      >
        {{ copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy' }}
      </button>
    </div>
    <pre
      v-for="s in snippets"
      v-show="s.language === active"
      :key="s.language"
      :id="`vod-snippet-${uid}-${s.language}`"
      class="vod-snippets__code"
      role="tabpanel"
      tabindex="0"
      :aria-label="`${s.label} code sample`"
    ><code v-html="renderTokens(s.tokens)" /></pre>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Snippet, SnippetLanguage, SnippetToken } from 'vue-api-playground'
import { escapeHtml } from '../highlight/escape'

interface Props {
  snippets: Snippet[]
  /** Aria label for the tab list. Defaults to "SDK snippets". */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'SDK snippets',
})

const active = ref<SnippetLanguage>(props.snippets[0]?.language ?? 'curl')
const uid = Math.random().toString(36).slice(2, 8)
const activeSnippet = computed(() => props.snippets.find((s) => s.language === active.value))

function renderTokens(tokens: SnippetToken[]): string {
  return tokens
    .map((t) => {
      const safe = escapeHtml(t.text)
      return t.type === 'text' ? safe : `<span class="vod-syntax-${t.type}">${safe}</span>`
    })
    .join('')
}

type CopyState = 'idle' | 'copied' | 'error'
const copyState = ref<CopyState>('idle')
const copyAriaLabel = computed(() => {
  const label = activeSnippet.value?.label ?? 'snippet'
  if (copyState.value === 'copied') return `${label} copied to clipboard`
  if (copyState.value === 'error') return `Failed to copy ${label}`
  return `Copy ${label} to clipboard`
})
let resetTimer: ReturnType<typeof setTimeout> | null = null

async function copy() {
  const snippet = activeSnippet.value
  if (!snippet) return
  const text = snippet.code
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.top = '-1000px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    } else {
      throw new Error('Clipboard unavailable')
    }
    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  } finally {
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      copyState.value = 'idle'
    }, 1500)
  }
}
</script>
