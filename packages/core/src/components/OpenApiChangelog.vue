<template>
  <article v-if="!changelog" class="vod-changelog vod-changelog--missing" role="alert">
    <p>
      <strong>Unknown spec:</strong> <code>{{ name }}</code> is not registered.
    </p>
  </article>

  <article
    v-else-if="changelog.isEmpty || changelog.entries.length === 0"
    class="vod-changelog vod-changelog--empty"
  >
    <h3 class="vod-changelog__empty-title">No history yet</h3>
    <p class="vod-changelog__empty-body">
      The spec file has fewer than two commits touching it, so there's nothing to diff. Commit your
      next change and the changelog will appear here.
    </p>
    <p class="vod-changelog__empty-hint" role="note">
      <strong>Partial diff:</strong> added / removed operations, renames (same method + path), and
      spec-info fields are tracked. Nested schema changes are not yet.
    </p>
  </article>

  <article v-else class="vod-changelog">
    <p class="vod-changelog__hint" role="note">
      <strong>Partial diff:</strong> added / removed operations, renames, and spec-info fields.
      Nested schema changes are not tracked yet.
    </p>
    <section v-for="entry in changelog.entries" :key="entry.commit" class="vod-changelog__entry">
      <header class="vod-changelog__entry-header">
        <time class="vod-changelog__date" :datetime="entry.date">{{ formatDate(entry.date) }}</time>
        <code class="vod-changelog__commit">{{ entry.commit }}</code>
        <span class="vod-changelog__subject">{{ entry.subject }}</span>
      </header>

      <ul v-if="entry.info.length > 0" class="vod-changelog__list">
        <li v-for="(change, i) in entry.info" :key="`info-${i}`" class="vod-changelog__item">
          <strong class="vod-chip vod-chip--neutral">info.{{ change.kind }}</strong>
          <span v-if="change.before">
            <code>{{ change.before }}</code> →
          </span>
          <code v-if="change.after">{{ change.after }}</code>
          <em v-else>(cleared)</em>
        </li>
      </ul>

      <ul v-if="entry.operations.length > 0" class="vod-changelog__list">
        <li
          v-for="(change, i) in entry.operations"
          :key="`op-${i}`"
          class="vod-changelog__item"
          :data-kind="change.kind"
        >
          <strong class="vod-chip" :class="chipVariant(change.kind)">
            {{ kindLabel(change.kind) }}
          </strong>
          <template v-if="change.kind === 'renamed'">
            <code>{{ change.previousOperationId }}</code> →
            <code>{{ change.operationId }}</code>
          </template>
          <template v-else>
            <code>{{ change.operationId }}</code>
            <span v-if="change.before || change.after" class="vod-changelog__delta">
              <em v-if="change.before">“{{ change.before }}”</em>
              <em v-else>(none)</em>
              →
              <em v-if="change.after">“{{ change.after }}”</em>
              <em v-else>(cleared)</em>
            </span>
          </template>
        </li>
      </ul>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { CHANGELOG_REGISTRY_KEY } from '../runtime/registry'
import type { ChangeKind } from '../changelog/types'

interface Props {
  /** Spec name. Single-spec sites can omit this. */
  name?: string
}

const props = defineProps<Props>()
const changelogRegistry = inject(CHANGELOG_REGISTRY_KEY, null)
const changelog = computed(() => {
  if (!changelogRegistry) return undefined
  if (props.name) return changelogRegistry.changelogs[props.name]
  const all = Object.values(changelogRegistry.changelogs)
  return all.length === 1 ? all[0] : undefined
})

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.valueOf())) return iso
  return date.toISOString().slice(0, 10)
}

function kindLabel(kind: ChangeKind): string {
  if (kind === 'added') return 'Added'
  if (kind === 'removed') return 'Removed'
  if (kind === 'renamed') return 'Renamed'
  if (kind === 'summary') return 'Summary changed'
  if (kind === 'description') return 'Description changed'
  return kind
}

function chipVariant(kind: ChangeKind): string {
  if (kind === 'added') return 'vod-chip--success'
  if (kind === 'removed') return 'vod-chip--danger'
  if (kind === 'renamed') return 'vod-chip--warning'
  return 'vod-chip--neutral'
}
</script>
