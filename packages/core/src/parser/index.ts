import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'
import { dereference, validate } from '@scalar/openapi-parser'

const purify = DOMPurify(new JSDOM('').window)
import {
  ParseError,
  type HttpMethod,
  type ParsedOAuth2Flow,
  type ParsedOperation,
  type ParsedParameter,
  type ParsedRequestBody,
  type ParsedResponse,
  type ParsedSchema,
  type ParsedSchemaRef,
  type ParsedSecurityScheme,
  type ParsedSpec,
} from './types'

const HTTP_METHODS: HttpMethod[] = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'trace',
]

const SCHEMA_REF_PREFIX = '#/components/schemas/'
const PARAM_REF_PREFIX = '#/components/parameters/'
const COMPONENTS_PREFIX = '#/components/'

export interface ParseSpecOptions {
  /** Logical name of the spec (matches `OpenApiSpecConfig.name`). */
  name: string
  /** Human-readable source label used in error messages (file path or URL). */
  source?: string
}

/**
 * Two passes: `validate` (preserves $refs for cross-linking) then `dereference`
 * (inlines refs for rendering).
 */
export async function parseSpec(
  input: string | Record<string, unknown>,
  options: ParseSpecOptions
): Promise<ParsedSpec> {
  const source = options.source ?? options.name

  let validation: Awaited<ReturnType<typeof validate>>
  try {
    validation = await validate(input)
  } catch (cause) {
    throw new ParseError(
      `OpenAPI spec "${source}" failed to parse: ${(cause as Error).message}`,
      source
    )
  }

  if (!validation.specification && validation.errors?.length) {
    throw new ParseError(`OpenAPI spec "${source}" failed to parse`, source, validation.errors)
  }

  let dereffed: Awaited<ReturnType<typeof dereference>>
  try {
    dereffed = await dereference(input)
  } catch (cause) {
    throw new ParseError(
      `OpenAPI spec "${source}" failed to dereference: ${(cause as Error).message}`,
      source
    )
  }

  const spec = dereffed.specification
  if (!spec) {
    throw new ParseError(
      `OpenAPI spec "${source}" produced no specification after dereferencing`,
      source,
      dereffed.errors
    )
  }

  const rawSpec = (validation.specification ?? {}) as Record<string, unknown>
  const rawPaths = (rawSpec.paths ?? {}) as Record<string, Record<string, unknown>>
  const specLevelSecurity = readSecurity(spec.security)
  const specComponents = (spec.components ?? {}) as Record<string, unknown>
  const componentParams = ((specComponents.parameters ?? {}) as Record<string, unknown>) ?? {}
  const componentResponses = ((specComponents.responses ?? {}) as Record<string, unknown>) ?? {}
  const componentRequestBodies =
    ((specComponents.requestBodies ?? {}) as Record<string, unknown>) ?? {}

  const operations: ParsedOperation[] = []
  const paths = (spec.paths ?? {}) as Record<string, Record<string, unknown>>
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue
    const pathLevelParams = readParameters(
      resolveParameterRefs(pathItem.parameters, componentParams)
    )
    const rawPathItem = (rawPaths[path] ?? {}) as Record<string, unknown>
    for (const method of HTTP_METHODS) {
      const op = pathItem[method] as Record<string, unknown> | undefined
      if (!op || typeof op !== 'object') continue
      const rawOp = (rawPathItem[method] ?? {}) as Record<string, unknown>
      operations.push(
        buildOperation(
          path,
          method,
          op,
          rawOp,
          pathLevelParams,
          'path',
          specLevelSecurity,
          componentParams,
          componentResponses,
          componentRequestBodies
        )
      )
    }
  }

  // OpenAPI 3.1 adds a top-level `webhooks` field. Each entry is a Path Item
  // representing a callback the API sends out. We surface them as operations
  // with `kind: 'webhook'` so they appear in the sidebar and jumper.
  const webhooks = ((spec as Record<string, unknown>).webhooks ?? {}) as Record<
    string,
    Record<string, unknown>
  >
  const rawWebhooks = ((rawSpec.webhooks ?? {}) as Record<string, Record<string, unknown>>) ?? {}
  for (const [webhookName, pathItem] of Object.entries(webhooks)) {
    if (!pathItem || typeof pathItem !== 'object') continue
    const pathLevelParams = readParameters(
      resolveParameterRefs(pathItem.parameters, componentParams)
    )
    const rawPathItem = (rawWebhooks[webhookName] ?? {}) as Record<string, unknown>
    for (const method of HTTP_METHODS) {
      const op = pathItem[method] as Record<string, unknown> | undefined
      if (!op || typeof op !== 'object') continue
      const rawOp = (rawPathItem[method] ?? {}) as Record<string, unknown>
      operations.push(
        buildOperation(
          webhookName,
          method,
          op,
          rawOp,
          pathLevelParams,
          'webhook',
          specLevelSecurity,
          componentParams,
          componentResponses,
          componentRequestBodies
        )
      )
    }
  }

  operations.sort(byTagPathMethod)

  const info = (spec.info ?? {}) as { title?: string; version?: string; description?: string }
  const components = (spec.components ?? {}) as Record<string, unknown>
  const rawSchemas = ((components.schemas ?? {}) as Record<string, unknown>) ?? {}

  for (const op of operations) {
    resolveOperationRefs(op, rawSchemas)
  }

  const componentSchemas = readComponentSchemas(components.schemas)
  for (const entry of Object.values(componentSchemas)) {
    entry.schema = resolveSchemaRefs(entry.schema, rawSchemas)
  }

  return {
    name: options.name,
    title: info.title ?? options.name,
    version: info.version ?? '0.0.0',
    description: info.description,
    descriptionHtml: info.description ? renderMarkdown(info.description) : undefined,
    servers: extractServers(spec.servers),
    operations,
    componentSchemas,
    securitySchemes: readSecuritySchemes(components.securitySchemes),
  }
}

function buildOperation(
  path: string,
  method: HttpMethod,
  op: Record<string, unknown>,
  rawOp: Record<string, unknown>,
  pathLevelParams: ParsedParameter[],
  kind: 'path' | 'webhook' = 'path',
  specLevelSecurity: string[] = [],
  componentParams: Record<string, unknown> = {},
  componentResponses: Record<string, unknown> = {},
  componentRequestBodies: Record<string, unknown> = {}
): ParsedOperation {
  const operationId = typeof op.operationId === 'string' ? op.operationId : undefined
  const id =
    operationId ??
    (kind === 'webhook' ? slugifyWebhook(method, path) : slugifyFallback(method, path))
  const tags = Array.isArray(op.tags)
    ? op.tags.filter((t): t is string => typeof t === 'string')
    : []
  const opLevelParams = readParameters(resolveParameterRefs(op.parameters, componentParams))
  const parameters = mergeParameters(pathLevelParams, opLevelParams)
  const opSecurity = op.security !== undefined ? readSecurity(op.security) : specLevelSecurity

  return {
    id,
    operationId,
    kind,
    method,
    path,
    summary: typeof op.summary === 'string' ? op.summary : undefined,
    description: typeof op.description === 'string' ? op.description : undefined,
    tags,
    parameters,
    requestBody: readRequestBody(
      resolveComponentRef(
        op.requestBody,
        COMPONENTS_PREFIX + 'requestBodies/',
        componentRequestBodies
      )
    ),
    responses: readResponses(op.responses, componentResponses),
    requestSchemaRefs: readBodyRefs(rawOp.requestBody),
    responseSchemaRefs: readResponseRefs(rawOp.responses),
    defaultServer: '',
    security: opSecurity,
    deprecated: op.deprecated === true,
  }
}

function readParameters(value: unknown): ParsedParameter[] {
  if (!Array.isArray(value)) return []
  const params: ParsedParameter[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const p = raw as Record<string, unknown>
    if (typeof p.name !== 'string' || typeof p.in !== 'string') continue
    if (!['path', 'query', 'header', 'cookie'].includes(p.in)) continue
    params.push({
      name: p.name,
      in: p.in as ParsedParameter['in'],
      required: p.required === true || p.in === 'path',
      description: typeof p.description === 'string' ? p.description : undefined,
      schema: p.schema,
      example: p.example,
    })
  }
  return params
}

function mergeParameters(
  pathLevel: ParsedParameter[],
  opLevel: ParsedParameter[]
): ParsedParameter[] {
  const seen = new Set(opLevel.map((p) => `${p.in}:${p.name}`))
  const merged = [...opLevel]
  for (const p of pathLevel) {
    if (seen.has(`${p.in}:${p.name}`)) continue
    merged.push(p)
  }
  return merged
}

function readRequestBody(value: unknown): ParsedRequestBody | undefined {
  if (!value || typeof value !== 'object') return undefined
  const body = value as Record<string, unknown>
  const content = (body.content as Record<string, { schema?: unknown; example?: unknown }>) ?? {}
  return {
    required: body.required === true,
    description: typeof body.description === 'string' ? body.description : undefined,
    content,
  }
}

function readResponses(
  value: unknown,
  componentResponses: Record<string, unknown> = {}
): ParsedResponse[] {
  if (!value || typeof value !== 'object') return []
  const responses: ParsedResponse[] = []
  for (const [status, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue
    const resolved = resolveComponentRef(
      raw,
      COMPONENTS_PREFIX + 'responses/',
      componentResponses
    ) as Record<string, unknown>
    responses.push({
      status,
      description: typeof resolved.description === 'string' ? resolved.description : undefined,
      content: resolved.content as ParsedResponse['content'],
    })
  }
  return responses.sort((a, b) => a.status.localeCompare(b.status))
}

function readSecurity(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const names = new Set<string>()
  for (const requirement of value) {
    if (!requirement || typeof requirement !== 'object') continue
    for (const key of Object.keys(requirement as Record<string, unknown>)) {
      names.add(key)
    }
  }
  return [...names]
}

function extractServers(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const urls: string[] = []
  for (const s of value) {
    if (!s || typeof s !== 'object') continue
    const server = s as { url?: unknown; variables?: Record<string, { default?: string }> }
    if (typeof server.url !== 'string') continue
    let url = server.url
    if (server.variables) {
      for (const [name, variable] of Object.entries(server.variables)) {
        if (variable && typeof variable.default === 'string') {
          url = url.replace(`{${name}}`, variable.default)
        }
      }
    }
    urls.push(url)
  }
  return urls
}

function readComponentSchemas(value: unknown): Record<string, ParsedSchema> {
  if (!value || typeof value !== 'object') return {}
  const schemas: Record<string, ParsedSchema> = {}
  for (const [name, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue
    const description = (raw as Record<string, unknown>).description
    schemas[name] = {
      name,
      description: typeof description === 'string' ? description : undefined,
      schema: raw,
    }
  }
  return schemas
}

function readSecuritySchemes(value: unknown): Record<string, ParsedSecurityScheme> {
  if (!value || typeof value !== 'object') return {}
  const schemes: Record<string, ParsedSecurityScheme> = {}
  for (const [name, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue
    const s = raw as Record<string, unknown>
    const rawType = typeof s.type === 'string' ? s.type : ''
    const parsed: ParsedSecurityScheme = { type: 'unknown', rawType }

    if (rawType === 'http') {
      const scheme = typeof s.scheme === 'string' ? s.scheme.toLowerCase() : ''
      if (scheme === 'bearer') parsed.type = 'bearer'
      else if (scheme === 'basic') parsed.type = 'basic'
    } else if (rawType === 'apiKey') {
      parsed.type = 'apikey'
      if (typeof s.name === 'string') parsed.name = s.name
      if (typeof s.in === 'string') parsed.in = s.in
    } else if (rawType === 'oauth2') {
      parsed.type = 'oauth2'
      parsed.oauth2Flows = readOAuth2Flows(s.flows)
    }

    schemes[name] = parsed
  }
  return schemes
}

function readOAuth2Flows(value: unknown): Record<string, ParsedOAuth2Flow> | undefined {
  if (!value || typeof value !== 'object') return undefined
  const flows: Record<string, ParsedOAuth2Flow> = {}
  for (const [flowType, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue
    const f = raw as Record<string, unknown>
    const scopes: Record<string, string> = {}
    if (f.scopes && typeof f.scopes === 'object') {
      for (const [scope, desc] of Object.entries(f.scopes as Record<string, unknown>)) {
        scopes[scope] = typeof desc === 'string' ? desc : ''
      }
    }
    flows[flowType] = {
      authorizationUrl: typeof f.authorizationUrl === 'string' ? f.authorizationUrl : undefined,
      tokenUrl: typeof f.tokenUrl === 'string' ? f.tokenUrl : undefined,
      refreshUrl: typeof f.refreshUrl === 'string' ? f.refreshUrl : undefined,
      scopes,
    }
  }
  return Object.keys(flows).length > 0 ? flows : undefined
}

function readBodyRefs(rawBody: unknown): Record<string, ParsedSchemaRef> {
  if (!rawBody || typeof rawBody !== 'object') return {}
  const content = (rawBody as { content?: Record<string, unknown> }).content
  if (!content) return {}
  return readContentRefs(content)
}

function readResponseRefs(rawResponses: unknown): Record<string, Record<string, ParsedSchemaRef>> {
  if (!rawResponses || typeof rawResponses !== 'object') return {}
  const refsByStatus: Record<string, Record<string, ParsedSchemaRef>> = {}
  for (const [status, raw] of Object.entries(rawResponses as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue
    const content = (raw as { content?: Record<string, unknown> }).content
    if (!content) continue
    const refs = readContentRefs(content)
    if (Object.keys(refs).length > 0) refsByStatus[status] = refs
  }
  return refsByStatus
}

function readContentRefs(content: Record<string, unknown>): Record<string, ParsedSchemaRef> {
  const refs: Record<string, ParsedSchemaRef> = {}
  for (const [contentType, raw] of Object.entries(content)) {
    if (!raw || typeof raw !== 'object') continue
    const schema = (raw as { schema?: unknown }).schema
    const ref = schemaRefName(schema)
    if (ref) refs[contentType] = { name: ref }
  }
  return refs
}

function schemaRefName(schema: unknown): string | undefined {
  if (!schema || typeof schema !== 'object') return undefined
  const ref = (schema as { $ref?: unknown }).$ref
  if (typeof ref === 'string' && ref.startsWith(SCHEMA_REF_PREFIX)) {
    return ref.slice(SCHEMA_REF_PREFIX.length)
  }
  // Common case: arrays of refs (`type: array, items: { $ref: ... }`)
  const items = (schema as { items?: unknown }).items
  if (items) return schemaRefName(items)
  return undefined
}

function slugifyFallback(method: HttpMethod, path: string): string {
  const cleaned = path
    .replace(/[{}]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return `${method}_${cleaned || 'root'}`
}

function slugifyWebhook(method: HttpMethod, name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return `webhook_${method}_${cleaned || 'event'}`
}

const METHOD_ORDER: Record<HttpMethod, number> = {
  get: 0,
  post: 1,
  put: 2,
  patch: 3,
  delete: 4,
  head: 5,
  options: 6,
  trace: 7,
}

function byTagPathMethod(a: ParsedOperation, b: ParsedOperation): number {
  const at = a.tags[0] ?? ''
  const bt = b.tags[0] ?? ''
  if (at !== bt) return at.localeCompare(bt)
  if (a.path !== b.path) return a.path.localeCompare(b.path)
  return METHOD_ORDER[a.method] - METHOD_ORDER[b.method]
}

function resolveComponentRef(
  value: unknown,
  prefix: string,
  components: Record<string, unknown>
): unknown {
  if (!value || typeof value !== 'object') return value
  const ref = (value as Record<string, unknown>).$ref
  if (typeof ref === 'string' && ref.startsWith(prefix)) {
    const name = ref.slice(prefix.length)
    return components[name] ?? value
  }
  return value
}

function resolveParameterRefs(
  params: unknown,
  componentParams: Record<string, unknown>
): unknown[] {
  if (!Array.isArray(params)) return []
  return params.map((p) => {
    if (!p || typeof p !== 'object') return p
    const ref = (p as Record<string, unknown>).$ref
    if (typeof ref === 'string' && ref.startsWith(PARAM_REF_PREFIX)) {
      const name = ref.slice(PARAM_REF_PREFIX.length)
      return componentParams[name] ?? p
    }
    return p
  })
}

function resolveSchemaRefs(
  value: unknown,
  schemas: Record<string, unknown>,
  resolving: Set<string> = new Set()
): unknown {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    return value.map((item) => resolveSchemaRefs(item, schemas, resolving))
  }
  const obj = value as Record<string, unknown>
  if (typeof obj.$ref === 'string' && obj.$ref.startsWith(SCHEMA_REF_PREFIX)) {
    const name = obj.$ref.slice(SCHEMA_REF_PREFIX.length)
    if (resolving.has(name)) return obj
    const target = schemas[name]
    if (!target) return obj
    const next = new Set(resolving)
    next.add(name)
    return resolveSchemaRefs(target, schemas, next)
  }
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) {
    result[key] = resolveSchemaRefs(val, schemas, resolving)
  }
  return result
}

function resolveOperationRefs(op: ParsedOperation, schemas: Record<string, unknown>): void {
  if (op.requestBody) {
    for (const entry of Object.values(op.requestBody.content)) {
      if (entry.schema) entry.schema = resolveSchemaRefs(entry.schema, schemas)
    }
  }
  for (const resp of op.responses) {
    if (!resp.content) continue
    for (const entry of Object.values(resp.content)) {
      if (entry.schema) entry.schema = resolveSchemaRefs(entry.schema, schemas)
    }
  }
}

function renderMarkdown(src: string): string {
  const html = marked.parse(src, { async: false }) as string
  return purify.sanitize(html)
}

export { ParseError } from './types'
export type * from './types'
