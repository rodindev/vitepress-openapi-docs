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
        <small v-if="schemaTypeLabel" class="vod-schema__type">{{ schemaTypeLabel }}</small>
      </h3>
      <p v-if="schema.description" class="vod-schema__description">{{ schema.description }}</p>
    </header>

    <table v-if="properties.length > 0" class="vod-schema__table">
      <thead>
        <tr>
          <th scope="col">Field</th>
          <th scope="col">Type</th>
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="prop in properties" :key="prop.name">
          <th scope="row" class="vod-schema__field">
            <code>{{ prop.name }}</code>
            <span v-if="prop.required" class="vod-schema__required">required</span>
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
import { withBase } from 'vitepress'
import { useSpecRegistry } from '../runtime/registry'
import type { ParsedSchema } from '../parser/types'

interface Props {
  /** Component-schema name. */
  name: string
  /** Spec name to resolve against. Required for multi-spec sites. */
  specName?: string
}

const props = defineProps<Props>()
const registry = useSpecRegistry()

const spec = computed(() => {
  if (props.specName) return registry.specs[props.specName]
  const all = Object.values(registry.specs)
  return all.length === 1 ? all[0] : undefined
})

const schema = computed<ParsedSchema | undefined>(() => spec.value?.componentSchemas[props.name])

interface Property {
  name: string
  required: boolean
  description?: string
  typeLabel: string
  /** When the property refs another component schema, its name. */
  refTarget?: string
}

const properties = computed<Property[]>(() => {
  const raw = (schema.value?.schema ?? {}) as Record<string, unknown>
  const requiredList = Array.isArray(raw.required)
    ? (raw.required as unknown[]).filter((r): r is string => typeof r === 'string')
    : []
  const propsRaw = (raw.properties ?? {}) as Record<string, Record<string, unknown>>
  const fields: Property[] = []
  for (const [name, value] of Object.entries(propsRaw)) {
    if (!value || typeof value !== 'object') continue
    const refTarget = detectRef(value)
    fields.push({
      name,
      required: requiredList.includes(name),
      description: typeof value.description === 'string' ? value.description : undefined,
      typeLabel: refTarget ? refTarget : describeType(value),
      refTarget,
    })
  }
  return fields
})

const schemaTypeLabel = computed<string | undefined>(() => {
  const raw = (schema.value?.schema ?? {}) as Record<string, unknown>
  if (typeof raw.type === 'string') return raw.type
  if (Array.isArray(raw.type)) return (raw.type as string[]).join(' | ')
  return undefined
})

function schemaLinkFor(typeName: string): string {
  return withBase(`/schemas/${spec.value?.name}/${typeName}`)
}

function describeType(value: Record<string, unknown>): string {
  const t = value.type
  if (typeof t === 'string') {
    if (t === 'array') {
      const items = value.items as Record<string, unknown> | undefined
      if (items) return `${describeType(items)}[]`
      return 'array'
    }
    if (t === 'object') return 'object'
    return value.format ? `${t} (${String(value.format)})` : t
  }
  if (Array.isArray(t)) return (t as string[]).join(' | ')
  if (Array.isArray(value.enum)) return 'enum'
  if ('oneOf' in value) return 'oneOf'
  if ('anyOf' in value) return 'anyOf'
  if ('allOf' in value) return 'allOf'
  return 'unknown'
}

function detectRef(value: Record<string, unknown>): string | undefined {
  const ref = value.$ref
  if (typeof ref === 'string' && ref.startsWith('#/components/schemas/')) {
    return ref.slice('#/components/schemas/'.length)
  }
  if (value.type === 'array' && value.items && typeof value.items === 'object') {
    return detectRef(value.items as Record<string, unknown>)
  }
  return undefined
}
</script>
