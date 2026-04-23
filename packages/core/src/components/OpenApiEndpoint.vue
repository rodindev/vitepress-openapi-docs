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
        class="vod-endpoint__section vod-endpoint__section--params"
      >
        <h4 class="vod-endpoint__section-title">
          Parameters
          <span class="vod-endpoint__section-count">{{ op.parameters.length }}</span>
        </h4>
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
        <button
          v-if="hiddenParamsCount > 0"
          class="vod-endpoint__params-toggle"
          :data-expanded="paramsExpanded"
          @click="paramsExpanded = !paramsExpanded"
        >
          {{ paramsExpanded ? 'Show fewer' : `Show all ${op.parameters.length} parameters` }}
        </button>
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

      <AuthControls
        v-if="!useColumns && showSection('auth') && resolvedScheme !== 'none'"
        :spec-name="specName"
        :scheme="resolvedScheme"
        :header-name="resolvedHeaderName"
        :api-key-in="resolvedApiKeyIn"
        :oauth2-flow="oauth2Flow"
      />

      <ResponseExamples v-if="useColumns && showSection('response')" :responses="op.responses" />

      <template v-if="!useColumns">
        <details
          v-if="showSection('response') && isCollapsed('response')"
          class="vod-endpoint__collapsible"
        >
          <summary>Response examples</summary>
          <ResponseExamples :responses="op.responses" />
        </details>
        <ResponseExamples v-else-if="showSection('response')" :responses="op.responses" />

        <details
          v-if="showSection('snippets') && isCollapsed('snippets')"
          class="vod-endpoint__collapsible"
        >
          <summary>Code samples</summary>
          <SdkSnippets
            :snippets="snippets"
            :aria-label="`${op.method.toUpperCase()} ${op.path} code samples`"
          />
        </details>
        <SdkSnippets
          v-else-if="showSection('snippets')"
          :snippets="snippets"
          :aria-label="`${op.method.toUpperCase()} ${op.path} code samples`"
        />

        <details v-if="showSection('try') && isCollapsed('try')" class="vod-endpoint__collapsible">
          <summary>Try it</summary>
          <Playground
            :url="op.path"
            :method="op.method.toUpperCase()"
            :data="playgroundData"
            :headers="baseHeaders"
            :servers="serverList"
            :content-type="effectiveBodyInputs ? undefined : requestContentType"
            :body="effectiveBodyInputs ? undefined : exampleBody"
            @before-send="injectAuth"
            @request-start="emit('request-start', $event)"
            @request-success="emit('request-success', $event)"
            @request-error="emit('request-error', $event)"
          />
        </details>
        <Playground
          v-else-if="showSection('try')"
          :url="op.path"
          :method="op.method.toUpperCase()"
          :data="playgroundData"
          :headers="baseHeaders"
          :servers="serverList"
          :content-type="effectiveBodyInputs ? undefined : requestContentType"
          :body="effectiveBodyInputs ? undefined : exampleBody"
          @before-send="injectAuth"
          @request-start="emit('request-start', $event)"
          @request-success="emit('request-success', $event)"
          @request-error="emit('request-error', $event)"
        />
      </template>
    </section>

    <aside v-if="useColumns" class="vod-page-aside">
      <header class="vod-page-aside__header">
        <span class="vod-page-aside__label">Try It</span>
        <span v-if="specVersionLabel" class="vod-page-aside__spec">{{ specVersionLabel }}</span>
      </header>

      <details v-if="showSection('snippets')" class="vod-page-aside__collapsible">
        <summary class="vod-page-aside__summary">Code</summary>
        <SdkSnippets
          :snippets="snippets"
          :aria-label="`${op.method.toUpperCase()} ${op.path} code samples`"
        />
      </details>

      <details
        v-if="showSection('auth') && showSection('try') && resolvedScheme !== 'none'"
        class="vod-page-aside__collapsible"
      >
        <summary class="vod-page-aside__summary">Authentication</summary>
        <AuthControls
          :spec-name="specName"
          :scheme="resolvedScheme"
          :header-name="resolvedHeaderName"
          :api-key-in="resolvedApiKeyIn"
          :oauth2-flow="oauth2Flow"
        />
      </details>

      <div
        v-if="showSection('try')"
        class="vod-param-cap"
        :class="{ 'vod-param-cap--expanded': asideParamsExpanded }"
      >
        <Playground
          :url="op.path"
          :method="op.method.toUpperCase()"
          :data="playgroundData"
          :headers="baseHeaders"
          :servers="serverList"
          :content-type="effectiveBodyInputs ? undefined : requestContentType"
          :body="effectiveBodyInputs ? undefined : exampleBody"
          dense
          @before-send="injectAuth"
          @request-start="emit('request-start', $event)"
          @request-success="emit('request-success', $event)"
          @request-error="emit('request-error', $event)"
        />
        <button
          v-if="playgroundData.length > ASIDE_PARAMS_LIMIT"
          type="button"
          class="vod-param-cap__toggle"
          :data-expanded="asideParamsExpanded"
          @click="asideParamsExpanded = !asideParamsExpanded"
        >
          {{ asideParamsExpanded ? 'Show fewer' : `Show all ${playgroundData.length} fields` }}
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Playground } from 'vue-api-playground'
import type {
  PlaygroundContentType,
  PlaygroundDataItem,
  RequestErrorPayload,
  RequestStartPayload,
  RequestSuccessPayload,
} from 'vue-api-playground'
import { resolveOperation, useDefaults, useSpecRegistry } from '../runtime/registry'
import { useRoutes } from '../runtime/routes'
import { buildSnippets } from '../snippets/index'
import { useAuthState, type AuthScheme } from '../runtime/auth'
import { generateJsonBody } from '../runtime/example'
import AuthControls from './AuthControls.vue'
import SdkSnippets from './SdkSnippets.vue'
import ResponseExamples from './ResponseExamples.vue'
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
  /** Sections to render collapsed (inside a toggle). Useful for reducing card height. */
  collapse?: Section[]
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
  collapse: undefined,
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
const effectiveCollapse = computed(() => props.collapse ?? defaults.collapse ?? [])
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

const authState = useAuthState(specName)

const serverList = computed<string[]>(() => {
  if (effectiveServer.value) return [effectiveServer.value]
  return resolved.value?.servers ?? []
})

const bodyFieldItems = computed<PlaygroundDataItem[]>(() => {
  if (!effectiveBodyInputs.value) return []
  const fields = op.value.requestBody?.jsonFields ?? []
  return fields.map((f) => ({ name: f.name, value: f.example }))
})

const playgroundData = computed<PlaygroundDataItem[]>(() => {
  const includeDesc = !useColumns.value
  const params = op.value.parameters
    .filter((p) => p.in === 'path' || p.in === 'query')
    .map((p) => ({
      name: p.name,
      value: p.defaultExample,
      type: p.in,
      ...(includeDesc && p.description ? { description: p.description } : {}),
    }))
  return [...params, ...bodyFieldItems.value]
})

const baseHeaders = computed<Record<string, string> | undefined>(() => {
  const headers: Record<string, string> = {}
  for (const p of op.value.parameters) {
    if (p.in === 'header') headers[p.name] = p.defaultExample
  }
  return Object.keys(headers).length > 0 ? headers : undefined
})

const requestContentType = computed<PlaygroundContentType | undefined>(() => {
  const contentMap = op.value.requestBody?.content
  if (!contentMap) return undefined
  const first = Object.keys(contentMap)[0]
  if (
    first === 'application/json' ||
    first === 'application/x-www-form-urlencoded' ||
    first === 'multipart/form-data' ||
    first === 'text/plain'
  ) {
    return first
  }
  return undefined
})

const exampleBody = computed<string | undefined>(() => {
  const jsonSchema = op.value.requestBody?.content['application/json']?.schema
  return jsonSchema ? generateJsonBody(jsonSchema) : undefined
})

const snippetAuthScheme = computed<'bearer' | 'apikey' | 'basic' | undefined>(() => {
  const s = resolvedScheme.value
  if (s === 'none') return undefined
  if (s === 'oauth2') return 'bearer'
  return s
})

const snippets = computed(() => {
  if (!snippetAuthScheme.value) {
    return buildSnippets(op.value, {
      baseUrl: serverList.value[0],
      exampleBody: exampleBody.value,
    })
  }
  const cred = authState.credential.value
  return buildSnippets(op.value, {
    baseUrl: serverList.value[0],
    exampleBody: exampleBody.value,
    auth: {
      scheme: snippetAuthScheme.value,
      value: cred?.value,
      headerName: cred?.headerName ?? resolvedHeaderName.value,
      apiKeyIn: cred?.apiKeyIn ?? resolvedApiKeyIn.value,
    },
  })
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

const requestTypeLink = computed<TypeLink | undefined>(() => {
  const refs = op.value.requestSchemaRefs ?? {}
  const first = refs['application/json'] ?? Object.values(refs)[0]
  if (!first) return undefined
  return { label: first.name, href: routes.schemaUrl(specName.value, first.name) }
})

function injectAuth(envelope: { url: string; init: RequestInit }): void {
  const cred = authState.credential.value
  if (!cred) return
  const headers = { ...(envelope.init.headers as Record<string, string> | undefined) }
  if (cred.scheme === 'bearer' || cred.scheme === 'oauth2')
    headers['Authorization'] = `Bearer ${cred.value}`
  else if (cred.scheme === 'basic') headers['Authorization'] = `Basic ${cred.value}`
  else if (cred.scheme === 'apikey') {
    const keyIn = cred.apiKeyIn ?? 'header'
    const keyName = cred.headerName ?? resolvedHeaderName.value ?? 'X-API-Key'
    if (keyIn === 'query') {
      const sep = envelope.url.includes('?') ? '&' : '?'
      envelope.url = `${envelope.url}${sep}${encodeURIComponent(keyName)}=${encodeURIComponent(cred.value)}`
    } else if (keyIn === 'cookie') {
      // Cookie is a forbidden request header in the Fetch API - browsers silently drop it.
      // Cookie-based API key auth cannot be tested from the Try-It panel.
    } else {
      headers[keyName] = cred.value
    }
  }
  envelope.init.headers = headers
}

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

const PARAMS_VISIBLE_LIMIT = 5
const ASIDE_PARAMS_LIMIT = 4
const paramsExpanded = ref(false)
const asideParamsExpanded = ref(false)

const visibleParams = computed(() => {
  const all = op.value.parameters
  if (all.length <= PARAMS_VISIBLE_LIMIT || paramsExpanded.value) return all
  return all.slice(0, PARAMS_VISIBLE_LIMIT)
})

const hiddenParamsCount = computed(() => {
  const total = op.value.parameters.length
  return total > PARAMS_VISIBLE_LIMIT ? total - PARAMS_VISIBLE_LIMIT : 0
})

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

function isCollapsed(section: Section): boolean {
  return effectiveCollapse.value.includes(section)
}
</script>
