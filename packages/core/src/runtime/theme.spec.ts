import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from 'vue'
import { enhanceAppWithOpenApi } from './theme'
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

afterEach(() => {
  document.documentElement.removeAttribute('style')
})

describe('enhanceAppWithOpenApi', () => {
  it('registers every public component, including SearchTrigger', () => {
    const app = createApp({})
    enhanceAppWithOpenApi({ app, specs: [spec] })
    for (const name of [
      'OpenApiEndpoint',
      'OpenApiSpec',
      'OpenApiSchema',
      'OpenApiChangelog',
      'AuthControls',
      'SdkSnippets',
      'OperationJumper',
      'ResponseExamples',
      'SearchTrigger',
    ]) {
      expect(app.component(name)).toBeTruthy()
    }
  })

  it('applies configured method colours as CSS custom properties on the root', () => {
    const app = createApp({})
    enhanceAppWithOpenApi({
      app,
      specs: [spec],
      theme: { methodColors: { get: '#2563eb', delete: '#dc2626' } },
    })
    const style = document.documentElement.style
    expect(style.getPropertyValue('--vod-method-get')).toBe('#2563eb')
    expect(style.getPropertyValue('--vod-method-get-text')).toBe('#2563eb')
    expect(style.getPropertyValue('--vod-method-delete')).toBe('#dc2626')
  })

  it('leaves the root untouched when no method colours are configured', () => {
    const app = createApp({})
    enhanceAppWithOpenApi({ app, specs: [spec] })
    expect(document.documentElement.style.getPropertyValue('--vod-method-get')).toBe('')
  })
})
