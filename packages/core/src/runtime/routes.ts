import { inject } from 'vue'
import { withBase } from 'vitepress'
import { buildRoutes, type Routes } from '../config/routes'
import { PREFIXES_KEY } from './registry'

/** Browser-only route builder: paths come back pre-wrapped with `withBase`, ready for `href`. */
export function useRoutes(): Routes {
  const prefixes = inject(PREFIXES_KEY, {})
  const raw = buildRoutes(prefixes)
  return {
    apiPrefix: (specName) => withBase(raw.apiPrefix(specName)),
    operationUrl: (specName, opId) => withBase(raw.operationUrl(specName, opId)),
    schemaUrl: (specName, schemaName) => withBase(raw.schemaUrl(specName, schemaName)),
    changelogUrl: (specName) => withBase(raw.changelogUrl(specName)),
  }
}
