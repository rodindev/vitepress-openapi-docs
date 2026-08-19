import { computed, isRef, ref, watch, onMounted, type ComputedRef, type Ref } from 'vue'

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

const authStoresCache = new Map<string, Ref<AuthCredential | undefined>>()
const hydratedStores = new Set<string>()

function storageKey(name: string) {
  return `${STORAGE_PREFIX}${name}`
}

export function getAuthStore(name: string): Ref<AuthCredential | undefined> {
  let store = authStoresCache.get(name)
  if (!store) {
    store = ref<AuthCredential | undefined>(undefined)
    authStoresCache.set(name, store)
  }
  return store
}

/** Test helper: wipe stored credentials, cached stores, and hydration markers. */
export function resetAuthStores() {
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear()
  authStoresCache.clear()
  hydratedStores.clear()
}

/** Base64 for `user:pass` values; plain btoa throws on non-Latin1 input. */
export function encodeBasicAuth(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function hydrateAuthStore(name: string) {
  if (typeof sessionStorage === 'undefined') return
  if (hydratedStores.has(name)) return
  hydratedStores.add(name)

  const store = getAuthStore(name)
  const key = storageKey(name)
  const raw = sessionStorage.getItem(key)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AuthCredential
      if (isValidCredential(parsed)) {
        store.value = parsed
      }
    } catch {
      sessionStorage.removeItem(key)
    }
  }
}

/** Per-spec credential cache. SSR-safe (reads in onMounted). Accepts a reactive ref or plain string. */
export function useAuthState(specName: string | Ref<string> | ComputedRef<string>): AuthState {
  const nameRef = isRef(specName) ? specName : ref(specName)
  const currentStore = computed(() => getAuthStore(nameRef.value))

  onMounted(() => {
    watch(
      nameRef,
      (name) => {
        hydrateAuthStore(name)
      },
      { immediate: true }
    )
  })

  return {
    credential: computed(() => currentStore.value.value),
    set(credential) {
      currentStore.value.value = { ...credential }
      if (typeof sessionStorage !== 'undefined') {
        try {
          const key = storageKey(nameRef.value)
          sessionStorage.setItem(key, JSON.stringify(credential))
        } catch {
          // sessionStorage quota exceeded — credential won't persist but UI still works
        }
      }
    },
    clear() {
      currentStore.value.value = undefined
      if (typeof sessionStorage !== 'undefined') {
        try {
          const key = storageKey(nameRef.value)
          sessionStorage.removeItem(key)
        } catch {
          // Ignore storage errors
        }
      }
    },
  }
}

/** Synchronous read for tests and SSR-safe contexts. Returns `undefined` outside the browser. */
export function readStoredCredential(specName: string): AuthCredential | undefined {
  if (typeof sessionStorage === 'undefined') return undefined
  const raw = sessionStorage.getItem(storageKey(specName))
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
