export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace'

export interface ParsedParameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required: boolean
  description?: string
  schema?: unknown
  example?: unknown
}

export interface ParsedRequestBody {
  required: boolean
  description?: string
  /** content-type → media type object (schema, example) */
  content: Record<string, { schema?: unknown; example?: unknown }>
}

export interface ParsedResponse {
  status: string
  description?: string
  content?: Record<string, { schema?: unknown; example?: unknown }>
}

export interface ParsedSchemaRef {
  /** Short name from `#/components/schemas/{name}`, e.g. `User`. */
  name: string
}

export type OperationKind = 'path' | 'webhook'

export interface ParsedOperation {
  /** Stable identifier for cross-references. Falls back to `${method} ${path}` slug if `operationId` is missing. */
  id: string
  /** Original `operationId` from the spec, if present. */
  operationId?: string
  /**
   * Where the operation came from:
   *   - `path` — an entry under `paths.*` (classic REST route)
   *   - `webhook` — OpenAPI 3.1 top-level `webhooks.*` entry (callback the API sends out)
   */
  kind: OperationKind
  method: HttpMethod
  path: string
  summary?: string
  description?: string
  tags: string[]
  parameters: ParsedParameter[]
  requestBody?: ParsedRequestBody
  responses: ParsedResponse[]
  /**
   * Component-schema $refs the request body points at, keyed by content type.
   * Captured before dereferencing so cross-link UI can show the type name.
   */
  requestSchemaRefs: Record<string, ParsedSchemaRef>
  /**
   * Component-schema $refs each response points at: status → contentType → ref.
   * Captured before dereferencing.
   */
  responseSchemaRefs: Record<string, Record<string, ParsedSchemaRef>>
  /** First server URL from spec. Empty string when none declared. */
  defaultServer: string
  /** Security requirement names referenced by this operation, flattened. */
  security: string[]
  deprecated: boolean
}

export interface ParsedSchema {
  /** Component name (e.g. `User`). */
  name: string
  /** Optional description from the schema definition. */
  description?: string
  /** Raw (post-dereference) schema object. Components reference resolved siblings inline. */
  schema: unknown
}

export interface ParsedOAuth2Flow {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
}

export interface ParsedSecurityScheme {
  /** Resolved auth scheme type used by AuthControls. */
  type: 'bearer' | 'apikey' | 'basic' | 'oauth2' | 'unknown'
  /** Original OpenAPI `type` field. */
  rawType: string
  /** Header/query/cookie name for `apiKey` schemes. */
  name?: string
  /** Where the API key is sent: `header`, `query`, or `cookie`. */
  in?: string
  /** OAuth2 flows, keyed by flow type. */
  oauth2Flows?: Record<string, ParsedOAuth2Flow>
}

export interface ParsedSpec {
  /** Spec config name (the `name` field from `OpenApiSpecConfig`). */
  name: string
  title: string
  version: string
  description?: string
  /** Spec description rendered as HTML (from CommonMark source). */
  descriptionHtml?: string
  servers: string[]
  /** Sorted by tag, then path, then method, for deterministic sidebar output. */
  operations: ParsedOperation[]
  /** Component schemas (keyed by name), surfaced for the schema viewer + cross-links. */
  componentSchemas: Record<string, ParsedSchema>
  /** Parsed security schemes keyed by name. */
  securitySchemes: Record<string, ParsedSecurityScheme>
}

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly source: string,
    public readonly errors?: { message: string; path?: string[] }[]
  ) {
    super(message)
    this.name = 'ParseError'
  }
}
