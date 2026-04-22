import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { buildRoutes } from '../config/routes'
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

  const routes = buildRoutes(options.prefixes)
  const pages: GeneratedPage[] = []

  for (const spec of specs) {
    for (const op of spec.operations) {
      const url = routes.operationUrl(spec.name, op.id)
      const file = `${urlToRelativePath(url)}.md`
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
        'aside: false\n' +
        'editLink: false\n' +
        'prev: false\n' +
        'next: false\n' +
        '---\n\n' +
        `<OpenApiEndpoint id="${escapeAttr(fullId)}" />\n`
      await writeFile(fullPath, body, 'utf8')
      pages.push({ file, url })
    }

    for (const schema of Object.values(spec.componentSchemas ?? {})) {
      const url = routes.schemaUrl(spec.name, schema.name)
      const file = `${urlToRelativePath(url)}.md`
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
        `<OpenApiSchema spec-name="${escapeAttr(spec.name)}" name="${escapeAttr(schema.name)}" />\n`
      await writeFile(fullPath, body, 'utf8')
      pages.push({ file, url })
    }

    const changelogUrl = routes.changelogUrl(spec.name)
    const changelogFile = `${urlToRelativePath(changelogUrl)}.md`
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
        `<OpenApiChangelog name="${escapeAttr(spec.name)}" />\n`,
      'utf8'
    )
    pages.push({ file: changelogFile, url: changelogUrl })
  }
  return pages
}

function urlToRelativePath(url: string): string {
  return url.replace(/^\//, '')
}

function escapeYaml(value: string): string {
  return JSON.stringify(value)
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}
