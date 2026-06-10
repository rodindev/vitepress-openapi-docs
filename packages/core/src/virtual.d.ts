declare module 'virtual:vitepress-openapi-docs/specs' {
  import type { OpenApiDocsConfig, OpenApiDocsDefaults, ParsedSpec } from 'vitepress-openapi-docs'
  const specs: ParsedSpec[]
  export default specs
  export const defaults: OpenApiDocsDefaults
  export const prefixes: Record<string, string>
  export const theme: NonNullable<OpenApiDocsConfig['theme']>
}

declare module 'virtual:vitepress-openapi-docs/changelogs' {
  import type { SpecChangelog } from 'vitepress-openapi-docs'
  const changelogs: Record<string, SpecChangelog>
  export default changelogs
}
