<template>
  <aside class="vod-page-aside" :class="{ 'vod-page-aside--inline': inline }">
    <header v-if="!inline" class="vod-page-aside__header">
      <span class="vod-page-aside__label">Try It</span>
      <span v-if="specVersionLabel" class="vod-page-aside__spec">{{ specVersionLabel }}</span>
    </header>
    <h4 v-else-if="showTry" class="vod-endpoint__section-title">Try it</h4>

    <details v-if="showSnippets" class="vod-page-aside__collapsible">
      <summary>Code examples</summary>
      <SdkSnippets :snippets="snippets" :aria-label="snippetsLabel" />
    </details>

    <details v-if="renderAuth" class="vod-page-aside__collapsible">
      <summary>Authentication</summary>
      <AuthControls
        :spec-name="specName"
        :scheme="scheme"
        :header-name="headerName"
        :api-key-in="apiKeyIn"
        :oauth2-flow="oauth2Flow"
      />
    </details>

    <EndpointPlayground
      v-if="showTry"
      :url="op.path"
      :method="op.method.toUpperCase()"
      :data="playgroundData"
      :headers="baseHeaders"
      :servers="serverList"
      :content-type="bodyInputs ? undefined : requestContentType"
      :body="bodyInputs ? undefined : exampleBody"
      :params-limit="PLAYGROUND_PARAMS_LIMIT"
      @before-send="injectAuth"
      @request-start="emit('request-start', $event)"
      @request-success="emit('request-success', $event)"
      @request-error="emit('request-error', $event)"
    />
  </aside>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import type {
  PlaygroundContentType,
  PlaygroundDataItem,
  RequestErrorPayload,
  RequestStartPayload,
  RequestSuccessPayload,
} from 'vue-api-playground'
import AuthControls from './AuthControls.vue'
import SdkSnippets from './SdkSnippets.vue'
import EndpointPlayground from './EndpointPlayground.vue'
import { useAuthState, type AuthScheme } from '../runtime/auth'
import { buildSnippets } from '../snippets/index'
import { generateJsonBody } from '../runtime/example'
import type { ParsedOAuth2Flow, ParsedOperation } from '../parser/types'

const PLAYGROUND_PARAMS_LIMIT = 3

interface Props {
  op: ParsedOperation
  specName: string
  specVersionLabel: string
  serverList: string[]
  scheme: AuthScheme | 'none'
  headerName?: string
  apiKeyIn?: 'header' | 'query' | 'cookie'
  oauth2Flow?: ParsedOAuth2Flow
  bodyInputs: boolean
  inline: boolean
  showSnippets: boolean
  showAuth: boolean
  showTry: boolean
}

const props = withDefaults(defineProps<Props>(), {
  headerName: undefined,
  apiKeyIn: undefined,
  oauth2Flow: undefined,
})

const emit = defineEmits<{
  'request-start': [payload: RequestStartPayload]
  'request-success': [payload: RequestSuccessPayload]
  'request-error': [payload: RequestErrorPayload]
}>()

const authState = useAuthState(toRef(props, 'specName'))

const renderAuth = computed(() => props.showAuth && props.showTry && props.scheme !== 'none')

const snippetAuthScheme = computed<'bearer' | 'apikey' | 'basic' | undefined>(() => {
  if (props.scheme === 'none') return undefined
  if (props.scheme === 'oauth2') return 'bearer'
  return props.scheme
})

const snippets = computed(() => {
  if (!snippetAuthScheme.value) {
    return buildSnippets(props.op, {
      baseUrl: props.serverList[0],
      exampleBody: exampleBody.value,
    })
  }
  const cred = authState.credential.value
  return buildSnippets(props.op, {
    baseUrl: props.serverList[0],
    exampleBody: exampleBody.value,
    auth: {
      scheme: snippetAuthScheme.value,
      value: cred?.value,
      headerName: cred?.headerName ?? props.headerName,
      apiKeyIn: cred?.apiKeyIn ?? props.apiKeyIn,
    },
  })
})

const snippetsLabel = computed(
  () => `${props.op.method.toUpperCase()} ${props.op.path} code samples`
)

const bodyFieldItems = computed<PlaygroundDataItem[]>(() => {
  if (!props.bodyInputs) return []
  const fields = props.op.requestBody?.jsonFields ?? []
  return fields.map((f) => ({
    name: f.name,
    value: f.example,
    ...(f.typeLabel ? { description: f.typeLabel } : {}),
  }))
})

const playgroundData = computed<PlaygroundDataItem[]>(() => {
  const params = props.op.parameters
    .filter((p) => p.in === 'path' || p.in === 'query')
    .map((p) => ({
      name: p.name,
      value: p.defaultExample,
      type: p.in,
      ...(p.typeLabel ? { description: p.typeLabel } : {}),
    }))
  return [...params, ...bodyFieldItems.value]
})

const baseHeaders = computed<Record<string, string> | undefined>(() => {
  const headers: Record<string, string> = {}
  for (const p of props.op.parameters) {
    if (p.in === 'header') headers[p.name] = p.defaultExample
  }
  return Object.keys(headers).length > 0 ? headers : undefined
})

const requestContentType = computed<PlaygroundContentType | undefined>(() => {
  const contentMap = props.op.requestBody?.content
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
  const jsonSchema = props.op.requestBody?.content['application/json']?.schema
  return jsonSchema ? generateJsonBody(jsonSchema) : undefined
})

function injectAuth(envelope: { url: string; init: RequestInit }): void {
  const cred = authState.credential.value
  if (!cred) return
  const headers = { ...(envelope.init.headers as Record<string, string> | undefined) }
  if (cred.scheme === 'bearer' || cred.scheme === 'oauth2') {
    headers['Authorization'] = `Bearer ${cred.value}`
  } else if (cred.scheme === 'basic') {
    headers['Authorization'] = `Basic ${cred.value}`
  } else if (cred.scheme === 'apikey') {
    const keyIn = cred.apiKeyIn ?? 'header'
    const keyName = cred.headerName ?? props.headerName ?? 'X-API-Key'
    if (keyIn === 'query') {
      const sep = envelope.url.includes('?') ? '&' : '?'
      envelope.url = `${envelope.url}${sep}${encodeURIComponent(keyName)}=${encodeURIComponent(cred.value)}`
    } else if (keyIn === 'cookie') {
      // Cookie is a forbidden request header in the Fetch API; browsers drop it.
    } else {
      headers[keyName] = cred.value
    }
  }
  envelope.init.headers = headers
}
</script>
