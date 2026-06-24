import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EndpointTryPanel from './EndpointTryPanel.vue'
import { useAuthState, authStoresCache } from '../runtime/auth'
import type { ParsedOperation } from '../parser/types'
import EndpointPlayground from './EndpointPlayground.vue'

const dummyOp: ParsedOperation = {
  id: 'test.op',
  operationId: 'testOp',
  kind: 'path',
  method: 'get',
  path: '/test',
  summary: 'Test',
  tags: [],
  parameters: [],
  responses: [],
  requestSchemaRefs: {},
  responseSchemaRefs: {},
  defaultServer: '',
  security: [],
  deprecated: false,
}

describe('EndpointTryPanel - Authorization Injection', () => {
  beforeEach(() => {
    sessionStorage.clear()
    authStoresCache.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
    authStoresCache.clear()
  })

  it('injects bearer token correctly', async () => {
    const authState = useAuthState('test-spec')
    authState.set({ scheme: 'bearer', value: 'my-bearer-token' })
    await nextTick()

    const wrapper = mount(EndpointTryPanel, {
      props: {
        op: dummyOp,
        specName: 'test-spec',
        specVersionLabel: 'v1',
        serverList: ['http://api.example.com'],
        scheme: 'bearer',
        bodyInputs: false,
        inline: false,
        showSnippets: false,
        showAuth: true,
        showTry: true,
      },
    })

    const playground = wrapper.findComponent(EndpointPlayground)
    expect(playground.exists()).toBe(true)

    const envelope = { url: 'http://api.example.com/test', init: { headers: {} } }
    playground.vm.$emit('before-send', envelope)

    expect(envelope.init.headers).toEqual({
      Authorization: 'Bearer my-bearer-token',
    })
  })

  it('injects oauth2 token correctly', async () => {
    const authState = useAuthState('test-spec')
    authState.set({ scheme: 'oauth2', value: 'oauth-token' })
    await nextTick()

    const wrapper = mount(EndpointTryPanel, {
      props: {
        op: dummyOp,
        specName: 'test-spec',
        specVersionLabel: 'v1',
        serverList: ['http://api.example.com'],
        scheme: 'oauth2',
        bodyInputs: false,
        inline: false,
        showSnippets: false,
        showAuth: true,
        showTry: true,
      },
    })

    const playground = wrapper.findComponent(EndpointPlayground)
    const envelope = { url: 'http://api.example.com/test', init: { headers: {} } }
    playground.vm.$emit('before-send', envelope)

    expect(envelope.init.headers).toEqual({
      Authorization: 'Bearer oauth-token',
    })
  })

  it('injects basic auth correctly', async () => {
    const authState = useAuthState('test-spec')
    authState.set({ scheme: 'basic', value: 'user:pass' })
    await nextTick()

    const wrapper = mount(EndpointTryPanel, {
      props: {
        op: dummyOp,
        specName: 'test-spec',
        specVersionLabel: 'v1',
        serverList: ['http://api.example.com'],
        scheme: 'basic',
        bodyInputs: false,
        inline: false,
        showSnippets: false,
        showAuth: true,
        showTry: true,
      },
    })

    const playground = wrapper.findComponent(EndpointPlayground)
    const envelope = { url: 'http://api.example.com/test', init: { headers: {} } }
    playground.vm.$emit('before-send', envelope)

    expect(envelope.init.headers).toEqual({
      Authorization: `Basic ${btoa('user:pass')}`,
    })
  })

  it('injects apikey as header correctly', async () => {
    const authState = useAuthState('test-spec')
    authState.set({
      scheme: 'apikey',
      value: 'my-api-key',
      headerName: 'X-API-Key',
      apiKeyIn: 'header',
    })
    await nextTick()

    const wrapper = mount(EndpointTryPanel, {
      props: {
        op: dummyOp,
        specName: 'test-spec',
        specVersionLabel: 'v1',
        serverList: ['http://api.example.com'],
        scheme: 'apikey',
        headerName: 'X-API-Key',
        apiKeyIn: 'header',
        bodyInputs: false,
        inline: false,
        showSnippets: false,
        showAuth: true,
        showTry: true,
      },
    })

    const playground = wrapper.findComponent(EndpointPlayground)
    const envelope = { url: 'http://api.example.com/test', init: { headers: {} } }
    playground.vm.$emit('before-send', envelope)

    expect(envelope.init.headers).toEqual({
      'X-API-Key': 'my-api-key',
    })
  })

  it('injects apikey as query parameter correctly', async () => {
    const authState = useAuthState('test-spec')
    authState.set({
      scheme: 'apikey',
      value: 'my-api-key',
      headerName: 'api_key',
      apiKeyIn: 'query',
    })
    await nextTick()

    const wrapper = mount(EndpointTryPanel, {
      props: {
        op: dummyOp,
        specName: 'test-spec',
        specVersionLabel: 'v1',
        serverList: ['http://api.example.com'],
        scheme: 'apikey',
        headerName: 'api_key',
        apiKeyIn: 'query',
        bodyInputs: false,
        inline: false,
        showSnippets: false,
        showAuth: true,
        showTry: true,
      },
    })

    const playground = wrapper.findComponent(EndpointPlayground)
    const envelope = { url: 'http://api.example.com/test', init: { headers: {} } }
    playground.vm.$emit('before-send', envelope)

    expect(envelope.url).toBe('http://api.example.com/test?api_key=my-api-key')
  })

  it('injects apikey as query parameter with existing params correctly', async () => {
    const authState = useAuthState('test-spec')
    authState.set({
      scheme: 'apikey',
      value: 'my-api-key',
      headerName: 'api_key',
      apiKeyIn: 'query',
    })
    await nextTick()

    const wrapper = mount(EndpointTryPanel, {
      props: {
        op: dummyOp,
        specName: 'test-spec',
        specVersionLabel: 'v1',
        serverList: ['http://api.example.com'],
        scheme: 'apikey',
        headerName: 'api_key',
        apiKeyIn: 'query',
        bodyInputs: false,
        inline: false,
        showSnippets: false,
        showAuth: true,
        showTry: true,
      },
    })

    const playground = wrapper.findComponent(EndpointPlayground)
    const envelope = { url: 'http://api.example.com/test?foo=bar', init: { headers: {} } }
    playground.vm.$emit('before-send', envelope)

    expect(envelope.url).toBe('http://api.example.com/test?foo=bar&api_key=my-api-key')
  })

  it('does not inject apikey for cookie type in browser requests', async () => {
    const authState = useAuthState('test-spec')
    authState.set({
      scheme: 'apikey',
      value: 'my-cookie-val',
      headerName: 'cookie_name',
      apiKeyIn: 'cookie',
    })
    await nextTick()

    const wrapper = mount(EndpointTryPanel, {
      props: {
        op: dummyOp,
        specName: 'test-spec',
        specVersionLabel: 'v1',
        serverList: ['http://api.example.com'],
        scheme: 'apikey',
        headerName: 'cookie_name',
        apiKeyIn: 'cookie',
        bodyInputs: false,
        inline: false,
        showSnippets: false,
        showAuth: true,
        showTry: true,
      },
    })

    const playground = wrapper.findComponent(EndpointPlayground)
    const envelope = { url: 'http://api.example.com/test', init: { headers: {} } }
    playground.vm.$emit('before-send', envelope)

    expect(envelope.init.headers).toEqual({})
    expect(envelope.url).toBe('http://api.example.com/test')
  })
})
