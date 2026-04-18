<template>
  <fieldset class="vod-auth" :aria-label="`Authentication for ${specName}`">
    <legend class="vod-auth__legend">Authentication</legend>

    <div v-if="scheme === 'oauth2' && oauth2Flow" class="vod-auth__oauth2">
      <p v-if="oauth2Flow.authorizationUrl" class="vod-auth__oauth2-url">
        <span class="vod-auth__label">Authorization URL</span>
        <a
          :href="oauth2Flow.authorizationUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="vod-auth__link"
          >{{ oauth2Flow.authorizationUrl }}</a
        >
      </p>
      <p v-if="oauth2Flow.tokenUrl" class="vod-auth__oauth2-url">
        <span class="vod-auth__label">Token URL</span>
        <code class="vod-auth__code">{{ oauth2Flow.tokenUrl }}</code>
      </p>
      <details v-if="Object.keys(oauth2Flow.scopes).length > 0" class="vod-auth__oauth2-scopes">
        <summary class="vod-auth__label">
          Scopes ({{ Object.keys(oauth2Flow.scopes).length }})
        </summary>
        <ul class="vod-auth__scope-list">
          <li v-for="(desc, scope) in oauth2Flow.scopes" :key="scope">
            <code>{{ scope }}</code>
            <span v-if="desc"> — {{ desc }}</span>
          </li>
        </ul>
      </details>
    </div>

    <label v-if="scheme !== 'none'" class="vod-auth__field">
      <span class="vod-auth__label">{{ inputLabel }}</span>
      <input
        v-model="draft"
        :type="inputType"
        :placeholder="placeholder"
        class="vod-auth__input"
        autocomplete="off"
        spellcheck="false"
        @blur="commit"
        @keydown.enter.prevent="commit"
      />
    </label>

    <p v-if="apiKeyIn === 'cookie'" class="vod-auth__warning" role="alert">
      Cookie-based auth cannot be injected from the browser. The Try-It panel will send requests
      without this credential.
    </p>

    <p v-if="storedValue" class="vod-auth__status" role="status">Credentials saved for this tab.</p>

    <button type="button" class="vod-auth__clear" :disabled="!storedValue" @click="clearCredential">
      Clear credentials
    </button>
  </fieldset>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthState, type AuthScheme } from '../runtime/auth'
import type { ParsedOAuth2Flow } from '../parser/types'

interface Props {
  /** Spec name; sessionStorage is keyed `vod:auth:{specName}`. */
  specName: string
  /** Auth scheme for this spec. `none` hides the input. */
  scheme: AuthScheme | 'none'
  /** Header name override when `scheme === 'apikey'`. */
  headerName?: string
  /** Where the API key is sent. Defaults to `header`. */
  apiKeyIn?: 'header' | 'query' | 'cookie'
  /** OAuth2 flow details when `scheme === 'oauth2'`. */
  oauth2Flow?: ParsedOAuth2Flow
}

const props = defineProps<Props>()
const state = useAuthState(props.specName)

const storedValue = computed(() => state.credential.value?.value ?? '')
const draft = ref(storedValue.value)

watch(storedValue, (value) => {
  if (draft.value !== value) draft.value = value
})

const inputLabel = computed(() => {
  if (props.scheme === 'bearer') return 'Bearer token'
  if (props.scheme === 'basic') return 'username:password'
  if (props.scheme === 'apikey') return props.headerName ?? 'X-API-Key'
  if (props.scheme === 'oauth2') return 'Paste OAuth2 token'
  return 'Credential'
})

const inputType = computed(() => (props.scheme === 'basic' ? 'text' : 'password'))

const placeholder = computed(() => {
  if (props.scheme === 'bearer') return 'eyJhbGciOi…'
  if (props.scheme === 'basic') return 'username:password'
  if (props.scheme === 'apikey') return 'sk_…'
  if (props.scheme === 'oauth2') return 'eyJhbGciOi…'
  return ''
})

function commit() {
  if (props.scheme === 'none') return
  const trimmed = draft.value.trim()
  if (!trimmed) {
    state.clear()
    return
  }
  state.set({
    scheme: props.scheme,
    value: trimmed,
    headerName: props.scheme === 'apikey' ? props.headerName : undefined,
    apiKeyIn: props.scheme === 'apikey' ? (props.apiKeyIn ?? 'header') : undefined,
  })
}

function clearCredential() {
  draft.value = ''
  state.clear()
}
</script>
