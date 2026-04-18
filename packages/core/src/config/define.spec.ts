import { describe, expect, it } from 'vitest'
import { defineOpenApiDocs } from './define'

describe('defineOpenApiDocs', () => {
  it('returns the config unchanged (identity helper for type inference)', () => {
    const config = defineOpenApiDocs({
      specs: [{ name: 'public', spec: './openapi/public.yaml' }],
    })
    expect(config.specs).toHaveLength(1)
    expect(config.specs[0]?.name).toBe('public')
  })
})
