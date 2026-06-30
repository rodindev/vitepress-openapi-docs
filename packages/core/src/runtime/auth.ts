import { computed, isRef, ref, watch, type ComputedRef, type Ref } from 'vue'

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

export const authStoresCache = new Map<string, Ref<AuthCredential | undefined>>()

export function getAuthStore(name: string): Ref<AuthCredential | undefined> {
  let store = authStoresCache.get(name)
  if (!store) {
    store = ref<AuthCredential | undefined>(undefined)
    authStoresCache.set(name, store)

    if (typeof sessionStorage !== 'undefined') {
      const key = `${STORAGE_PREFIX}${name}`
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

      watch(store, (value) => {
        try {
          if (value === undefined) {
            sessionStorage.removeItem(key)
          } else {
            sessionStorage.setItem(key, JSON.stringify(value))
          }
        } catch {
          // sessionStorage quota exceeded — credential won't persist but UI still works
        }
      })
    }
  }
  return store
}

/** Per-spec credential cache. SSR-safe (reads in onMounted). Accepts a reactive ref or plain string. */
export function useAuthState(specName: string | Ref<string> | ComputedRef<string>): AuthState {
  const nameRef = isRef(specName) ? specName : ref(specName)
  const currentStore = computed(() => getAuthStore(nameRef.value))

  return {
    credential: computed(() => currentStore.value.value),
    set(credential) {
      currentStore.value.value = { ...credential }
    },
    clear() {
      currentStore.value.value = undefined
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
