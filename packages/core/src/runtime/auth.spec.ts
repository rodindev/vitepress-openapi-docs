import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { readStoredCredential, useAuthState, type AuthState } from './auth'

function withAuth(specName: string, callback: (state: AuthState) => void) {
  const Harness = defineComponent({
    setup() {
      const state = useAuthState(specName)
      callback(state)
      return () => h('div')
    },
  })
  return mount(Harness)
}

describe('useAuthState', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('starts with no credential when storage is empty', async () => {
    let captured: AuthState | undefined
    withAuth('public', (s) => {
      captured = s
    })
    await nextTick()
    expect(captured?.credential.value).toBeUndefined()
  })

  it('persists a set credential to sessionStorage under vod:auth:{specName}', async () => {
    let captured: AuthState | undefined
    withAuth('public', (s) => {
      captured = s
    })
    captured?.set({ scheme: 'bearer', value: 'TOKEN123' })
    await nextTick()
    expect(JSON.parse(sessionStorage.getItem('vod:auth:public')!)).toEqual({
      scheme: 'bearer',
      value: 'TOKEN123',
    })
  })

  it('rehydrates a previously stored credential on mount', async () => {
    sessionStorage.setItem(
      'vod:auth:admin',
      JSON.stringify({ scheme: 'apikey', value: 'k_42', headerName: 'X-Foo' })
    )
    let captured: AuthState | undefined
    withAuth('admin', (s) => {
      captured = s
    })
    await nextTick()
    expect(captured?.credential.value).toEqual({
      scheme: 'apikey',
      value: 'k_42',
      headerName: 'X-Foo',
    })
  })

  it('clear() removes the credential from storage and memory', async () => {
    sessionStorage.setItem('vod:auth:public', JSON.stringify({ scheme: 'bearer', value: 'T' }))
    let captured: AuthState | undefined
    withAuth('public', (s) => {
      captured = s
    })
    await nextTick()
    captured?.clear()
    await nextTick()
    expect(captured?.credential.value).toBeUndefined()
    expect(sessionStorage.getItem('vod:auth:public')).toBeNull()
  })

  it('keeps credentials isolated between specs', async () => {
    let publicState: AuthState | undefined
    let adminState: AuthState | undefined
    withAuth('public', (s) => {
      publicState = s
    })
    withAuth('admin', (s) => {
      adminState = s
    })
    publicState?.set({ scheme: 'bearer', value: 'PUBLIC' })
    adminState?.set({ scheme: 'bearer', value: 'ADMIN' })
    await nextTick()
    expect(readStoredCredential('public')?.value).toBe('PUBLIC')
    expect(readStoredCredential('admin')?.value).toBe('ADMIN')
  })

  it('discards a malformed value in storage instead of throwing', async () => {
    sessionStorage.setItem('vod:auth:public', '{"scheme":"nope"}')
    let captured: AuthState | undefined
    withAuth('public', (s) => {
      captured = s
    })
    await nextTick()
    expect(captured?.credential.value).toBeUndefined()
  })

  it('survives a remount in the same session (simulating SPA navigation)', async () => {
    let firstState: AuthState | undefined
    const first = withAuth('public', (s) => {
      firstState = s
    })
    firstState?.set({ scheme: 'bearer', value: 'KEEP_ME' })
    await nextTick()
    first.unmount()

    let secondState: AuthState | undefined
    withAuth('public', (s) => {
      secondState = s
    })
    await nextTick()
    expect(secondState?.credential.value?.value).toBe('KEEP_ME')
  })
})
