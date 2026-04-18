/** Deterministic example value from a JSON Schema node. No randomness. */
export function generateExample(schema: unknown, seen: Set<unknown> = new Set()): unknown {
  if (!schema || typeof schema !== 'object') return undefined
  if (seen.has(schema)) return undefined
  seen.add(schema)

  const s = schema as Record<string, unknown>

  if (s.example !== undefined) return s.example
  if (Array.isArray(s.examples) && s.examples.length > 0) return s.examples[0]
  if (s.default !== undefined) return s.default
  if (Array.isArray(s.enum) && s.enum.length > 0) return s.enum[0]

  if (Array.isArray(s.oneOf) && s.oneOf.length > 0) return generateExample(s.oneOf[0], seen)
  if (Array.isArray(s.anyOf) && s.anyOf.length > 0) return generateExample(s.anyOf[0], seen)
  if (Array.isArray(s.allOf) && s.allOf.length > 0) {
    const merged: Record<string, unknown> = {}
    for (const sub of s.allOf) {
      const partial = generateExample(sub, seen)
      if (partial && typeof partial === 'object' && !Array.isArray(partial)) {
        Object.assign(merged, partial)
      }
    }
    if (Object.keys(merged).length > 0) return merged
  }

  const type = Array.isArray(s.type) ? (s.type as unknown[]).find((t) => t !== 'null') : s.type

  if (type === 'array') {
    const items = s.items
    const example = generateExample(items, seen)
    return example === undefined ? [] : [example]
  }

  if (type === 'object' || (!type && s.properties)) {
    const properties: Record<string, unknown> = {}
    const propSchemas = (s.properties ?? {}) as Record<string, unknown>
    const required = Array.isArray(s.required)
      ? (s.required as unknown[]).filter((v): v is string => typeof v === 'string')
      : undefined
    const keys = required && required.length > 0 ? required : Object.keys(propSchemas).slice(0, 4)
    for (const key of keys) {
      if (!(key in propSchemas)) continue
      const value = generateExample(propSchemas[key], seen)
      if (value !== undefined) properties[key] = value
    }
    return properties
  }

  if (type === 'string') {
    const format = typeof s.format === 'string' ? s.format : ''
    if (format === 'date-time') return '2024-01-15T09:30:00Z'
    if (format === 'date') return '2024-01-15'
    if (format === 'email') return 'user@example.com'
    if (format === 'uuid') return '00000000-0000-4000-8000-000000000000'
    if (format === 'uri' || format === 'url') return 'https://example.com'
    if (format === 'password') return 'password'
    if (format === 'byte') return 'aGVsbG8='
    if (format === 'binary') return ''
    return 'string'
  }

  if (type === 'integer') return 0
  if (type === 'number') return 0
  if (type === 'boolean') return true
  if (type === 'null') return null
  return undefined
}

/** JSON-stringified variant for request body pre-fill. */
export function generateJsonBody(schema: unknown): string | undefined {
  const example = generateExample(schema)
  if (example === undefined) return undefined
  try {
    return JSON.stringify(example, null, 2)
  } catch {
    return undefined
  }
}
