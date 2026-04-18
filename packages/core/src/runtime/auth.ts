import { computed, isRef, onMounted, ref, watch, type ComputedRef, type Ref } from 'vue'

export type AuthScheme = 'bearer' | 'apikey' | 'basic' | 'oauth2'

export interface AuthCredential {
  scheme: AuthScheme
  /** Token, API key, or `${user}:${pass}` for basic. */
  value: string
  /** Custom header name for `apikey` schemes. Defaults to `X-API-Key`. */
  headerName?: string
  /** Where the API key is sent: `header`, `query`, or `cookie`. Defaults to `header`. */
  apiKeyIn?: 'header' | 'query' | 'cookie'
}

export interface AuthState {
  /** Currently stored credential for the spec, or `undefined` when cleared. */
  credential: ComputedRef<AuthCredential | undefined>
  /** Persist a new credential (overwrites any existing one). */
  set(credential: AuthCredential): void
  /** Wipe the credential from sessionStorage and memory. */
  clear(): void
}

const STORAGE_PREFIX = 'vod:auth:'

/** Per-spec credential cache. SSR-safe (reads in onMounted). Accepts a reactive ref or plain string. */
export function useAuthState(specName: string | Ref<string> | ComputedRef<string>): AuthState {
  const nameRef = isRef(specName) ? specName : ref(specName)
  const store = ref<AuthCredential | undefined>(undefined)

  function storageKey(): string {
    return `${STORAGE_PREFIX}${nameRef.value}`
  }

  function loadFromStorage(): void {
    if (typeof sessionStorage === 'undefined') return
    const raw = sessionStorage.getItem(storageKey())
    if (!raw) {
      store.value = undefined
      return
    }
    try {
      const parsed = JSON.parse(raw) as AuthCredential
      store.value = isValidCredential(parsed) ? parsed : undefined
    } catch {
      sessionStorage.removeItem(storageKey())
      store.value = undefined
    }
  }

  onMounted(() => {
    loadFromStorage()
  })

  watch(nameRef, () => {
    loadFromStorage()
  })

  watch(store, (value) => {
    if (typeof sessionStorage === 'undefined') return
    try {
      if (value === undefined) sessionStorage.removeItem(storageKey())
      else sessionStorage.setItem(storageKey(), JSON.stringify(value))
    } catch {
      // sessionStorage quota exceeded — credential won't persist but UI still works
    }
  })

  return {
    credential: computed(() => store.value),
    set(credential) {
      store.value = { ...credential }
    },
    clear() {
      store.value = undefined
    },
  }
}

/** Synchronous read for tests and SSR-safe contexts. Returns `undefined` outside the browser. */
export function readStoredCredential(specName: string): AuthCredential | undefined {
  if (typeof sessionStorage === 'undefined') return undefined
  const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${specName}`)
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as AuthCredential
    return isValidCredential(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function isValidCredential(value: unknown): value is AuthCredential {
  if (!value || typeof value !== 'object') return false
  const cred = value as Record<string, unknown>
  return (
    (cred.scheme === 'bearer' ||
      cred.scheme === 'apikey' ||
      cred.scheme === 'basic' ||
      cred.scheme === 'oauth2') &&
    typeof cred.value === 'string'
  )
}
