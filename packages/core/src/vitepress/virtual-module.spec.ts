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
  const resolved = (plugin.resolveId as (id: string) => string | null)(VIRTUAL_SPECS_ID)!
  return (plugin.load as (id: string) => string | null)(resolved)!
}

describe('specsVirtualModule', () => {
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

  it('defaults the theme export to an empty object', () => {
    const payload = loadPayload(specsVirtualModule([spec]))
    expect(payload).toContain('export const theme = {}')
  })
})
