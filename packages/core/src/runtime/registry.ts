import { inject, provide, type InjectionKey } from 'vue'
import type { ParsedOperation, ParsedSpec } from '../parser/types'
import type { SpecChangelog } from '../changelog/types'
import type { OpenApiDocsDefaults } from '../config/types'

export interface SpecRegistry {
  /** Specs keyed by spec name. */
  specs: Record<string, ParsedSpec>
}

export interface ChangelogRegistry {
  /** Changelogs keyed by spec name. */
  changelogs: Record<string, SpecChangelog>
}

export const SPEC_REGISTRY_KEY: InjectionKey<SpecRegistry> = Symbol('vod:spec-registry')
export const CHANGELOG_REGISTRY_KEY: InjectionKey<ChangelogRegistry> =
  Symbol('vod:changelog-registry')
export const DEFAULTS_KEY: InjectionKey<OpenApiDocsDefaults> = Symbol('vod:defaults')
export const PREFIXES_KEY: InjectionKey<Record<string, string>> = Symbol('vod:prefixes')

export function provideSpecRegistry(registry: SpecRegistry): void {
  provide(SPEC_REGISTRY_KEY, registry)
}

export function useSpecRegistry(): SpecRegistry {
  const registry = inject(SPEC_REGISTRY_KEY, null)
  if (!registry) {
    return { specs: {} }
  }
  return registry
}

export function provideChangelogRegistry(registry: ChangelogRegistry): void {
  provide(CHANGELOG_REGISTRY_KEY, registry)
}

export function useChangelog(name?: string): SpecChangelog | undefined {
  const registry = inject(CHANGELOG_REGISTRY_KEY, null)
  if (!registry) return undefined
  if (name) return registry.changelogs[name]
  const all = Object.values(registry.changelogs)
  return all.length === 1 ? all[0] : undefined
}

export function useDefaults(): OpenApiDocsDefaults {
  return inject(DEFAULTS_KEY, {})
}

/**
 * Resolve an operation by `<specName>.<operationId>` or, when only one spec
 * is registered, a bare `<operationId>`. Returns `null` when not found.
 */
export function resolveOperation(
  registry: SpecRegistry,
  id: string
): { spec: ParsedSpec; operation: ParsedOperation } | null {
  const dotIndex = id.indexOf('.')
  if (dotIndex > 0) {
    const specName = id.slice(0, dotIndex)
    const operationId = id.slice(dotIndex + 1)
    const spec = registry.specs[specName]
    if (spec) {
      const operation = spec.operations.find(
        (op) => op.id === operationId || op.operationId === operationId
      )
      if (operation) return { spec, operation }
    }
  }

  const specs = Object.values(registry.specs)
  for (const spec of specs) {
    const operation = spec.operations.find((op) => op.id === id || op.operationId === id)
    if (operation) return { spec, operation }
  }
  return null
}
