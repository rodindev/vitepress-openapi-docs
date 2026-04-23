import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import OpenApiEndpoint from './OpenApiEndpoint.vue'
import { Playground } from 'vue-api-playground'
import { SPEC_REGISTRY_KEY } from '../runtime/registry'
import type { ParsedOperation, ParsedSpec } from '../parser/types'

const usersList: ParsedOperation = {
  id: 'users.list',
  operationId: 'users.list',
  kind: 'path',
  method: 'get',
  path: '/users',
  summary: 'List users',
  description: 'Returns paginated users',
  tags: ['users'],
  parameters: [
    {
      name: 'limit',
      in: 'query',
      required: false,
      description: 'Page size',
      defaultExample: '',
    },
    { name: 'X-Trace', in: 'header', required: false, defaultExample: '' },
  ],
  responses: [{ status: '200', description: 'ok' }],
  requestSchemaRefs: {},
  responseSchemaRefs: { '200': { 'application/json': { name: 'User' } } },
  defaultServer: '',
  security: [],
  deprecated: false,
}

const petCreated: ParsedOperation = {
  id: 'petCreated',
  operationId: 'petCreated',
  kind: 'webhook',
  method: 'post',
  path: 'pet.created',
  summary: 'A new pet was added',
  tags: ['pet'],
  parameters: [],
  responses: [{ status: '200', description: 'ack' }],
  requestSchemaRefs: {},
  responseSchemaRefs: {},
  defaultServer: '',
  security: [],
  deprecated: false,
}

const usersDelete: ParsedOperation = {
  id: 'users.delete',
  operationId: 'users.delete',
  kind: 'path',
  method: 'delete',
  path: '/users/{id}',
  tags: ['users'],
  parameters: [{ name: 'id', in: 'path', required: true, defaultExample: '' }],
  responses: [{ status: '204', description: 'no content' }],
  requestSchemaRefs: {},
  responseSchemaRefs: {},
  defaultServer: '',
  security: [],
  deprecated: true,
}

const usersCreate: ParsedOperation = {
  id: 'users.create',
  operationId: 'users.create',
  kind: 'path',
  method: 'post',
  path: '/users',
  tags: ['users'],
  parameters: [],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', example: 'Jane' },
            email: { type: 'string', format: 'email' },
            age: { type: 'integer', default: 25 },
          },
        },
      },
    },
    jsonFields: [
      { name: 'name', required: true, typeLabel: 'string', example: 'Jane' },
      { name: 'email', required: true, typeLabel: 'string (email)', example: 'user@example.com' },
      { name: 'age', required: false, typeLabel: 'integer', example: '25' },
    ],
  },
  responses: [{ status: '201', description: 'created' }],
  requestSchemaRefs: { 'application/json': { name: 'User' } },
  responseSchemaRefs: {},
  defaultServer: '',
  security: [],
  deprecated: false,
}

const spec: ParsedSpec = {
  name: 'public',
  title: 'Public',
  version: '1.0.0',
  servers: ['https://api.example.com'],
  operations: [usersList, usersDelete, usersCreate, petCreated],
  componentSchemas: {},
  securitySchemes: {},
}

const registryProvide = {
  [SPEC_REGISTRY_KEY as unknown as symbol]: { specs: { public: spec } },
}

describe('OpenApiEndpoint', () => {
  it('renders summary, method and path when found in registry', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.list' },
      global: { provide: registryProvide },
    })
    expect(wrapper.text()).toContain('List users')
    expect(wrapper.text()).toContain('GET')
    expect(wrapper.text()).toContain('/users')
  })

  it('shows a missing-endpoint alert when the id is unknown', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.nope' },
      global: { provide: registryProvide },
    })
    expect(wrapper.find('.vod-endpoint--missing').exists()).toBe(true)
    expect(wrapper.attributes('role')).toBe('alert')
  })

  it('marks deprecated operations with a badge', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.delete' },
      global: { provide: registryProvide },
    })
    expect(wrapper.find('.vod-endpoint--deprecated').exists()).toBe(true)
    expect(wrapper.text()).toContain('deprecated')
  })

  it('honours `show` to suppress sections', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.list', show: ['summary'] },
      global: { provide: registryProvide },
    })
    expect(wrapper.find('.vod-endpoint__description').exists()).toBe(false)
    expect(wrapper.find('.vod-endpoint__params').exists()).toBe(false)
  })

  it('accepts a direct `operation` prop without a registry', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'inline', operation: usersList, servers: ['https://api.example.com'] },
    })
    expect(wrapper.text()).toContain('List users')
    expect(wrapper.find('.vod-endpoint--missing').exists()).toBe(false)
  })

  it('cross-links to the response schema when an operation references one', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.list' },
      global: { provide: registryProvide },
    })
    const link = wrapper.find('.vod-endpoint__returns a.vod-endpoint__type-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/schemas/public/User')
    expect(link.text()).toBe('User')
  })

  it('cross-links to the request body schema when present', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.create' },
      global: { provide: registryProvide },
    })
    const link = wrapper.find('.vod-endpoint__accepts a.vod-endpoint__type-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/schemas/public/User')
  })

  it('marks webhook operations with a webhook chip and neutral method tint', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.petCreated' },
      global: { provide: registryProvide },
    })
    const chips = wrapper.findAll('.vod-endpoint__title .vod-chip')
    expect(chips.some((c) => c.text() === 'webhook')).toBe(true)
    expect(wrapper.find('.vod-endpoint__method--webhook').exists()).toBe(true)
  })

  it('does not show the webhook chip on regular path operations', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.list' },
      global: { provide: registryProvide },
    })
    const chips = wrapper.findAll('.vod-endpoint__title .vod-chip')
    expect(chips.some((c) => c.text() === 'webhook')).toBe(false)
    expect(wrapper.find('.vod-endpoint__method--webhook').exists()).toBe(false)
  })

  it('passes body JSON and no body fields to Playground by default', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.create' },
      global: { provide: registryProvide },
    })
    const playground = wrapper.findComponent(Playground)
    expect(playground.props('body')).toContain('"name"')
    const data = playground.props('data') as { name: string; type?: string }[]
    expect(data.every((d) => d.type === 'path' || d.type === 'query')).toBe(true)
  })

  it('decomposes body schema into data items when bodyInputs is true', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.create', bodyInputs: true },
      global: { provide: registryProvide },
    })
    const playground = wrapper.findComponent(Playground)
    expect(playground.props('body')).toBeUndefined()
    const data = playground.props('data') as { name: string; value: string; type?: string }[]
    const bodyItems = data.filter((d) => !d.type)
    expect(bodyItems.map((d) => d.name)).toEqual(['name', 'email', 'age'])
    expect(bodyItems[0].value).toBe('Jane')
    expect(bodyItems[1].value).toBe('user@example.com')
    expect(bodyItems[2].value).toBe('25')
  })

  it('does not break when bodyInputs is true on an operation without requestBody', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.list', bodyInputs: true },
      global: { provide: registryProvide },
    })
    const playground = wrapper.findComponent(Playground)
    const data = playground.props('data') as { name: string; type?: string }[]
    expect(data.length).toBe(1)
    expect(data[0].name).toBe('limit')
    expect(data[0].type).toBe('query')
  })

  it('places required body fields before optional ones when bodyInputs is true', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.create', bodyInputs: true },
      global: { provide: registryProvide },
    })
    const playground = wrapper.findComponent(Playground)
    const data = playground.props('data') as { name: string; type?: string }[]
    const bodyItems = data.filter((d) => !d.type)
    expect(bodyItems[0].name).toBe('name')
    expect(bodyItems[1].name).toBe('email')
    expect(bodyItems[2].name).toBe('age')
  })
})
