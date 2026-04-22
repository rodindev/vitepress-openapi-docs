import type { Plugin } from 'vite'
import type { ParsedSpec } from '../parser/types'
import type { OpenApiDocsDefaults } from '../config/types'

export const VIRTUAL_SPECS_ID = 'virtual:vitepress-openapi-docs/specs'
const RESOLVED_ID = `\0${VIRTUAL_SPECS_ID}`

/**
 * Vite plugin exposing the parsed specs as a virtual module the runtime can
 * import. The data is serialised once at plugin construction; any change to
 * the spec source file requires a dev-server restart in v0.1 (live reload is
 * deferred to v0.4 hardening).
 */
export function specsVirtualModule(
  specs: ParsedSpec[],
  defaults?: OpenApiDocsDefaults,
  prefixes?: Record<string, string>
): Plugin {
  const payload =
    `export default ${JSON.stringify(specs)}\n` +
    `export const defaults = ${JSON.stringify(defaults ?? {})}\n` +
    `export const prefixes = ${JSON.stringify(prefixes ?? {})}\n`
  return {
    name: 'vitepress-openapi-docs:specs',
    enforce: 'pre',
    resolveId(id) {
      if (id === VIRTUAL_SPECS_ID) return RESOLVED_ID
      return null
    },
    load(id) {
      if (id === RESOLVED_ID) return payload
      return null
    },
  }
}
