import { describe, expect, it } from 'vitest'
import { generateExample, generateJsonBody } from './example'

describe('generateExample', () => {
  it('returns undefined for non-schema inputs', () => {
    expect(generateExample(undefined)).toBeUndefined()
    expect(generateExample(null)).toBeUndefined()
    expect(generateExample(42)).toBeUndefined()
  })

  it('honours explicit example over inferred type', () => {
    expect(generateExample({ type: 'string', example: 'hello' })).toBe('hello')
  })

  it('prefers examples[0] when example is absent (OpenAPI 3.1 form)', () => {
    expect(generateExample({ type: 'integer', examples: [42, 99] })).toBe(42)
  })

  it('falls back to default then enum[0]', () => {
    expect(generateExample({ type: 'string', default: 'open' })).toBe('open')
    expect(generateExample({ type: 'string', enum: ['available', 'pending'] })).toBe('available')
  })

  it('derives format-aware strings', () => {
    expect(generateExample({ type: 'string', format: 'date-time' })).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(generateExample({ type: 'string', format: 'email' })).toBe('user@example.com')
    expect(generateExample({ type: 'string', format: 'uuid' })).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
    expect(generateExample({ type: 'string', format: 'uri' })).toMatch(/^https:\/\//)
  })

  it('derives primitives for integer / number / boolean', () => {
    expect(generateExample({ type: 'integer' })).toBe(0)
    expect(generateExample({ type: 'number' })).toBe(0)
    expect(generateExample({ type: 'boolean' })).toBe(true)
  })

  it('handles nullable 3.1 type arrays by picking the non-null member', () => {
    expect(generateExample({ type: ['string', 'null'] })).toBe('string')
  })

  it('walks objects using required keys first, then the first four properties', () => {
    const schema = {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        extra: { type: 'boolean' },
      },
    }
    expect(generateExample(schema)).toEqual({ id: 0 })

    const noRequired = {
      type: 'object',
      properties: {
        a: { type: 'string' },
        b: { type: 'integer' },
      },
    }
    expect(generateExample(noRequired)).toEqual({ a: 'string', b: 0 })
  })

  it('generates a single-item array from items schema', () => {
    expect(generateExample({ type: 'array', items: { type: 'string' } })).toEqual(['string'])
    expect(generateExample({ type: 'array', items: { type: 'integer' } })).toEqual([0])
  })

  it('unwraps oneOf / anyOf by taking the first branch', () => {
    expect(generateExample({ oneOf: [{ type: 'string' }, { type: 'integer' }] })).toBe('string')
    expect(generateExample({ anyOf: [{ type: 'integer' }, { type: 'string' }] })).toBe(0)
  })

  it('merges allOf members into a single object', () => {
    const schema = {
      allOf: [
        { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
        { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
      ],
    }
    expect(generateExample(schema)).toEqual({ id: 0, name: 'string' })
  })

  it('guards against recursive schemas', () => {
    const schema: Record<string, unknown> = { type: 'object', properties: {} }
    const props = schema.properties as Record<string, unknown>
    props.self = schema
    schema.required = ['self']
    expect(() => generateExample(schema)).not.toThrow()
  })
})

describe('generateJsonBody', () => {
  it('returns a pretty-printed JSON string', () => {
    const body = generateJsonBody({
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'integer' } },
    })
    expect(body).toBe('{\n  "id": 0\n}')
  })

  it('returns undefined when the schema yields no value', () => {
    expect(generateJsonBody(undefined)).toBeUndefined()
    expect(generateJsonBody({})).toBeUndefined()
  })
})
