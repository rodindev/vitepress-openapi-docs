import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AuthControls from './AuthControls.vue'

describe('AuthControls', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => sessionStorage.clear())

  it('persists the entered credential to sessionStorage on blur', async () => {
    const wrapper = mount(AuthControls, { props: { specName: 'public', scheme: 'bearer' } })
    const input = wrapper.find('input')
    await input.setValue('SECRET_TOKEN')
    await input.trigger('blur')
    expect(JSON.parse(sessionStorage.getItem('vod:auth:public')!)).toMatchObject({
      scheme: 'bearer',
      value: 'SECRET_TOKEN',
    })
  })

  it('uses the configured header name for apikey schemes', () => {
    const wrapper = mount(AuthControls, {
      props: { specName: 'stripe', scheme: 'apikey', headerName: 'Stripe-Account' },
    })
    expect(wrapper.text()).toContain('Stripe-Account')
  })

  it('clears stored credentials when the button is clicked', async () => {
    sessionStorage.setItem('vod:auth:public', JSON.stringify({ scheme: 'bearer', value: 'X' }))
    const wrapper = mount(AuthControls, { props: { specName: 'public', scheme: 'bearer' } })
    await nextTick()
    await wrapper.find('button.vod-auth__clear').trigger('click')
    expect(sessionStorage.getItem('vod:auth:public')).toBeNull()
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('shows a saved-status indicator only when a credential is stored', async () => {
    const wrapper = mount(AuthControls, { props: { specName: 'public', scheme: 'bearer' } })
    expect(wrapper.find('.vod-auth__status').exists()).toBe(false)
    await wrapper.find('input').setValue('TOKEN')
    await wrapper.find('input').trigger('blur')
    expect(wrapper.find('.vod-auth__status').exists()).toBe(true)
  })

  it('hides the input entirely when scheme="none"', () => {
    const wrapper = mount(AuthControls, { props: { specName: 'public', scheme: 'none' } })
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('renders oauth2 flow details with authorization URL and scopes', () => {
    const wrapper = mount(AuthControls, {
      props: {
        specName: 'public',
        scheme: 'oauth2',
        oauth2Flow: {
          authorizationUrl: 'https://auth.example.com/authorize',
          tokenUrl: 'https://auth.example.com/token',
          scopes: { 'read:users': 'Read user data', 'write:users': 'Modify user data' },
        },
      },
    })
    expect(wrapper.find('.vod-auth__oauth2').exists()).toBe(true)
    expect(wrapper.find('a.vod-auth__link').attributes('href')).toBe(
      'https://auth.example.com/authorize'
    )
    expect(wrapper.text()).toContain('https://auth.example.com/token')
    expect(wrapper.text()).toContain('Scopes (2)')
    expect(wrapper.find('input').exists()).toBe(true)
    const labels = wrapper.findAll('.vod-auth__label')
    expect(labels.some((l) => l.text().includes('Paste OAuth2 token'))).toBe(true)
  })

  it('persists oauth2 token to sessionStorage as oauth2 scheme', async () => {
    const wrapper = mount(AuthControls, {
      props: { specName: 'oauth-api', scheme: 'oauth2' },
    })
    const input = wrapper.find('input')
    await input.setValue('OAUTH_TOKEN_123')
    await input.trigger('blur')
    const stored = JSON.parse(sessionStorage.getItem('vod:auth:oauth-api')!)
    expect(stored).toMatchObject({ scheme: 'oauth2', value: 'OAUTH_TOKEN_123' })
  })
})
