import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
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

  const specSource = opts.spec ?? (opts.interactive ? await promptSpec() : undefined)

  if (specSource && !/^https?:\/\//i.test(specSource)) {
    const resolved = resolve(globalThis.process.cwd(), specSource)
    if (!existsSync(resolved)) {
      console.warn(
        `[create-vitepress-openapi-docs] Warning: spec file not found at "${resolved}". ` +
          'The path will be written into config.ts, but VitePress will fail to load it at dev/build time.'
      )
    }
  }

  await scaffoldInto(target, {
    name: opts.dir.replace(/[^\w-]+/g, '-') || 'my-api-docs',
    spec: specSource,
  })

  const pm = opts.pm ?? detectPackageManager()
  console.log(`\n  ✓ Scaffolded into ${target}`)
  console.log('\nNext steps:')
  console.log(`  cd ${opts.dir}`)
  if (!opts.skipInstall) console.log(`  ${pm} install`)
  console.log(`  ${pm} run dev\n`)
}

async function promptSpec(): Promise<string | undefined> {
  const answer = await prompt(
    'Path or URL to your OpenAPI spec (leave blank to use the bundled mock spec): ',
    ''
  )
  return answer.trim() || undefined
}

export interface ScaffoldOptions {
  /** Name written into the generated package.json. */
  name: string
  /** Optional override for the spec path/URL referenced from the generated config. */
  spec?: string
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
    if (options.spec) await rewriteSpecReference(staging, options.spec)

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

async function rewriteSpecReference(dir: string, specSource: string): Promise<void> {
  const configPath = join(dir, 'docs/.vitepress/config.ts')
  const original = await readFile(configPath, 'utf8')
  const replaced = original.replace(/spec:\s*['"][^'"]+['"]/, `spec: ${JSON.stringify(specSource)}`)
  await writeFile(configPath, replaced, 'utf8')
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
