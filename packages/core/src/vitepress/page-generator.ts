import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { ParsedSpec } from '../parser/types'

export interface GeneratePagesOptions {
  /** Directory the generated `.md` files should be written to. */
  outDir: string
  /** URL prefix per spec, e.g. `{ public: '/api/public' }`. Defaults to `/api/{name}`. */
  prefixes?: Record<string, string>
}

export interface GeneratedPage {
  /** Path on disk, relative to `outDir`. */
  file: string
  /** Public URL path. */
  url: string
}

/**
 * Materialise one markdown page per operation and one per named component
 * schema. Each operation page renders a single `<OpenApiEndpoint>`; each
 * schema page renders an `<OpenApiSchema>`. Hand-written landing pages
 * (e.g. `/api/{name}/index.md`) coexist outside this generator's tree.
 */
export async function generatePages(
  specs: ParsedSpec[],
  options: GeneratePagesOptions
): Promise<GeneratedPage[]> {
  await rm(options.outDir, { recursive: true, force: true })
  await mkdir(options.outDir, { recursive: true })

  const pages: GeneratedPage[] = []
  for (const spec of specs) {
    const prefix = options.prefixes?.[spec.name] ?? `/api/${spec.name}`
    for (const op of spec.operations) {
      const file = join(prefix.replace(/^\//, ''), `${op.id}.md`)
      const url = `${prefix}/${op.id}`
      const fullPath = join(options.outDir, file)
      await mkdir(dirname(fullPath), { recursive: true })
      const title = op.summary || `${op.method.toUpperCase()} ${op.path}`
      const description = op.description?.split('\n')[0] ?? title
      const fullId = `${spec.name}.${op.id}`
      const body =
        '---\n' +
        `title: ${escapeYaml(title)}\n` +
        `description: ${escapeYaml(description)}\n` +
        'layout: doc\n' +
        'editLink: false\n' +
        'prev: false\n' +
        'next: false\n' +
        '---\n\n' +
        `<OpenApiEndpoint id="${fullId}" />\n`
      await writeFile(fullPath, body, 'utf8')
      pages.push({ file, url })
    }

    const schemaPrefix = `schemas/${spec.name}`
    for (const schema of Object.values(spec.componentSchemas ?? {})) {
      const file = join(schemaPrefix, `${schema.name}.md`)
      const url = `/${schemaPrefix}/${schema.name}`
      const fullPath = join(options.outDir, file)
      await mkdir(dirname(fullPath), { recursive: true })
      const title = `${schema.name} schema`
      const description = schema.description?.split('\n')[0] ?? title
      const body =
        '---\n' +
        `title: ${escapeYaml(title)}\n` +
        `description: ${escapeYaml(description)}\n` +
        'layout: doc\n' +
        'editLink: false\n' +
        'prev: false\n' +
        'next: false\n' +
        '---\n\n' +
        `<OpenApiSchema spec-name="${spec.name}" name="${schema.name}" />\n`
      await writeFile(fullPath, body, 'utf8')
      pages.push({ file, url })
    }

    const changelogFile = join('changelog', `${spec.name}.md`)
    const changelogPath = join(options.outDir, changelogFile)
    await mkdir(dirname(changelogPath), { recursive: true })
    await writeFile(
      changelogPath,
      '---\n' +
        `title: ${escapeYaml(`${spec.title} changelog`)}\n` +
        `description: ${escapeYaml(`Git-history diff for ${spec.title}.`)}\n` +
        'layout: doc\n' +
        'editLink: false\n' +
        'prev: false\n' +
        'next: false\n' +
        '---\n\n' +
        `<OpenApiChangelog name="${spec.name}" />\n`,
      'utf8'
    )
    pages.push({ file: changelogFile, url: `/changelog/${spec.name}` })
  }
  return pages
}

function escapeYaml(value: string): string {
  return JSON.stringify(value)
}
