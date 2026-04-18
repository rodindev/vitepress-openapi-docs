import {
  toCurlSnippet,
  toFetch,
  toNode,
  toPython,
  type Snippet,
  type SnippetRequest,
} from 'vue-api-playground'
import type { ParsedOperation } from '../parser/types'

export type { Snippet, SnippetRequest, SnippetLanguage } from 'vue-api-playground'
export { toCurlSnippet, toFetch, toNode, toPython }

/**
 * Produce curl + fetch + python + node snippets for an operation. Auth
 * credentials supplied via `auth` are injected as Authorization headers so
 * the rendered example is immediately copy-pasteable.
 *
 * OpenAPI-aware part (content type inference, auth scheme mapping) stays
 * here; raw code generation is delegated to vue-api-playground.
 */
export function buildSnippets(
  operation: ParsedOperation,
  options: {
    baseUrl?: string
    auth?: {
      scheme: 'bearer' | 'apikey' | 'basic'
      value?: string
      headerName?: string
      apiKeyIn?: 'header' | 'query' | 'cookie'
    }
    exampleBody?: string
  } = {}
): Snippet[] {
  let url = `${(options.baseUrl ?? '').replace(/\/$/, '')}${operation.path}`
  const headers: Record<string, string> = {}
  if (options.auth) {
    const { scheme, value = '<TOKEN>' } = options.auth
    if (scheme === 'bearer') headers['Authorization'] = `Bearer ${value}`
    else if (scheme === 'basic') headers['Authorization'] = `Basic ${value}`
    else if (scheme === 'apikey') {
      const keyName = options.auth.headerName ?? 'X-API-Key'
      const keyIn = options.auth.apiKeyIn ?? 'header'
      if (keyIn === 'query') {
        const sep = url.includes('?') ? '&' : '?'
        url = `${url}${sep}${encodeURIComponent(keyName)}=${encodeURIComponent(value)}`
      } else {
        headers[keyName] = value
      }
    }
  }
  if (operation.requestBody?.content['application/json']) {
    headers['Content-Type'] = 'application/json'
  }

  const req: SnippetRequest = {
    url,
    method: operation.method.toUpperCase(),
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: options.exampleBody,
  }

  return [toCurlSnippet(req), toFetch(req), toPython(req), toNode(req)]
}
