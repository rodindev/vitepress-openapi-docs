import { describe, expect, it } from 'vitest'
import { buildSidebar } from './sidebar'
import type { ParsedSpec } from '../parser/types'

const op = (id: string, tag: string, summary?: string) => ({
  id,
  operationId: id,
  method: 'get' as const,
  path: `/${id}`,
  summary,
  tags: [tag],
  parameters: [],
  responses: [],
  requestSchemaRefs: {},
  responseSchemaRefs: {},
  defaultServer: '',
  security: [],
  deprecated: false,
})

const single: ParsedSpec = {
  name: 'public',
  title: 'Public',
  version: '1.0.0',
  servers: [],
  operations: [
    op('users.list', 'users', 'List users'),
    op('users.get', 'users'),
    op('ping', 'health'),
  ],
  componentSchemas: {},
  securitySchemes: {},
}

describe('buildSidebar', () => {
  it('returns an empty array for no specs', () => {
    expect(buildSidebar([])).toEqual([])
  })

  it('groups single-spec operations by tag with default /api/{name} prefix', () => {
    const sidebar = buildSidebar([single])
    const tagGroups = sidebar.filter((g) => g.text === 'users' || g.text === 'health')
    expect(tagGroups).toHaveLength(2)
    expect(tagGroups[0]?.items[0]).toEqual({ text: 'List users', link: '/api/public/users.list' })
  })

  it('always appends a Changelog group per spec', () => {
    const sidebar = buildSidebar([single])
    const changelog = sidebar.find((g) => g.text === 'Changelog')
    expect(changelog).toBeDefined()
    expect(changelog?.items[0]).toEqual({ text: 'History', link: '/changelog/public' })
  })

  it('honours custom prefix per spec', () => {
    const sidebar = buildSidebar([single], { prefixes: { public: '/v1' } })
    expect(sidebar[0]?.items[0]).toEqual({ text: 'List users', link: '/v1/users.list' })
  })

  it('wraps each spec in a top-level group when multiple specs are provided', () => {
    const second: ParsedSpec = { ...single, name: 'admin', title: 'Admin' }
    const sidebar = buildSidebar([single, second])
    expect(sidebar).toHaveLength(2)
    expect(sidebar[0]?.text).toBe('Public')
    expect(sidebar[1]?.text).toBe('Admin')
  })

  it('appends a Schemas group when the spec defines component schemas', () => {
    const withSchemas: ParsedSpec = {
      ...single,
      componentSchemas: {
        User: { name: 'User', schema: {} },
        Pet: { name: 'Pet', schema: {} },
      },
    }
    const sidebar = buildSidebar([withSchemas])
    const schemasGroup = sidebar.find((g) => g.text === 'Schemas')
    expect(schemasGroup).toBeDefined()
    expect(schemasGroup?.collapsed).toBe(true)
    expect(schemasGroup?.items.map((i) => 'link' in i && i.link)).toEqual([
      '/schemas/public/Pet',
      '/schemas/public/User',
    ])
  })

  it('omits the Schemas group when no component schemas exist', () => {
    const sidebar = buildSidebar([single])
    expect(sidebar.find((g) => g.text === 'Schemas')).toBeUndefined()
  })
})
