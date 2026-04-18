import type { ParsedSpec } from '../parser/types'
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

  if (specs.length === 1) {
    const spec = specs[0]!
    const prefix = options.prefixes?.[spec.name] ?? `/api/${spec.name}`
    return [...groupByTag(spec, prefix), ...schemaGroup(spec), ...changelogGroup(spec)]
  }

  return specs.map((spec) => {
    const prefix = options.prefixes?.[spec.name] ?? `/api/${spec.name}`
    return {
      text: spec.title,
      collapsed: false,
      items: [...groupByTag(spec, prefix), ...schemaGroup(spec), ...changelogGroup(spec)],
    }
  })
}

function groupByTag(spec: ParsedSpec, prefix: string): SidebarGroup[] {
  const buckets = new Map<string, SidebarLink[]>()
  for (const op of spec.operations) {
    const tag = op.tags[0] ?? 'Other'
    const link: SidebarLink = {
      text: op.summary || humanizeId(op.id),
      link: `${prefix}/${op.id}`,
    }
    const existing = buckets.get(tag)
    if (existing) existing.push(link)
    else buckets.set(tag, [link])
  }
  return [...buckets.entries()].map(([text, items]) => ({ text, collapsed: false, items }))
}

function schemaGroup(spec: ParsedSpec): SidebarGroup[] {
  const names = Object.keys(spec.componentSchemas ?? {}).sort()
  if (names.length === 0) return []
  return [
    {
      text: 'Schemas',
      collapsed: true,
      items: names.map((name) => ({ text: name, link: `/schemas/${spec.name}/${name}` })),
    },
  ]
}

function changelogGroup(spec: ParsedSpec): SidebarGroup[] {
  return [
    {
      text: 'Changelog',
      collapsed: true,
      items: [{ text: 'History', link: `/changelog/${spec.name}` }],
    },
  ]
}
