<template>
  <section v-if="!resolved" class="vod-endpoint vod-endpoint--missing" role="alert">
    <p>
      <strong>Missing endpoint:</strong> <code>{{ id }}</code> is not defined in any registered
      OpenAPI spec.
    </p>
  </section>

  <div v-else class="vod-endpoint-layout" :class="{ 'vod-page-columns': useColumns }">
    <section class="vod-endpoint" :class="{ 'vod-endpoint--deprecated': op.deprecated }">
      <header v-if="showSection('summary')" class="vod-endpoint__header">
        <h3 class="vod-endpoint__title">
          <span
            class="vod-endpoint__method"
            :class="{ 'vod-endpoint__method--webhook': op.kind === 'webhook' }"
            :data-method="op.method"
          >
            {{ op.method.toUpperCase() }}
          </span>
          <code class="vod-endpoint__path">{{ op.path }}</code>
          <span v-if="op.deprecated" class="vod-chip vod-chip--warning">deprecated</span>
          <span v-if="op.kind === 'webhook'" class="vod-chip vod-chip--neutral">webhook</span>
        </h3>
        <p v-if="op.summary" class="vod-endpoint__summary">{{ op.summary }}</p>
      </header>

      <p v-if="showSection('description') && op.description" class="vod-endpoint__description">
        {{ op.description }}
      </p>

      <section
        v-if="showSection('params') && op.parameters.length > 0"
        class="vod-endpoint__section"
      >
        <details v-if="!useColumns" class="vod-endpoint__main-details">
          <summary class="vod-endpoint__section-title">
            Parameters
            <span class="vod-endpoint__section-count">{{ op.parameters.length }}</span>
          </summary>
          <ParametersTable :params="op.parameters" :visible-limit="Infinity" />
        </details>
        <template v-else>
          <h4 class="vod-endpoint__section-title">
            Parameters
            <span class="vod-endpoint__section-count">{{ op.parameters.length }}</span>
          </h4>
          <ParametersTable :params="op.parameters" :visible-limit="PARAMS_VISIBLE_LIMIT" />
        </template>
      </section>

      <p v-if="showSection('response') && responseTypeLink" class="vod-endpoint__returns">
        <span class="vod-endpoint__type-label">Returns</span>
        <a class="vod-endpoint__type-link" :href="responseTypeLink.href">{{
          responseTypeLink.label
        }}</a>
      </p>

      <p v-if="showSection('request') && requestTypeLink" class="vod-endpoint__accepts">
        <span class="vod-endpoint__type-label">Accepts</span>
        <a class="vod-endpoint__type-link" :href="requestTypeLink.href">{{
          requestTypeLink.label
        }}</a>
      </p>

      <p
        v-if="useColumns && showSection('auth') && resolvedScheme !== 'none'"
        class="vod-endpoint__auth-info"
      >
        <svg
          class="vod-endpoint__auth-icon"
          viewBox="0 0 12 12"
          width="12"
          height="12"
          aria-hidden="true"
        >
          <path
            d="M3.5 5V3.5a2.5 2.5 0 0 1 5 0V5h.5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h.5zm1 0h3V3.5a1.5 1.5 0 0 0-3 0V5z"
            fill="currentColor"
          />
        </svg>
        <span>{{ authLabel }} required</span>
      </p>

      <section v-if="showSection('response') && hasResponseExamples" class="vod-endpoint__section">
        <details v-if="!useColumns" class="vod-endpoint__main-details">
          <summary class="vod-endpoint__section-title">Response examples</summary>
          <ResponseExamples :responses="op.responses" />
        </details>
        <template v-else>
          <h4 class="vod-endpoint__section-title">Response examples</h4>
          <ResponseExamples :responses="op.responses" />
        </template>
      </section>
    </section>

    <EndpointTryPanel
      :op="op"
      :spec-name="specName"
      :spec-version-label="specVersionLabel"
      :server-list="serverList"
      :scheme="resolvedScheme"
      :header-name="resolvedHeaderName"
      :api-key-in="resolvedApiKeyIn"
      :oauth2-flow="oauth2Flow"
      :body-inputs="effectiveBodyInputs"
      :inline="!useColumns"
      :show-snippets="showSection('snippets')"
      :show-auth="showSection('auth')"
      :show-try="showSection('try')"
      @request-start="emit('request-start', $event)"
      @request-success="emit('request-success', $event)"
      @request-error="emit('request-error', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type {
  RequestErrorPayload,
  RequestStartPayload,
  RequestSuccessPayload,
} from 'vue-api-playground'
import { resolveOperation, useDefaults, useSpecRegistry } from '../runtime/registry'
import { useRoutes } from '../runtime/routes'
import { type AuthScheme } from '../runtime/auth'
import ResponseExamples from './ResponseExamples.vue'
import EndpointTryPanel from './EndpointTryPanel.vue'
import ParametersTable from './ParametersTable.vue'
import type { ParsedOAuth2Flow, ParsedOperation, ParsedSpec } from '../parser/types'

type Section =
  | 'summary'
  | 'description'
  | 'params'
  | 'request'
  | 'response'
  | 'auth'
  | 'snippets'
  | 'try'

interface Props {
  /** OperationId (single-spec) or `<specName>.<operationId>` (multi-spec). */
  id: string
  /** Auth mode override. `none` disables; otherwise picks the scheme used by snippets and AuthControls. */
  auth?: AuthScheme | 'none' | 'oauth2'
  /** Single-server override. Ignored when the spec declares servers; use `servers` for explicit lists. */
  server?: string
  /** Sections to render. Defaults to all. */
  show?: Section[]
  /** Bypass the injected registry. Useful for tests and isolated examples. */
  operation?: ParsedOperation
  /** Server URL list to draw from when `operation` is supplied directly. */
  servers?: string[]
  /** Custom header name for `apikey` schemes. Defaults to `X-API-Key`. */
  apiKeyHeaderName?: string
  /** When true, request body properties render as individual inputs instead of a JSON textarea. */
  bodyInputs?: boolean
  /** Card layout. `columns` splits docs/code into a two-column grid. `stacked` preserves vertical layout. */
  layout?: 'columns' | 'stacked'
}

const ALL_SECTIONS: Section[] = [
  'summary',
  'description',
  'params',
  'request',
  'response',
  'auth',
  'snippets',
  'try',
]

const props = withDefaults(defineProps<Props>(), {
  auth: undefined,
  server: undefined,
  show: undefined,
  operation: undefined,
  servers: () => [],
  apiKeyHeaderName: undefined,
  bodyInputs: undefined,
  layout: undefined,
})

const emit = defineEmits<{
  'request-start': [payload: RequestStartPayload]
  'request-success': [payload: RequestSuccessPayload]
  'request-error': [payload: RequestErrorPayload]
}>()

const registry = useSpecRegistry()
const defaults = useDefaults()
const routes = useRoutes()
const effectiveShow = computed(() => props.show ?? defaults.show ?? ALL_SECTIONS)
const effectiveAuth = computed(() => props.auth ?? defaults.auth)
const effectiveServer = computed(() => props.server ?? defaults.server)
const effectiveApiKeyHeaderName = computed(
  () => props.apiKeyHeaderName ?? defaults.apiKeyHeaderName
)
const effectiveBodyInputs = computed(() => props.bodyInputs ?? defaults.bodyInputs ?? false)
const effectiveLayout = computed(() => props.layout ?? defaults.layout ?? 'columns')

const resolved = computed(() => {
  if (props.operation) {
    return {
      operation: props.operation,
      servers: props.servers,
      specName: 'inline',
      spec: undefined as ParsedSpec | undefined,
    }
  }
  const hit = resolveOperation(registry, props.id)
  return hit
    ? {
        operation: hit.operation,
        servers: hit.spec.servers,
        specName: hit.spec.name,
        spec: hit.spec,
      }
    : null
})

const op = computed(() => resolved.value!.operation)
const specName = computed(() => resolved.value?.specName ?? 'inline')
const specVersionLabel = computed(() => {
  const spec = resolved.value?.spec
  if (!spec) return ''
  const title = spec.title || spec.name
  return spec.version ? `${title} v${spec.version}` : title
})

const resolvedScheme = computed<AuthScheme | 'none'>(() => {
  if (effectiveAuth.value === 'none') return 'none'
  if (effectiveAuth.value === 'oauth2') return 'oauth2'
  if (effectiveAuth.value) return effectiveAuth.value

  const securityName = op.value.security[0]
  if (!securityName) return 'none'

  const scheme = resolved.value?.spec?.securitySchemes[securityName]
  if (scheme) return scheme.type === 'unknown' ? 'none' : scheme.type
  if (
    securityName === 'bearer' ||
    securityName === 'apikey' ||
    securityName === 'basic' ||
    securityName === 'oauth2'
  )
    return securityName
  return 'none'
})

const oauth2Flow = computed<ParsedOAuth2Flow | undefined>(() => {
  if (resolvedScheme.value !== 'oauth2') return undefined
  const securityName = op.value.security[0]
  if (!securityName) return undefined
  const scheme = resolved.value?.spec?.securitySchemes[securityName]
  if (!scheme?.oauth2Flows) return undefined
  return (
    scheme.oauth2Flows.authorizationCode ??
    scheme.oauth2Flows.implicit ??
    scheme.oauth2Flows.clientCredentials ??
    scheme.oauth2Flows.password ??
    Object.values(scheme.oauth2Flows)[0]
  )
})

const resolvedHeaderName = computed<string | undefined>(() => {
  if (effectiveApiKeyHeaderName.value) return effectiveApiKeyHeaderName.value
  if (resolvedScheme.value !== 'apikey') return undefined
  const securityName = op.value.security[0]
  if (!securityName) return undefined
  return resolved.value?.spec?.securitySchemes[securityName]?.name
})

const resolvedApiKeyIn = computed<'header' | 'query' | 'cookie' | undefined>(() => {
  if (resolvedScheme.value !== 'apikey') return undefined
  const securityName = op.value.security[0]
  if (!securityName) return undefined
  const secScheme = resolved.value?.spec?.securitySchemes[securityName]
  const schemeIn = secScheme ? (secScheme as { in?: string }).in : undefined
  if (schemeIn === 'query' || schemeIn === 'cookie') return schemeIn
  return 'header'
})

const serverList = computed<string[]>(() => {
  if (effectiveServer.value) return [effectiveServer.value]
  return resolved.value?.servers ?? []
})

interface TypeLink {
  label: string
  href: string
}

const responseTypeLink = computed<TypeLink | undefined>(() => {
  const responseRefs = op.value.responseSchemaRefs ?? {}
  const successStatus = ['200', '201', '202'].find((s) => responseRefs[s])
  if (!successStatus) return undefined
  const refs = responseRefs[successStatus]!
  const first = refs['application/json'] ?? Object.values(refs)[0]
  if (!first) return undefined
  return { label: first.name, href: routes.schemaUrl(specName.value, first.name) }
})

const hasResponseExamples = computed(() =>
  op.value.responses.some((r) => r.content && Object.keys(r.content).length > 0)
)

const requestTypeLink = computed<TypeLink | undefined>(() => {
  const refs = op.value.requestSchemaRefs ?? {}
  const first = refs['application/json'] ?? Object.values(refs)[0]
  if (!first) return undefined
  return { label: first.name, href: routes.schemaUrl(specName.value, first.name) }
})

const NARROW_BREAKPOINT = '(max-width: 1279px)'
const viewportIsNarrow = ref(false)
let viewportMq: MediaQueryList | null = null
function handleViewportChange(e: MediaQueryListEvent): void {
  viewportIsNarrow.value = e.matches
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  viewportMq = window.matchMedia(NARROW_BREAKPOINT)
  viewportIsNarrow.value = viewportMq.matches
  viewportMq.addEventListener('change', handleViewportChange)
})

onUnmounted(() => {
  viewportMq?.removeEventListener('change', handleViewportChange)
  viewportMq = null
})

const useColumns = computed(() => effectiveLayout.value === 'columns' && !viewportIsNarrow.value)

const PARAMS_VISIBLE_LIMIT = 3

const authLabel = computed(() => {
  const s = resolvedScheme.value
  if (s === 'bearer' || s === 'oauth2') return 'Bearer token'
  if (s === 'basic') return 'Basic auth'
  if (s === 'apikey') return 'API key'
  return 'Authentication'
})

function showSection(section: Section): boolean {
  return effectiveShow.value.includes(section)
}
</script>
