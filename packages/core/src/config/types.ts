export interface OpenApiSpecConfig {
  /** Unique short identifier for this spec. Used in URLs and `<OpenApiEndpoint id="{name}.{operationId}" />`. */
  name: string
  /** Path (relative to project root) or URL to the OpenAPI 3.x document. */
  spec: string
  /** Human-readable label shown in the sidebar group header. Defaults to `name`. */
  label?: string
  /** URL prefix for generated pages, e.g. `/api/public`. Required when more than one spec is configured. */
  prefix?: string
}

export interface OpenApiDocsDefaults {
  /** Sections to render. Defaults to all. */
  show?: (
    | 'summary'
    | 'description'
    | 'params'
    | 'request'
    | 'response'
    | 'auth'
    | 'snippets'
    | 'try'
  )[]
  /** Default auth scheme for all endpoints. */
  auth?: 'none' | 'bearer' | 'apikey' | 'basic' | 'oauth2'
  /** Default server URL override. */
  server?: string
  /** Default header name for apikey schemes. */
  apiKeyHeaderName?: string
  /** When true, request body properties render as individual inputs instead of a JSON textarea. */
  bodyInputs?: boolean
  /** Sections to render collapsed (inside a toggle). */
  collapse?: (
    | 'summary'
    | 'description'
    | 'params'
    | 'request'
    | 'response'
    | 'auth'
    | 'snippets'
    | 'try'
  )[]
  /** Card layout. `columns` splits docs/code into a two-column grid. `stacked` preserves vertical layout. */
  layout?: 'columns' | 'stacked'
}

export interface OpenApiDocsConfig {
  /**
   * One or more OpenAPI specs to render. The single-spec form is shorthand
   * for `{ specs: [spec] }`; multi-spec is the canonical form.
   */
  specs: OpenApiSpecConfig[]
  /**
   * Theme overrides. CSS variable values prefixed with `--vod-` are also
   * acceptable in your VitePress theme stylesheet.
   */
  theme?: {
    methodColors?: Partial<Record<'get' | 'post' | 'put' | 'patch' | 'delete', string>>
  }
  /** Default prop values applied to every `<OpenApiEndpoint>` unless overridden per-instance. */
  defaults?: OpenApiDocsDefaults
}
