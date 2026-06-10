import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { clack } from './prompt.js'
import {
  generateApiIndexMd,
  generateConfig,
  generateGuideMd,
  generateIndexMd,
  generateTheme,
  quote,
  yamlQuote,
  type SpecEntry,
} from './generators.js'

const execAsync = promisify(exec)
const TEMPLATE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../template')

export interface ScaffoldOptions {
  /** Name written into the generated package.json. */
  name: string
  /** Site title shown in the header and hero section. */
  title?: string
  /** Custom spec entries. When omitted, the bundled mock spec is used. */
  specs?: SpecEntry[]
  /** API server base URL override. */
  server?: string
  /** Use form inputs for request bodies instead of a JSON textarea. */
  bodyInputs?: boolean
}

export async function isGitAvailable(): Promise<boolean> {
  try {
    await execAsync('git --version')
    return true
  } catch {
    return false
  }
}

export async function isInsideGitRepo(dir: string): Promise<boolean> {
  try {
    await execAsync('git rev-parse --is-inside-work-tree', { cwd: dir })
    return true
  } catch {
    return false
  }
}

export async function validateSpecUrl(
  url: string,
  name: string,
  interactive: boolean
): Promise<void> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      const msg = `Spec "${name}" URL returned HTTP ${res.status}: ${url}`
      if (interactive) {
        clack.log.warn(msg)
      } else {
        console.warn(`[create-vitepress-openapi-docs] Warning: ${msg}`)
      }
    }
  } catch {
    const msg = `Could not reach spec "${name}" URL: ${url}`
    if (interactive) {
      clack.log.warn(msg)
    } else {
      console.warn(`[create-vitepress-openapi-docs] Warning: ${msg}`)
    }
  }
}

export function deriveSpecName(source: string): string {
  const cleaned = source.replace(/[?#].*$/, '')
  const raw = basename(cleaned).replace(/\.(json|ya?ml)$/i, '')
  return (
    raw
      .toLowerCase()
      .replace(/[^\w-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'api'
  )
}

/** Atomic scaffold: stages into a sibling dir, then renames. Cleans up on SIGINT. */
export async function scaffoldInto(targetDir: string, options: ScaffoldOptions): Promise<void> {
  const staging = `${targetDir}.vod-staging-${globalThis.process.pid}-${Date.now()}`
  const cleanup = () => rm(staging, { recursive: true, force: true }).catch(() => {})
  const onSignal = () => {
    cleanup().finally(() => globalThis.process.exit(130))
  }
  globalThis.process.once('SIGINT', onSignal)
  globalThis.process.once('SIGTERM', onSignal)

  try {
    await cp(TEMPLATE_DIR, staging, { recursive: true })
    await rename(join(staging, '_gitignore'), join(staging, '.gitignore'))
    await rewritePackageJson(staging, options.name)

    const defaults = buildDefaults(options)

    if (options.specs?.length) {
      await rewriteForCustomSpecs(staging, options.title ?? 'My API', options.specs, defaults)
    } else {
      if (options.title) await rewriteTitle(staging, options.title)
      if (Object.keys(defaults).length) await rewriteDefaults(staging, defaults)
    }

    if (existsSync(targetDir)) {
      await cp(staging, targetDir, { recursive: true, force: true })
      await cleanup()
    } else {
      await mkdir(dirname(targetDir), { recursive: true })
      await rename(staging, targetDir).catch(async (err) => {
        if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
          await cp(staging, targetDir, { recursive: true })
          await cleanup()
        } else {
          throw err
        }
      })
    }
  } catch (err) {
    await cleanup()
    throw err
  } finally {
    globalThis.process.removeListener('SIGINT', onSignal)
    globalThis.process.removeListener('SIGTERM', onSignal)
  }
}

function buildDefaults(options: ScaffoldOptions): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  if (options.server) defaults.server = options.server
  if (options.bodyInputs) defaults.bodyInputs = true
  return defaults
}

async function rewritePackageJson(dir: string, name: string): Promise<void> {
  const pkgPath = join(dir, 'package.json')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as { name?: string }
  pkg.name = name
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
}

/** Rewrite only the title in config.ts and index.md (used when mock spec is kept). */
async function rewriteTitle(dir: string, title: string): Promise<void> {
  const configPath = join(dir, 'docs/.vitepress/config.ts')
  const config = await readFile(configPath, 'utf8')
  await writeFile(
    configPath,
    config.replace(/title: 'My API'/, () => `title: ${quote(title)}`),
    'utf8'
  )

  const indexPath = join(dir, 'docs/index.md')
  const index = await readFile(indexPath, 'utf8')
  await writeFile(
    indexPath,
    index
      .replace(/title: My API/g, () => `title: ${yamlQuote(title)}`)
      .replace(/text: My API/g, () => `text: ${yamlQuote(title)}`),
    'utf8'
  )
}

/** Inject `defaults` into the openApiDocs() call in the template config. */
async function rewriteDefaults(dir: string, defaults: Record<string, unknown>): Promise<void> {
  const configPath = join(dir, 'docs/.vitepress/config.ts')
  const config = await readFile(configPath, 'utf8')
  const serialized = Object.entries(defaults)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(', ')
  const replaced = config.replace(
    /(extends:\s*await openApiDocs\(\{[\s\S]*?)(,?\s*\}\),)/,
    (_match, before: string, closing: string) => {
      return `${before.trimEnd()},\n    defaults: { ${serialized} }${closing}`
    }
  )
  await writeFile(configPath, replaced, 'utf8')
}

/**
 * Try to pick a suitable GET endpoint from a spec to use as a demo on the
 * landing page. Prefers "list" operations on short collection paths. Reads
 * local JSON files and fetches JSON URLs; YAML specs and unreachable sources
 * return undefined (graceful degradation - landing page omits the demo block).
 */
export async function pickDemoEndpoint(specSource: string): Promise<string | undefined> {
  const raw = await loadSpecText(specSource)
  if (raw === undefined) return undefined

  try {
    const spec = JSON.parse(raw) as {
      paths?: Record<string, Record<string, { operationId?: string; deprecated?: boolean }>>
    }
    const paths = spec.paths ?? {}

    const candidates: { id: string; score: number }[] = []
    for (const [path, methods] of Object.entries(paths)) {
      const get = methods.get
      if (!get || typeof get !== 'object' || typeof get.operationId !== 'string') continue
      if (get.deprecated === true) continue

      let score = 0
      if (/list|getAll|search|index/i.test(get.operationId)) score += 10
      if (!path.includes('{')) score += 5
      score -= path.split('/').length

      candidates.push({ id: get.operationId, score })
    }

    if (candidates.length === 0) return undefined
    candidates.sort((a, b) => b.score - a.score)
    return candidates[0]!.id
  } catch (err) {
    console.warn(
      `vitepress-openapi-docs: could not pick a demo endpoint from ${specSource} (${(err as Error).message}). Landing page will omit the Try-It block.`
    )
    return undefined
  }
}

const SPEC_FETCH_TIMEOUT_MS = 10_000

async function loadSpecText(specSource: string): Promise<string | undefined> {
  if (/^https?:\/\//i.test(specSource)) {
    if (/\.ya?ml(\?|#|$)/i.test(specSource)) return undefined
    try {
      const res = await fetch(specSource, {
        signal: AbortSignal.timeout(SPEC_FETCH_TIMEOUT_MS),
        headers: { Accept: 'application/json, */*;q=0.1' },
      })
      if (!res.ok) {
        console.warn(
          `vitepress-openapi-docs: fetch ${specSource} returned ${res.status} ${res.statusText}.`
        )
        return undefined
      }
      return await res.text()
    } catch (err) {
      console.warn(
        `vitepress-openapi-docs: fetch ${specSource} failed (${(err as Error).message}).`
      )
      return undefined
    }
  }

  if (/\.ya?ml$/i.test(specSource)) return undefined
  const resolved = resolve(globalThis.process.cwd(), specSource)
  if (!existsSync(resolved)) return undefined
  try {
    return await readFile(resolved, 'utf8')
  } catch (err) {
    console.warn(`vitepress-openapi-docs: could not read ${resolved} (${(err as Error).message}).`)
    return undefined
  }
}

/** Full rewrite when the user provides their own spec(s). */
async function rewriteForCustomSpecs(
  dir: string,
  title: string,
  specs: SpecEntry[],
  defaults: Record<string, unknown>
): Promise<void> {
  const demoEndpoint = await pickDemoEndpoint(specs[0]!.source)

  await writeFile(
    join(dir, 'docs/.vitepress/config.ts'),
    generateConfig(title, specs, defaults),
    'utf8'
  )
  await writeFile(join(dir, 'docs/.vitepress/theme/index.ts'), generateTheme(), 'utf8')
  await writeFile(join(dir, 'docs/index.md'), generateIndexMd(title, specs, demoEndpoint), 'utf8')

  // Remove bundled mock spec and its overview page
  await rm(join(dir, 'docs/openapi/mock.json'), { force: true })
  await rm(join(dir, 'docs/api/mock'), { recursive: true, force: true })

  // Create an overview page for each custom spec
  for (const spec of specs) {
    const apiDir = join(dir, 'docs/api', spec.name)
    await mkdir(apiDir, { recursive: true })
    await writeFile(join(apiDir, 'index.md'), generateApiIndexMd(spec.name), 'utf8')
  }

  // Update guide to reflect the actual structure
  await writeFile(join(dir, 'docs/guide.md'), generateGuideMd(specs), 'utf8')
}
