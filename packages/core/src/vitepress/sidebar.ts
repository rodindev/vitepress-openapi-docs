import type { ParsedSpec } from '../parser/types'
import { buildRoutes } from '../config/routes'
import { humanizeId } from './humanize'

export interface SidebarLink {
  text: string
  link: string
}

export interface SidebarGroup {
  text: string
  collapsed?: boolean
  items: (SidebarLink | SidebarGroup)[]
}

export interface BuildSidebarOptions {
  /** URL prefix per spec, e.g. `{ public: '/api/public' }`. Falls back to `/api/{name}`. */
  prefixes?: Record<string, string>
}

/**
 * Build a VitePress sidebar object from parsed specs. Single spec yields
 * tag → operation (with a "Schemas" group when component schemas exist).
 * Multi-spec yields spec → (tags, schemas).
 */
export function buildSidebar(
  specs: ParsedSpec[],
  options: BuildSidebarOptions = {}
): SidebarGroup[] {
  if (specs.length === 0) return []
  const routes = buildRoutes(options.prefixes)

  if (specs.length === 1) {
    const spec = specs[0]!
    return [
      ...groupByTag(spec, routes),
      ...schemaGroup(spec, routes),
      ...changelogGroup(spec, routes),
    ]
  }

  return specs.map((spec) => ({
    text: spec.title,
    collapsed: false,
    items: [
      ...groupByTag(spec, routes),
      ...schemaGroup(spec, routes),
      ...changelogGroup(spec, routes),
    ],
  }))
}

function groupByTag(spec: ParsedSpec, routes: ReturnType<typeof buildRoutes>): SidebarGroup[] {
  const buckets = new Map<string, SidebarLink[]>()
  for (const op of spec.operations) {
    const tag = op.tags[0] ?? 'Other'
    const link: SidebarLink = {
      text: op.summary || humanizeId(op.id),
      link: routes.operationUrl(spec.name, op.id),
    }
    const existing = buckets.get(tag)
    if (existing) existing.push(link)
    else buckets.set(tag, [link])
  }
  return [...buckets.entries()].map(([text, items]) => ({ text, collapsed: false, items }))
}

function schemaGroup(spec: ParsedSpec, routes: ReturnType<typeof buildRoutes>): SidebarGroup[] {
  const names = Object.keys(spec.componentSchemas ?? {}).sort()
  if (names.length === 0) return []
  return [
    {
      text: 'Schemas',
      collapsed: true,
      items: names.map((name) => ({ text: name, link: routes.schemaUrl(spec.name, name) })),
    },
  ]
}

function changelogGroup(spec: ParsedSpec, routes: ReturnType<typeof buildRoutes>): SidebarGroup[] {
  return [
    {
      text: 'Changelog',
      collapsed: true,
      items: [{ text: 'History', link: routes.changelogUrl(spec.name) }],
    },
  ]
}
