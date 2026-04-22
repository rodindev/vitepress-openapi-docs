/** URL prefix under which component-schema pages live. Relative to the site root. */
export const SCHEMA_URL_PREFIX = '/schemas'
/** URL prefix under which per-spec changelog pages live. */
export const CHANGELOG_URL_PREFIX = '/changelog'
/** Fallback used when a spec is configured without its own `prefix`. */
export const DEFAULT_API_PREFIX = '/api'

export interface Routes {
  /** URL prefix for operations in `specName` (e.g. `/api/public`). */
  apiPrefix(specName: string): string
  /** URL of a single operation page. */
  operationUrl(specName: string, operationId: string): string
  /** URL of a component-schema page. */
  schemaUrl(specName: string, schemaName: string): string
  /** URL of the git-driven changelog page for a spec. */
  changelogUrl(specName: string): string
}

/** Build site-root-relative URLs; browser callers should wrap with `withBase` (or use `useRoutes()`). */
export function buildRoutes(prefixes: Record<string, string> = {}): Routes {
  const apiPrefix = (specName: string): string =>
    prefixes[specName] ?? `${DEFAULT_API_PREFIX}/${specName}`
  return {
    apiPrefix,
    operationUrl: (specName, operationId) => `${apiPrefix(specName)}/${operationId}`,
    schemaUrl: (specName, schemaName) => `${SCHEMA_URL_PREFIX}/${specName}/${schemaName}`,
    changelogUrl: (specName) => `${CHANGELOG_URL_PREFIX}/${specName}`,
  }
}
