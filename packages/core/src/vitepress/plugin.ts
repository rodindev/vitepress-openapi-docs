import { readFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { parseSpec } from '../parser/index'
import { extractChangelog } from '../changelog/extractor'
import type { SpecChangelog } from '../changelog/types'
import type { OpenApiDocsConfig, OpenApiSpecConfig } from '../config/types'
import type { ParsedSpec } from '../parser/types'
import { buildSidebar, type SidebarGroup } from './sidebar'
import { generatePages } from './page-generator'
import { scanForBrokenEmbeds } from './scanner'
import { specsVirtualModule } from './virtual-module'
import { changelogsVirtualModule } from './virtual-changelog'

/** Underscore prefix keeps it visible to VitePress's globby scan. */
const GENERATED_DIR = '_openapi'

export interface OpenApiDocsPluginOptions {
  /** VitePress source directory. Defaults to `<cwd>/docs`. */
  srcDir?: string
  /** Git repository root used for changelog extraction. Defaults to `cwd`. */
  repoRoot?: string
  /** How to react when a hand-written markdown page references an unknown operation id. */
  onBrokenEmbed?: 'error' | 'warn' | 'ignore'
  /** Log spec discovery, operation counts, and page generation to stderr. */
  verbose?: boolean
}

export async function openApiDocs(
  config: OpenApiDocsConfig,
  options: OpenApiDocsPluginOptions = {}
): Promise<Record<string, unknown>> {
  const cwd = globalThis.process.cwd()
  const srcDir = options.srcDir ?? resolve(cwd, 'docs')
  const repoRoot = options.repoRoot ?? cwd
  const brokenEmbedMode =
    options.onBrokenEmbed ?? (globalThis.process.env.NODE_ENV === 'production' ? 'error' : 'warn')
  const verbose = options.verbose ?? false
  const log = verbose ? (msg: string) => console.log(`[vitepress-openapi-docs] ${msg}`) : () => {}

  log(`Loading ${config.specs.length} spec(s)`)

  if (config.specs.length > 1) {
    const missing = config.specs.filter((s) => !s.prefix).map((s) => s.name)
    if (missing.length > 0) {
      throw new Error(
        '[vitepress-openapi-docs] Multi-API requires a "prefix" for every spec. ' +
          `Missing prefix: ${missing.join(', ')}. ` +
          'Add a prefix (e.g. prefix: "/api/my-api") to each spec in your config.'
      )
    }
  }

  const parsed: ParsedSpec[] = []
  const prefixes: Record<string, string> = {}
  const changelogs: Record<string, SpecChangelog> = {}

  for (const spec of config.specs) {
    log(`  Parsing "${spec.name}" from ${spec.spec}`)
    const { parsedSpec, absoluteSpecPath } = await loadAndParseSpec(spec)
    parsed.push(parsedSpec)
    if (spec.prefix) prefixes[spec.name] = spec.prefix

    log(
      `  "${spec.name}": ${parsedSpec.operations.length} operations, ` +
        `${Object.keys(parsedSpec.componentSchemas).length} schemas, ` +
        `${Object.keys(parsedSpec.securitySchemes).length} security schemes`
    )

    if (absoluteSpecPath) {
      const relativePath = relative(repoRoot, absoluteSpecPath)
      if (!relativePath.startsWith('..') && !isAbsolute(relativePath)) {
        changelogs[spec.name] = await extractChangelog({
          specPath: relativePath,
          specName: spec.name,
          cwd: repoRoot,
        })
        log(
          `  "${spec.name}": changelog ${changelogs[spec.name]!.isEmpty ? 'empty (< 2 commits)' : `${changelogs[spec.name]!.entries.length} entries`}`
        )
      }
    }
    if (!changelogs[spec.name]) {
      changelogs[spec.name] = { specName: spec.name, entries: [], isEmpty: true }
    }
  }

  const pages = await generatePages(parsed, {
    outDir: resolve(srcDir, GENERATED_DIR),
    prefixes,
  })

  log(`Generated ${pages.length} pages into ${GENERATED_DIR}/`)

  const rewrites: Record<string, string> = {}
  for (const page of pages) {
    rewrites[`${GENERATED_DIR}/${page.file}`] = page.file
  }

  if (brokenEmbedMode !== 'ignore') {
    log(`Scanning for broken embeds in ${srcDir}`)
    const broken = await scanForBrokenEmbeds(srcDir, parsed)
    if (broken.length > 0) {
      const details = broken.map((b) => `  - ${b.file}:${b.line} — id="${b.id}"`).join('\n')
      const message = `vitepress-openapi-docs: ${broken.length} broken <OpenApiEndpoint> embed(s):\n${details}`
      if (brokenEmbedMode === 'error') {
        throw new Error(message)
      }
      console.warn(message)
    }
  }

  const sidebar: Record<string, SidebarGroup[]> = {}
  for (const spec of parsed) {
    const prefix = prefixes[spec.name] ?? `/api/${spec.name}`
    const specSidebar = buildSidebar([spec], { prefixes })
    sidebar[`${prefix}/`] = specSidebar
    sidebar[`/schemas/${spec.name}/`] = specSidebar
    sidebar[`/changelog/${spec.name}`] = specSidebar
  }

  return {
    rewrites,
    vite: {
      plugins: [specsVirtualModule(parsed, config.defaults), changelogsVirtualModule(changelogs)],
    },
    themeConfig: {
      sidebar,
    },
  }
}

const FETCH_TIMEOUT_MS = 30_000

async function loadAndParseSpec(
  spec: OpenApiSpecConfig
): Promise<{ parsedSpec: ParsedSpec; absoluteSpecPath?: string }> {
  const source = spec.spec
  const isUrl = /^https?:\/\//.test(source)
  if (isUrl) {
    let res: Response
    try {
      res = await fetch(source, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    } catch (cause) {
      const err = cause as Error & { name?: string }
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        throw new Error(
          `[vitepress-openapi-docs] Timed out fetching spec "${spec.name}" from ${source} after ${FETCH_TIMEOUT_MS}ms. ` +
            'Check that the origin is reachable or vendor the spec locally.'
        )
      }
      throw new Error(
        `[vitepress-openapi-docs] Could not fetch spec "${spec.name}" from ${source}: ${err?.message ?? cause}`
      )
    }
    if (!res.ok) {
      throw new Error(
        `[vitepress-openapi-docs] Could not fetch spec "${spec.name}" from ${source}: HTTP ${res.status}`
      )
    }
    const body = await res.text()
    const parsedSpec = await parseSpec(body, { name: spec.name, source })
    return { parsedSpec }
  }

  const filePath = isAbsolute(source) ? source : resolve(globalThis.process.cwd(), source)
  let body: string
  try {
    body = await readFile(filePath, 'utf8')
  } catch (cause) {
    const err = cause as NodeJS.ErrnoException
    if (err?.code === 'ENOENT') {
      throw new Error(
        `[vitepress-openapi-docs] Could not load spec "${spec.name}": file not found at ${filePath}`
      )
    }
    throw new Error(
      `[vitepress-openapi-docs] Could not load spec "${spec.name}" from ${filePath}: ${err?.message ?? cause}`
    )
  }
  try {
    const parsedSpec = await parseSpec(body, { name: spec.name, source: filePath })
    return { parsedSpec, absoluteSpecPath: filePath }
  } catch (cause) {
    const err = cause as Error
    throw new Error(
      `[vitepress-openapi-docs] Could not parse spec "${spec.name}" from ${filePath}: ${err?.message ?? cause}`
    )
  }
}
