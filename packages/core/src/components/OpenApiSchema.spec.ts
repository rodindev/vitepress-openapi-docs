import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import OpenApiSchema from './OpenApiSchema.vue'
import { SPEC_REGISTRY_KEY } from '../runtime/registry'
import type { ParsedSchema, ParsedSpec } from '../parser/types'

const userSchema: ParsedSchema = {
  name: 'User',
  description: 'A registered user account.',
  schema: {},
  typeLabel: 'object',
  properties: [
    {
      name: 'id',
      required: true,
      typeLabel: 'integer (int64)',
      description: 'Primary key',
      example: '0',
    },
    { name: 'email', required: true, typeLabel: 'string (email)', example: 'user@example.com' },
    { name: 'manager', required: false, typeLabel: 'User', refTarget: 'User', example: '' },
    { name: 'pets', required: false, typeLabel: 'Pet[]', refTarget: 'Pet', example: '[{}]' },
  ],
}

const petSchema: ParsedSchema = {
  name: 'Pet',
  schema: {},
  typeLabel: 'object',
  properties: [{ name: 'id', required: false, typeLabel: 'integer', example: '0' }],
}

const spec: ParsedSpec = {
  name: 'public',
  title: 'Public',
  version: '1.0.0',
  servers: [],
  operations: [],
  componentSchemas: { User: userSchema, Pet: petSchema },
  securitySchemes: {},
}

const provide = { [SPEC_REGISTRY_KEY as unknown as symbol]: { specs: { public: spec } } }

describe('OpenApiSchema', () => {
  it('renders the schema name, type label, and description', () => {
    const wrapper = mount(OpenApiSchema, {
      props: { name: 'User', specName: 'public' },
      global: { provide },
    })
    expect(wrapper.text()).toContain('User')
    expect(wrapper.text()).toContain('object')
    expect(wrapper.text()).toContain('A registered user account.')
  })

  it('lists every property with a type column', () => {
    const wrapper = mount(OpenApiSchema, {
      props: { name: 'User', specName: 'public' },
      global: { provide },
    })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(4)
    expect(rows[0]?.text()).toContain('id')
    expect(rows[0]?.text()).toContain('integer (int64)')
  })

  it('marks required fields explicitly', () => {
    const wrapper = mount(OpenApiSchema, {
      props: { name: 'User', specName: 'public' },
      global: { provide },
    })
    const requiredBadges = wrapper.findAll('.vod-schema__table .vod-chip--danger')
    expect(requiredBadges).toHaveLength(2)
  })

  it('renders $ref properties as links to the referenced schema page', () => {
    const wrapper = mount(OpenApiSchema, {
      props: { name: 'User', specName: 'public' },
      global: { provide },
    })
    const links = wrapper.findAll('a.vod-schema__type-token')
    const hrefs = links.map((l) => l.attributes('href'))
    expect(hrefs).toContain('/schemas/public/User')
    expect(hrefs).toContain('/schemas/public/Pet')
  })

  it('shows an alert when the schema is unknown', () => {
    const wrapper = mount(OpenApiSchema, {
      props: { name: 'Missing', specName: 'public' },
      global: { provide },
    })
    expect(wrapper.find('.vod-schema--missing').exists()).toBe(true)
    expect(wrapper.attributes('role')).toBe('alert')
  })

  it('falls back to the only registered spec when specName is omitted', () => {
    const wrapper = mount(OpenApiSchema, {
      props: { name: 'Pet' },
      global: { provide },
    })
    expect(wrapper.find('.vod-schema--missing').exists()).toBe(false)
    expect(wrapper.text()).toContain('Pet')
  })
})
