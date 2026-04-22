import { describe, expect, it } from 'vitest'
import { buildRoutes, CHANGELOG_URL_PREFIX, DEFAULT_API_PREFIX, SCHEMA_URL_PREFIX } from './routes'

describe('buildRoutes', () => {
  it('falls back to /api/{name} when no prefix is configured', () => {
    const routes = buildRoutes()
    expect(routes.apiPrefix('public')).toBe('/api/public')
    expect(routes.operationUrl('public', 'users.list')).toBe('/api/public/users.list')
  })

  it('honours a per-spec prefix override', () => {
    const routes = buildRoutes({ public: '/v1' })
    expect(routes.apiPrefix('public')).toBe('/v1')
    expect(routes.operationUrl('public', 'users.list')).toBe('/v1/users.list')
  })

  it('builds schema URLs under a stable prefix', () => {
    const routes = buildRoutes()
    expect(routes.schemaUrl('public', 'User')).toBe('/schemas/public/User')
    expect(routes.schemaUrl('hooks', 'Event')).toBe('/schemas/hooks/Event')
  })

  it('builds changelog URLs under a stable prefix', () => {
    const routes = buildRoutes({ public: '/v1' })
    expect(routes.changelogUrl('public')).toBe('/changelog/public')
  })

  it('prefix constants are exported so build-time callers can sanity-check them', () => {
    expect(SCHEMA_URL_PREFIX).toBe('/schemas')
    expect(CHANGELOG_URL_PREFIX).toBe('/changelog')
    expect(DEFAULT_API_PREFIX).toBe('/api')
  })

  it('prefix lookup is keyed by spec name, not spec order', () => {
    const routes = buildRoutes({ admin: '/admin', public: '/pub' })
    expect(routes.apiPrefix('admin')).toBe('/admin')
    expect(routes.apiPrefix('public')).toBe('/pub')
  })

  it('missing prefix for one spec does not leak into another spec', () => {
    const routes = buildRoutes({ public: '/pub' })
    expect(routes.apiPrefix('admin')).toBe('/api/admin')
  })
})
