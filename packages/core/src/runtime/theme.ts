import type { App } from 'vue'
import OpenApiEndpoint from '../components/OpenApiEndpoint.vue'
import OpenApiSpec from '../components/OpenApiSpec.vue'
import OpenApiSchema from '../components/OpenApiSchema.vue'
import OpenApiChangelog from '../components/OpenApiChangelog.vue'
import AuthControls from '../components/AuthControls.vue'
import SdkSnippets from '../components/SdkSnippets.vue'
import OperationJumper from '../components/OperationJumper.vue'
import ResponseExamples from '../components/ResponseExamples.vue'
import { CHANGELOG_REGISTRY_KEY, DEFAULTS_KEY, PREFIXES_KEY, SPEC_REGISTRY_KEY } from './registry'
import type { ParsedSpec } from '../parser/types'
import type { SpecChangelog } from '../changelog/types'
import type { OpenApiDocsDefaults } from '../config/types'

export interface EnhanceAppOptions {
  app: App
  specs: ParsedSpec[]
  changelogs?: Record<string, SpecChangelog>
  defaults?: OpenApiDocsDefaults
  /** Per-spec URL prefixes used by components to build cross-links. */
  prefixes?: Record<string, string>
}

export function enhanceAppWithOpenApi(options: EnhanceAppOptions): void {
  const { app, specs, changelogs, defaults, prefixes } = options
  const specRegistry: Record<string, ParsedSpec> = {}
  for (const spec of specs) specRegistry[spec.name] = spec
  app.provide(SPEC_REGISTRY_KEY, { specs: specRegistry })
  app.provide(CHANGELOG_REGISTRY_KEY, { changelogs: changelogs ?? {} })
  app.provide(DEFAULTS_KEY, defaults ?? {})
  app.provide(PREFIXES_KEY, prefixes ?? {})
  app.component('OpenApiEndpoint', OpenApiEndpoint)
  app.component('OpenApiSpec', OpenApiSpec)
  app.component('OpenApiSchema', OpenApiSchema)
  app.component('OpenApiChangelog', OpenApiChangelog)
  app.component('AuthControls', AuthControls)
  app.component('SdkSnippets', SdkSnippets)
  app.component('OperationJumper', OperationJumper)
  app.component('ResponseExamples', ResponseExamples)
}
