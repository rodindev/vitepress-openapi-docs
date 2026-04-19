import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectPackageManager } from './detect-pm.js'
import { prompt } from './prompt.js'

const TEMPLATE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../template')

interface CliOptions {
  /** Target directory (positional arg). */
  dir: string
  /** Allow scaffold into a non-empty directory without prompting. */
  force: boolean
  /** Package manager override. */
  pm?: 'npm' | 'pnpm' | 'yarn' | 'bun'
  /** Skip dependency install instructions. */
  skipInstall: boolean
  /** When false, do not read from stdin (for CI / scripted use). */
  interactive: boolean
  /** Override spec path/URL written into the scaffold (skips the prompt). */
  spec?: string
  /** Override site title. */
  title?: string
  /** Use form inputs for request bodies instead of a JSON textarea. */
  bodyInputs?: boolean
}

export interface SpecEntry {
  /** Short name used in URLs and config, e.g. `'public'` or `'admin'`. */
  name: string
  /** File path or URL to the OpenAPI spec. */
  source: string
}

export interface ScaffoldOptions {
  /** Name written into the generated package.json. */
  name: string
  /** Site title shown in the header and hero section. */
  title?: string
  /** Custom spec entries. When omitted, the bundled mock spec is used. */
  specs?: SpecEntry[]
  /** Use form inputs for request bodies instead of a JSON textarea. */
  bodyInputs?: boolean
}

export async function run(argv: string[]): Promise<void> {
  const opts = parseArgs(argv)
  const target = resolve(globalThis.process.cwd(), opts.dir)

  if (existsSync(target) && !opts.force) {
    if (!opts.interactive) {
      console.error(
        `[create-vitepress-openapi-docs] Target directory "${target}" already exists. ` +
          'Pass --force to scaffold into it anyway.'
      )
      globalThis.process.exit(1)
    }
    const proceed = await prompt(
      `Directory "${opts.dir}" already exists. Scaffold into it anyway? (y/N) `,
      'n'
    )
    if (!/^y(es)?$/i.test(proceed)) {
      console.log('Aborted.')
      return
    }
  }

  let title = opts.title
  let specs: SpecEntry[] | undefined
  let bodyInputs = opts.bodyInputs

  if (opts.spec) {
    const specName = deriveSpecName(opts.spec)
    specs = [{ name: specName, source: opts.spec }]
  } else if (opts.interactive) {
    title = title ?? (await promptTitle())
    specs = await promptSpecs()
  }

  if (bodyInputs === undefined && opts.interactive) {
    bodyInputs = await promptBodyInputs()
  }

  for (const entry of specs ?? []) {
    if (!/^https?:\/\//i.test(entry.source)) {
      const resolved = resolve(globalThis.process.cwd(), entry.source)
      if (!existsSync(resolved)) {
        console.warn(
          `[create-vitepress-openapi-docs] Warning: spec file not found at "${resolved}". ` +
            'The path will be written into config.ts, but VitePress will fail to load it at dev/build time.'
        )
      }
    }
  }

  await scaffoldInto(target, {
    name: opts.dir.replace(/[^\w-]+/g, '-') || 'my-api-docs',
    title,
    specs: specs?.length ? specs : undefined,
    bodyInputs,
  })

  const pm = opts.pm ?? detectPackageManager()
  console.log(`\n  \u2713 Scaffolded into ${target}`)
  console.log('\nNext steps:')
  console.log(`  cd ${opts.dir}`)
  if (!opts.skipInstall) console.log(`  ${pm} install`)
  console.log(`  ${pm} run dev\n`)
}

async function promptTitle(): Promise<string | undefined> {
  const answer = await prompt('Site title (My API): ', '')
  return answer.trim() || undefined
}

async function promptBodyInputs(): Promise<boolean> {
  const answer = await prompt(
    'Request body style — form inputs or JSON textarea? (inputs/TEXTAREA) ',
    ''
  )
  return /^i(nputs?)?$/i.test(answer.trim())
}

async function promptSpecs(): Promise<SpecEntry[] | undefined> {
  const specs: SpecEntry[] = []

  const first = await prompt(
    'Path or URL to your OpenAPI spec (leave blank for bundled demo): ',
    ''
  )
  if (!first.trim()) return undefined

  const firstName = await promptSpecName(first.trim())
  specs.push({ name: firstName, source: first.trim() })

  while (true) {
    const more = await prompt('Add another API spec? (y/N) ', 'n')
    if (!/^y(es)?$/i.test(more)) break
    const source = await prompt('Path or URL to OpenAPI spec: ', '')
    if (!source.trim()) break
    const taken = specs.map((s) => s.name)
    const specName = await promptSpecName(source.trim(), taken)
    specs.push({ name: specName, source: source.trim() })
  }

  return specs
}

async function promptSpecName(source: string, taken: string[] = []): Promise<string> {
  const suggested = deriveSpecName(source)
  const answer = await prompt(`Short name for this API (${suggested}): `, '')
  const raw = answer.trim() || suggested
  const name =
    raw
      .toLowerCase()
      .replace(/[^\w-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'api'
  if (taken.includes(name)) {
    console.warn(`[create-vitepress-openapi-docs] Name "${name}" is already used, adding suffix.`)
    return `${name}-2`
  }
  return name
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
    await rewritePackageJson(staging, options.name)

    if (options.specs?.length) {
      await rewriteForCustomSpecs(
        staging,
        options.title ?? 'My API',
        options.specs,
        options.bodyInputs
      )
    } else {
      if (options.title) await rewriteTitle(staging, options.title)
      if (options.bodyInputs) await rewriteDefaults(staging, { bodyInputs: true })
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
 * Try to pick a suitable GET endpoint from a local spec file to use as a demo
 * on the landing page. Prefers "list" operations on short collection paths.
 * Returns undefined for URLs, YAML files, or unreadable specs.
 */
export async function pickDemoEndpoint(specSource: string): Promise<string | undefined> {
  if (/^https?:\/\//i.test(specSource)) return undefined
  const resolved = resolve(globalThis.process.cwd(), specSource)
  if (!existsSync(resolved)) return undefined

  try {
    const raw = await readFile(resolved, 'utf8')
    const spec = JSON.parse(raw) as {
      paths?: Record<string, Record<string, { operationId?: string }>>
    }
    const paths = spec.paths ?? {}

    const candidates: { id: string; score: number }[] = []
    for (const [path, methods] of Object.entries(paths)) {
      const get = methods.get
      if (!get || typeof get !== 'object' || typeof get.operationId !== 'string') continue

      let score = 0
      if (/list|getAll|search|index/i.test(get.operationId)) score += 10
      if (!path.includes('{')) score += 5
      score -= path.split('/').length

      candidates.push({ id: get.operationId, score })
    }

    if (candidates.length === 0) return undefined
    candidates.sort((a, b) => b.score - a.score)
    return candidates[0]!.id
  } catch {
    return undefined
  }
}

/** Full rewrite when the user provides their own spec(s). */
async function rewriteForCustomSpecs(
  dir: string,
  title: string,
  specs: SpecEntry[],
  bodyInputs?: boolean
): Promise<void> {
  const demoEndpoint = await pickDemoEndpoint(specs[0]!.source)

  await writeFile(
    join(dir, 'docs/.vitepress/config.ts'),
    generateConfig(title, specs, bodyInputs),
    'utf8'
  )
  await writeFile(join(dir, 'docs/.vitepress/theme/index.ts'), generateTheme(specs), 'utf8')
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

function generateConfig(title: string, specs: SpecEntry[], bodyInputs?: boolean): string {
  const navItems =
    specs.length === 1
      ? `{ text: 'API Reference', link: '/api/${specs[0]!.name}/' },`
      : specs
          .map((s) => `{ text: ${quote(capitalize(s.name) + ' API')}, link: '/api/${s.name}/' },`)
          .join('\n      ')

  const specEntries = specs
    .map(
      (s) =>
        `{ name: ${quote(s.name)}, spec: ${JSON.stringify(s.source)}, prefix: '/api/${s.name}' }`
    )
    .join(',\n      ')

  return `import { defineConfig } from 'vitepress'
import { openApiDocs } from 'vitepress-openapi-docs/vitepress'

export default defineConfig({
  title: ${quote(title)},
  description: 'Interactive OpenAPI documentation',
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide' },
      ${navItems}
    ],

    sidebar: {
      '/guide': [
        {
          text: 'Getting Started',
          items: [{ text: 'Introduction', link: '/guide' }],
        },
      ],
    },

    footer: {
      message: 'Built with vitepress-openapi-docs',
    },
  },

  extends: await openApiDocs({
    specs: [${specEntries}],${bodyInputs ? '\n    defaults: { bodyInputs: true },' : ''}
  }),
})
`
}

function generateTheme(specs: SpecEntry[]): string {
  const prefixEntries = specs.map((s) => `  ${quote(s.name)}: '/api/${s.name}'`).join(',\n')

  return `import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { enhanceAppWithOpenApi, OperationJumper, SearchTrigger } from 'vitepress-openapi-docs'
import specs, { defaults } from 'virtual:vitepress-openapi-docs/specs'
import changelogs from 'virtual:vitepress-openapi-docs/changelogs'
import 'vue-api-playground/styles'
import 'vitepress-openapi-docs/styles'

const prefixes = {
${prefixEntries},
}

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(OperationJumper, { prefixes }),
      'nav-bar-content-after': () => h(SearchTrigger),
    })
  },
  enhanceApp({ app }) {
    enhanceAppWithOpenApi({ app, specs, changelogs, defaults })
  },
}
`
}

function generateIndexMd(title: string, specs: SpecEntry[], demoEndpoint?: string): string {
  const firstLink = `/api/${specs[0]!.name}/`

  const tryItBlock = demoEndpoint
    ? `

## Try it

This is a live endpoint from your OpenAPI spec. Click "Send" to make a real request.

<OpenApiEndpoint id="${demoEndpoint}" />
`
    : ''

  return `---
layout: home
title: ${yamlQuote(title)}
hero:
  text: ${yamlQuote(title)}
  tagline: Interactive API documentation, powered by vitepress-openapi-docs.
  actions:
    - theme: brand
      text: API Reference
      link: ${firstLink}
    - theme: alt
      text: Guide
      link: /guide
---
${tryItBlock}
## Quick start

Update the spec path in \`.vitepress/config.ts\` and run \`npm run dev\` to see your API docs.

Use \`Cmd+K\` (or \`Ctrl+K\`) to jump to any operation or schema.
`
}

function generateApiIndexMd(specName: string): string {
  return `# API Reference

All operations and schemas from your OpenAPI spec. Per-operation and per-schema pages are auto-generated and reachable from the sidebar.

<OpenApiSpec name="${specName}" />
`
}

function generateGuideMd(specs: SpecEntry[]): string {
  const specLines = specs.map((s) => `    ${s.name}/index.md`).join('\n')

  return `# Introduction

This site is built with [vitepress-openapi-docs](https://www.npmjs.com/package/vitepress-openapi-docs).

## Project structure

\`\`\`
docs/
  .vitepress/
    config.ts          \u2190 plugin config + VitePress config
    theme/index.ts     \u2190 component registration + styles
  api/
${specLines}
  index.md             \u2190 landing page
\`\`\`

## Using endpoints in markdown

Write \`<OpenApiEndpoint>\` anywhere in your markdown:

\`\`\`md
## Create a user

<OpenApiEndpoint id="createUser" />
\`\`\`

The endpoint renders inline with your prose. See the [components guide](https://rodindev.github.io/vitepress-openapi-docs/guide/components) for all available components.
`
}

function quote(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function yamlQuote(s: string): string {
  if (/[:#[\]{}>&*!|'"%@`\n\r]/.test(s))
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`
  return s
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    dir: 'my-api-docs',
    force: false,
    skipInstall: false,
    interactive: Boolean(globalThis.process.stdin.isTTY),
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '--force' || arg === '-f') opts.force = true
    else if (arg === '--skip-install') opts.skipInstall = true
    else if (arg === '--no-interactive' || arg === '-y') opts.interactive = false
    else if (arg === '--spec' && argv[i + 1]) opts.spec = argv[++i]
    else if (arg === '--title' && argv[i + 1]) opts.title = argv[++i]
    else if (arg === '--body-inputs') opts.bodyInputs = true
    else if (arg === '--pm' && argv[i + 1]) {
      const pm = argv[++i]!
      if (pm !== 'npm' && pm !== 'pnpm' && pm !== 'yarn' && pm !== 'bun') {
        throw new Error(`Unknown package manager "${pm}". Use one of: npm, pnpm, yarn, bun.`)
      }
      opts.pm = pm
    } else if (!arg.startsWith('-')) {
      opts.dir = arg
    }
  }
  return opts
}
