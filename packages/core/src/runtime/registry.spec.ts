import { describe, expect, it } from 'vitest'
import { resolveOperation, type SpecRegistry } from './registry'
import type { ParsedOperation, ParsedSpec } from '../parser/types'

const op = (id: string): ParsedOperation => ({
  id,
  operationId: id,
  method: 'get',
  path: `/${id}`,
  tags: [],
  parameters: [],
  responses: [],
  defaultServer: '',
  security: [],
  deprecated: false,
})

const publicSpec: ParsedSpec = {
  name: 'public',
  title: 'Public',
  version: '1.0.0',
  servers: [],
  operations: [op('users.list'), op('users.get')],
  securitySchemes: {},
}

const adminSpec: ParsedSpec = {
  name: 'admin',
  title: 'Admin',
  version: '1.0.0',
  servers: [],
  operations: [op('users.list'), op('roles.list')],
  securitySchemes: {},
}

const registry: SpecRegistry = { specs: { public: publicSpec, admin: adminSpec } }

describe('resolveOperation (multi-spec)', () => {
  it('disambiguates qualified ids against the right spec', () => {
    const hit = resolveOperation(registry, 'admin.roles.list')
    expect(hit?.spec.name).toBe('admin')
    expect(hit?.operation.id).toBe('roles.list')
  })

  it('prefers the qualified spec when an id exists in multiple specs', () => {
    const hit = resolveOperation(registry, 'admin.users.list')
    expect(hit?.spec.name).toBe('admin')
  })

  it('falls back to bare lookup when the prefix is actually part of the operationId', () => {
    const hit = resolveOperation(registry, 'users.list')
    expect(hit).not.toBeNull()
    expect(hit?.operation.id).toBe('users.list')
  })

  it('returns the first matching spec for an unqualified id that hits multiple specs', () => {
    const hit = resolveOperation(registry, 'users.list')
    expect(hit?.spec.name).toBe('public')
  })

  it('returns null for an id that matches no spec', () => {
    expect(resolveOperation(registry, 'missing.operation')).toBeNull()
  })

  it('returns null when the spec prefix is recognised but the operation is not', () => {
    expect(resolveOperation(registry, 'public.does-not-exist')).toBeNull()
  })
})
