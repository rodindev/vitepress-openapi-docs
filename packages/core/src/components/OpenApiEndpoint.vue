<template>
  <section v-if="!resolved" class="vod-endpoint vod-endpoint--missing" role="alert">
    <p>
      <strong>Missing endpoint:</strong> <code>{{ id }}</code> is not defined in any registered
      OpenAPI spec.
    </p>
  </section>

  <section v-else class="vod-endpoint" :class="{ 'vod-endpoint--deprecated': op.deprecated }">
    <header v-if="showSection('summary')" class="vod-endpoint__header">
      <h3 class="vod-endpoint__title">
        {{ op.summary || op.id }}
        <span v-if="op.deprecated" class="vod-endpoint__deprecated-badge">deprecated</span>
      </h3>
      <p class="vod-endpoint__route">
        <span
          class="vod-endpoint__method"
          :class="{ 'vod-endpoint__method--webhook': op.kind === 'webhook' }"
          :data-method="op.method"
        >
          {{ op.method.toUpperCase() }}
        </span>
        <code class="vod-endpoint__path">{{ op.path }}</code>
        <span v-if="op.kind === 'webhook'" class="vod-endpoint__kind-badge">webhook</span>
      </p>
    </header>

    <p v-if="showSection('description') && op.description" class="vod-endpoint__description">
      {{ op.description }}
    </p>

    <ul v-if="showSection('params') && op.parameters.length > 0" class="vod-endpoint__params">
      <li v-for="p in op.parameters" :key="`${p.in}:${p.name}`">
        <code>{{ p.name }}</code>
        <span class="vod-endpoint__param-meta"
          >({{ p.in }}{{ p.required ? ', required' : '' }})</span
        >
        <span v-if="p.description"> — {{ p.description }}</span>
      </li>
    </ul>

    <AuthControls
      v-if="showSection('auth') && resolvedScheme !== 'none'"
      :spec-name="specName"
      :scheme="resolvedScheme"
      :header-name="resolvedHeaderName"
      :api-key-in="resolvedApiKeyIn"
      :oauth2-flow="oauth2Flow"
    />

    <p v-if="showSection('response') && responseTypeLink" class="vod-endpoint__returns">
      Returns
      <a class="vod-endpoint__type-link" :href="responseTypeLink.href">{{
        responseTypeLink.label
      }}</a>
    </p>

    <p v-if="showSection('request') && requestTypeLink" class="vod-endpoint__accepts">
      Accepts
      <a class="vod-endpoint__type-link" :href="requestTypeLink.href">{{
        requestTypeLink.label
      }}</a>
    </p>

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
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { Playground } from 'vue-api-playground'
import type {
  PlaygroundContentType,
  PlaygroundDataItem,
  RequestErrorPayload,
  RequestStartPayload,
  RequestSuccessPayload,
} from 'vue-api-playground'
import { resolveOperation, useDefaults, useSpecRegistry } from '../runtime/registry'
import { buildSnippets } from '../snippets/index'
import { useAuthState, type AuthScheme } from '../runtime/auth'
import { generateExample, generateJsonBody } from '../runtime/example'
import AuthControls from './AuthControls.vue'
import SdkSnippets from './SdkSnippets.vue'
import ResponseExamples from './ResponseExamples.vue'
import type {
  ParsedOAuth2Flow,
  ParsedOperation,
  ParsedParameter,
  ParsedSpec,
} from '../parser/types'

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
})

const emit = defineEmits<{
  'request-start': [payload: RequestStartPayload]
  'request-success': [payload: RequestSuccessPayload]
  'request-error': [payload: RequestErrorPayload]
}>()

const registry = useSpecRegistry()
const defaults = useDefaults()
const effectiveShow = computed(() => props.show ?? defaults.show ?? ALL_SECTIONS)
const effectiveAuth = computed(() => props.auth ?? defaults.auth)
const effectiveServer = computed(() => props.server ?? defaults.server)
const effectiveApiKeyHeaderName = computed(
  () => props.apiKeyHeaderName ?? defaults.apiKeyHeaderName
)
const effectiveBodyInputs = computed(() => props.bodyInputs ?? defaults.bodyInputs ?? false)
const effectiveCollapse = computed(() => props.collapse ?? defaults.collapse ?? [])

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
  const schema = op.value.requestBody?.content['application/json']?.schema
  if (!schema || typeof schema !== 'object') return []
  const s = schema as Record<string, unknown>
  const properties = (s.properties ?? {}) as Record<string, unknown>
  if (Object.keys(properties).length === 0) return []
  const required = Array.isArray(s.required)
    ? (s.required as unknown[]).filter((v): v is string => typeof v === 'string')
    : []
  const sorted = [
    ...required.filter((k) => k in properties),
    ...Object.keys(properties).filter((k) => !required.includes(k)),
  ]
  return sorted.map((name) => ({
    name,
    value: toFieldValue(generateExample(properties[name])),
  }))
})

const playgroundData = computed<PlaygroundDataItem[]>(() => {
  const params = op.value.parameters
    .filter((p) => p.in === 'path' || p.in === 'query')
    .map((p) => ({ name: p.name, value: parameterExample(p), type: p.in }))
  return [...params, ...bodyFieldItems.value]
})

const baseHeaders = computed<Record<string, string> | undefined>(() => {
  const headers: Record<string, string> = {}
  for (const p of op.value.parameters) {
    if (p.in === 'header') headers[p.name] = parameterExample(p)
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
  return { label: first.name, href: withBase(`/schemas/${specName.value}/${first.name}`) }
})

const requestTypeLink = computed<TypeLink | undefined>(() => {
  const refs = op.value.requestSchemaRefs ?? {}
  const first = refs['application/json'] ?? Object.values(refs)[0]
  if (!first) return undefined
  return { label: first.name, href: withBase(`/schemas/${specName.value}/${first.name}`) }
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
      // Cookie is a forbidden request header in the Fetch API — browsers silently drop it.
      // Cookie-based API key auth cannot be tested from the Try-It panel.
    } else {
      headers[keyName] = cred.value
    }
  }
  envelope.init.headers = headers
}

function parameterExample(p: ParsedParameter): string {
  if (p.example !== undefined) return toFieldValue(p.example)
  const schema = p.schema as Record<string, unknown> | undefined
  if (schema) {
    if (schema.example !== undefined) return toFieldValue(schema.example)
    if (schema.default !== undefined) return toFieldValue(schema.default)
    if (Array.isArray(schema.enum) && schema.enum.length > 0) return toFieldValue(schema.enum[0])
  }
  return ''
}

function toFieldValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function showSection(section: Section): boolean {
  return effectiveShow.value.includes(section)
}

function isCollapsed(section: Section): boolean {
  return effectiveCollapse.value.includes(section)
}
</script>
