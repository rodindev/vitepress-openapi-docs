import type { Plugin } from 'vite'
import type { SpecChangelog } from '../changelog/types'

export const VIRTUAL_CHANGELOGS_ID = 'virtual:vitepress-openapi-docs/changelogs'
const RESOLVED_ID = `\0${VIRTUAL_CHANGELOGS_ID}`

/**
 * Vite plugin exposing the per-spec changelog data as a virtual module.
 * Kept separate from `virtual:vitepress-openapi-docs/specs` so endpoint /
 * schema pages don't carry changelog history in their bundle.
 */
export function changelogsVirtualModule(changelogs: Record<string, SpecChangelog>): Plugin {
  const payload = `export default ${JSON.stringify(changelogs)}\n`
  return {
    name: 'vitepress-openapi-docs:changelogs',
    enforce: 'pre',
    resolveId(id) {
      if (id === VIRTUAL_CHANGELOGS_ID) return RESOLVED_ID
      return null
    },
    load(id) {
      if (id === RESOLVED_ID) return payload
      return null
    },
  }
}
