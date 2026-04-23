<template>
  <section v-if="entries.length > 0" class="vod-responses">
    <h4 class="vod-responses__heading">Response examples</h4>
    <details
      v-for="entry in entries"
      :key="entry.key"
      class="vod-responses__item"
      :class="`vod-responses__item--${statusBucket(entry.status)}`"
    >
      <summary class="vod-responses__row">
        <span class="vod-responses__status">{{ entry.status }}</span>
        <span v-if="entry.description" class="vod-responses__desc">{{
          stripMarkdown(entry.description)
        }}</span>
      </summary>
      <div class="vod-responses__panel">
        <p class="vod-responses__meta">
          <code>{{ entry.contentType }}</code>
          <span v-if="entry.derived" class="vod-responses__derived" role="note">
            example derived from schema
          </span>
        </p>
        <pre class="vod-responses__code" tabindex="0"><code v-html="renderBody(entry)" /></pre>
      </div>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { generateJsonBody } from '../runtime/example'
import { escapeHtml } from '../highlight/escape'
import { highlightJson } from '../highlight/json'
import type { ParsedResponse } from '../parser/types'

interface Props {
  /** Operation responses, in spec order. */
  responses: ParsedResponse[]
}

const props = defineProps<Props>()

interface Entry {
  key: string
  status: string
  contentType: string
  body: string
  description?: string
  /** True when no spec example existed and we generated one from the schema. */
  derived: boolean
}

const entries = computed<Entry[]>(() => {
  const panels: Entry[] = []
  for (const response of props.responses) {
    if (!response.content) continue
    const contentTypes = Object.keys(response.content)
    if (contentTypes.length === 0) continue
    const contentType = contentTypes[0]!
    const media = response.content[contentType]!
    let body: string | undefined
    let derived = false
    if (media.example !== undefined) {
      body = stringify(media.example)
    } else if (Array.isArray((media as { examples?: unknown }).examples)) {
      const examples = (media as { examples?: unknown[] }).examples!
      if (examples.length > 0) body = stringify(examples[0])
    } else {
      body = generateJsonBody(media.schema)
      if (body !== undefined) derived = true
    }
    if (!body) continue
    panels.push({
      key: `${response.status}-${contentType}`,
      status: response.status,
      contentType,
      body,
      description: response.description,
      derived,
    })
  }
  return panels
})

function stringify(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

function isJsonContentType(ct: string): boolean {
  return ct === 'application/json' || ct === 'text/json' || ct.endsWith('+json')
}

function renderBody(entry: Entry): string {
  if (isJsonContentType(entry.contentType)) return highlightJson(entry.body)
  return escapeHtml(entry.body)
}

function statusBucket(
  status: string
): 'success' | 'redirect' | 'client-error' | 'server-error' | 'other' {
  const code = Number.parseInt(status, 10)
  if (Number.isNaN(code)) return 'other'
  if (code >= 200 && code < 300) return 'success'
  if (code >= 300 && code < 400) return 'redirect'
  if (code >= 400 && code < 500) return 'client-error'
  if (code >= 500 && code < 600) return 'server-error'
  return 'other'
}
</script>
