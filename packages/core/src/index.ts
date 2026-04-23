import './styles/index.scss'

export type { OpenApiDocsConfig, OpenApiDocsDefaults, OpenApiSpecConfig } from './config/types'
export { defineOpenApiDocs } from './config/define'
export type {
  HttpMethod,
  ParsedOAuth2Flow,
  ParsedOperation,
  ParsedParameter,
  ParsedProperty,
  ParsedRequestBody,
  ParsedResponse,
  ParsedSchema,
  ParsedSecurityScheme,
  ParsedSpec,
} from './parser/types'
export { default as OpenApiEndpoint } from './components/OpenApiEndpoint.vue'
export { default as OpenApiSpec } from './components/OpenApiSpec.vue'
export { default as OpenApiSchema } from './components/OpenApiSchema.vue'
export { default as OpenApiChangelog } from './components/OpenApiChangelog.vue'
export { default as AuthControls } from './components/AuthControls.vue'
export { default as SdkSnippets } from './components/SdkSnippets.vue'
export { default as OperationJumper } from './components/OperationJumper.vue'
export { default as SearchTrigger } from './components/SearchTrigger.vue'
export { default as ResponseExamples } from './components/ResponseExamples.vue'
export { fuzzyScore, rankByFuzzy } from './runtime/fuzzy'
export { generateExample, generateJsonBody } from './runtime/example'
export { buildSnippets, toCurlSnippet, toFetch, toPython } from './snippets/index'
export type { Snippet, SnippetLanguage, SnippetRequest } from './snippets/index'
export type {
  ChangeKind,
  ChangelogEntry,
  InfoChange,
  OperationChange,
  SpecChangelog,
} from './changelog/types'
export {
  useAuthState,
  readStoredCredential,
  type AuthCredential,
  type AuthScheme,
} from './runtime/auth'
export {
  SPEC_REGISTRY_KEY,
  provideSpecRegistry,
  resolveOperation,
  useSpecRegistry,
} from './runtime/registry'
export type { SpecRegistry } from './runtime/registry'
export { enhanceAppWithOpenApi, type EnhanceAppOptions } from './runtime/theme'
