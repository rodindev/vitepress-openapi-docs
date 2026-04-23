<template>
  <div v-if="!schema" class="vod-schema vod-schema--missing" role="alert">
    <p>
      <strong>Unknown schema:</strong> <code>{{ name }}</code> is not registered
      <span v-if="specName">
        on spec <code>{{ specName }}</code></span
      >.
    </p>
  </div>

  <article v-else class="vod-schema">
    <header class="vod-schema__header">
      <h3 class="vod-schema__title">
        {{ schema.name }}
        <small v-if="schema.typeLabel" class="vod-schema__type">{{ schema.typeLabel }}</small>
      </h3>
      <p v-if="schema.description" class="vod-schema__description">{{ schema.description }}</p>
    </header>

    <table v-if="schema.properties.length > 0" class="vod-schema__table">
      <thead>
        <tr>
          <th scope="col">Field</th>
          <th scope="col">Type</th>
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="prop in schema.properties" :key="prop.name">
          <th scope="row" class="vod-schema__field">
            <code>{{ prop.name }}</code>
            <span v-if="prop.required" class="vod-chip vod-chip--danger">required</span>
          </th>
          <td class="vod-schema__cell-type">
            <component
              :is="prop.refTarget ? 'a' : 'span'"
              :href="prop.refTarget ? schemaLinkFor(prop.refTarget) : undefined"
              class="vod-schema__type-token"
            >
              {{ prop.typeLabel }}
            </component>
          </td>
          <td class="vod-schema__cell-description">{{ prop.description ?? '' }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else class="vod-schema__empty">No properties documented.</p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSpecRegistry } from '../runtime/registry'
import { useRoutes } from '../runtime/routes'
import type { ParsedSchema } from '../parser/types'

interface Props {
  /** Component-schema name. */
  name: string
  /** Spec name to resolve against. Required for multi-spec sites. */
  specName?: string
}

const props = defineProps<Props>()
const registry = useSpecRegistry()
const routes = useRoutes()

const spec = computed(() => {
  if (props.specName) return registry.specs[props.specName]
  const all = Object.values(registry.specs)
  return all.length === 1 ? all[0] : undefined
})

const schema = computed<ParsedSchema | undefined>(() => spec.value?.componentSchemas[props.name])

function schemaLinkFor(typeName: string): string {
  return routes.schemaUrl(spec.value?.name ?? '', typeName)
}
</script>
