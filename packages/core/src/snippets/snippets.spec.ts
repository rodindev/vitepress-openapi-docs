import { describe, expect, it } from 'vitest'
import { buildSnippets } from './index'
import type { ParsedOperation } from '../parser/types'

const op: ParsedOperation = {
  id: 'users.list',
  operationId: 'users.list',
  method: 'get',
  path: '/users',
  tags: [],
  parameters: [],
  responses: [],
  defaultServer: '',
  security: [],
  deprecated: false,
}

describe('buildSnippets', () => {
  it('produces exactly 3 snippets: curl + fetch + python', () => {
    const snippets = buildSnippets(op, { baseUrl: 'https://api.example.com' })
    expect(snippets.map((s) => s.language)).toEqual(['curl', 'fetch', 'python'])
    for (const s of snippets) {
      expect(s.code.length).toBeGreaterThan(0)
    }
  })

  it('composes the full URL from baseUrl + operation path', () => {
    const snippets = buildSnippets(op, { baseUrl: 'https://api.example.com/' })
    for (const s of snippets) {
      expect(s.code).toContain('https://api.example.com/users')
    }
  })

  it('injects a bearer token as an Authorization header across every language', () => {
    const snippets = buildSnippets(op, {
      baseUrl: 'https://api.example.com',
      auth: { scheme: 'bearer', value: 'TOKEN123' },
    })
    for (const snippet of snippets) {
      expect(snippet.code).toContain('Bearer TOKEN123')
    }
  })

  it('injects an API key under the configured header name', () => {
    const snippets = buildSnippets(op, {
      auth: { scheme: 'apikey', value: 'k_123', headerName: 'X-Stripe-Key' },
    })
    for (const snippet of snippets) {
      expect(snippet.code).toContain('X-Stripe-Key')
      expect(snippet.code).toContain('k_123')
    }
  })

  it('uses a placeholder token when the auth value is not yet set', () => {
    const snippets = buildSnippets(op, { auth: { scheme: 'bearer' } })
    for (const snippet of snippets) {
      expect(snippet.code).toContain('Bearer <TOKEN>')
    }
  })

  it('base64-encodes basic credentials across every language', () => {
    const snippets = buildSnippets(op, {
      baseUrl: 'https://api.example.com',
      auth: { scheme: 'basic', value: 'alice:s3cret' },
    })
    const encoded = btoa('alice:s3cret')
    for (const snippet of snippets) {
      expect(snippet.code).toContain(`Basic ${encoded}`)
      expect(snippet.code).not.toContain('alice:s3cret')
    }
  })

  it('emits a readable basic placeholder when the value is not yet set', () => {
    const snippets = buildSnippets(op, { auth: { scheme: 'basic' } })
    for (const snippet of snippets) {
      expect(snippet.code).toContain('Basic <BASE64(USERNAME:PASSWORD)>')
      expect(snippet.code).not.toContain('<TOKEN>')
    }
  })

  it('renders an apikey in:cookie as a Cookie header', () => {
    const snippets = buildSnippets(op, {
      baseUrl: 'https://api.example.com',
      auth: { scheme: 'apikey', value: 'abc123', headerName: 'session_id', apiKeyIn: 'cookie' },
    })
    for (const snippet of snippets) {
      expect(snippet.code).toContain('Cookie')
      expect(snippet.code).toContain('session_id=abc123')
    }
  })

  it('adds Content-Type: application/json when the operation has a JSON body', () => {
    const postOp: ParsedOperation = {
      ...op,
      method: 'post',
      requestBody: { required: true, content: { 'application/json': { schema: {} } } },
    }
    const snippets = buildSnippets(postOp, { baseUrl: 'https://api.example.com' })
    for (const snippet of snippets) {
      expect(snippet.code).toContain('application/json')
    }
  })

  it('omits auth headers entirely when no auth is requested', () => {
    const snippets = buildSnippets(op, { baseUrl: 'https://api.example.com' })
    for (const snippet of snippets) {
      expect(snippet.code).not.toContain('Authorization')
      expect(snippet.code).not.toContain('X-API-Key')
    }
  })

  it('places api key in query string when apiKeyIn is query', () => {
    const snippets = buildSnippets(op, {
      baseUrl: 'https://api.example.com',
      auth: { scheme: 'apikey', value: 'k_123', headerName: 'api_key', apiKeyIn: 'query' },
    })
    for (const snippet of snippets) {
      expect(snippet.code).toContain('api_key=k_123')
      expect(snippet.code).not.toContain('api_key: ')
    }
  })

  it('places api key in header by default when apiKeyIn is not specified', () => {
    const snippets = buildSnippets(op, {
      auth: { scheme: 'apikey', value: 'k_123', headerName: 'X-Key' },
    })
    for (const snippet of snippets) {
      expect(snippet.code).toContain('X-Key')
    }
  })
})
