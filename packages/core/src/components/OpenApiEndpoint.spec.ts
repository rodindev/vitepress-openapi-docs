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

const usersSearch: ParsedOperation = {
  id: 'users.search',
  operationId: 'users.search',
  kind: 'path',
  method: 'get',
  path: '/users/search',
  tags: ['users'],
  parameters: [
    { name: 'q', in: 'query', required: false, defaultExample: '' },
    { name: 'limit', in: 'query', required: false, defaultExample: '' },
    { name: 'offset', in: 'query', required: false, defaultExample: '' },
    { name: 'sort', in: 'query', required: false, defaultExample: '' },
    { name: 'order', in: 'query', required: false, defaultExample: '' },
    { name: 'role', in: 'query', required: false, defaultExample: '' },
    { name: 'X-Trace', in: 'header', required: false, defaultExample: '' },
  ],
  responses: [{ status: '200', description: 'ok' }],
  requestSchemaRefs: {},
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
  operations: [usersList, usersDelete, usersCreate, petCreated, usersSearch],
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

  it('renders a Try It header with the spec title and version in columns layout', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.list' },
      global: { provide: registryProvide },
    })
    const header = wrapper.find('.vod-page-aside__header')
    expect(header.exists()).toBe(true)
    expect(header.find('.vod-page-aside__label').text()).toBe('Try It')
    expect(header.find('.vod-page-aside__spec').text()).toBe('Public v1.0.0')
  })

  it('omits the aside header in stacked layout', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.list', layout: 'stacked' },
      global: { provide: registryProvide },
    })
    expect(wrapper.find('.vod-page-aside__header').exists()).toBe(false)
  })

  it('caps the parameters table at 5 rows and shows a toggle for the rest', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.search' },
      global: { provide: registryProvide },
    })
    const rows = wrapper.findAll('.vod-endpoint__params-table tbody tr')
    expect(rows).toHaveLength(5)
    const toggle = wrapper.find('.vod-endpoint__params-toggle')
    expect(toggle.exists()).toBe(true)
    expect(toggle.text()).toBe('Show all 7 parameters')
    expect(toggle.attributes('data-expanded')).toBe('false')
  })

  it('reveals every parameter after clicking the expand toggle', async () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.search' },
      global: { provide: registryProvide },
    })
    await wrapper.find('.vod-endpoint__params-toggle').trigger('click')
    expect(wrapper.findAll('.vod-endpoint__params-table tbody tr')).toHaveLength(7)
    const toggle = wrapper.find('.vod-endpoint__params-toggle')
    expect(toggle.text()).toBe('Show fewer')
    expect(toggle.attributes('data-expanded')).toBe('true')
  })

  it('does not render a parameters toggle when the operation has few params', () => {
    const wrapper = mount(OpenApiEndpoint, {
      props: { id: 'public.users.list' },
      global: { provide: registryProvide },
    })
    expect(wrapper.find('.vod-endpoint__params-toggle').exists()).toBe(false)
  })
})
