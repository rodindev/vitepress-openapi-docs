import { describe, expect, it } from 'vitest'
import { specsVirtualModule, VIRTUAL_SPECS_ID } from './virtual-module'
import type { ParsedSpec } from '../parser/types'

const spec: ParsedSpec = {
  name: 'public',
  title: 'Public',
  version: '1.0.0',
  servers: [],
  operations: [],
  componentSchemas: {},
  securitySchemes: {},
}

function loadPayload(plugin: ReturnType<typeof specsVirtualModule>): string {
  const resolved = (plugin.resolveId as (id: string) => string | null)(VIRTUAL_SPECS_ID)
  return (plugin.load as (id: string) => string | null)(resolved!) as string
}

describe('specsVirtualModule', () => {
  it('resolves only the virtual id and loads only its resolved form', () => {
    const plugin = specsVirtualModule([spec])
    const resolved = (plugin.resolveId as (id: string) => string | null)(VIRTUAL_SPECS_ID)
    expect(resolved).toBe(`\0${VIRTUAL_SPECS_ID}`)
    expect((plugin.resolveId as (id: string) => string | null)('other')).toBeNull()
    expect((plugin.load as (id: string) => string | null)('other')).toBeNull()
  })

  it('exports specs, defaults, prefixes, and theme', () => {
    const payload = loadPayload(
      specsVirtualModule(
        [spec],
        { layout: 'stacked' },
        { public: '/api/public' },
        { methodColors: { get: '#2563eb' } }
      )
    )
    expect(payload).toContain('export default [')
    expect(payload).toContain('export const defaults = {"layout":"stacked"}')
    expect(payload).toContain('export const prefixes = {"public":"/api/public"}')
    expect(payload).toContain('export const theme = {"methodColors":{"get":"#2563eb"}}')
  })

  it('serialises empty objects when defaults and prefixes are omitted', () => {
    const payload = loadPayload(specsVirtualModule([spec]))
    expect(payload).toContain('export const defaults = {}')
    expect(payload).toContain('export const prefixes = {}')
    expect(payload).toContain('export const theme = {}')
  })

  it('produces a module body that evaluates to the supplied data', () => {
    const payload = loadPayload(
      specsVirtualModule([spec], { server: 'https://api.example.com' }, { public: '/v1' })
    )
    const body = payload
      .replace(/export default /, 'exports.default = ')
      .replace(/export const (\w+) = /g, 'exports.$1 = ')
    const exports: Record<string, unknown> = {}
    new Function('exports', body)(exports)
    expect((exports.default as ParsedSpec[])[0]?.name).toBe('public')
    expect(exports.defaults).toEqual({ server: 'https://api.example.com' })
    expect(exports.prefixes).toEqual({ public: '/v1' })
  })
})
