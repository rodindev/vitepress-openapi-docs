import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { detectPackageManager } from './detect-pm.js'
import { clack, handleCancel } from './prompt.js'
import {
  deriveSpecName,
  isGitAvailable,
  isInsideGitRepo,
  scaffoldInto,
  validateSpecUrl,
} from './scaffolder.js'
import {
  promptBodyInputs,
  promptGitInit,
  promptServer,
  promptSpecs,
  promptTitle,
} from './prompts.js'
import type { SpecEntry } from './generators.js'

const execAsync = promisify(exec)

interface CliOptions {
  /** Target directory (positional arg). */
  dir: string
  /** Allow scaffold into a non-empty directory without prompting. */
  force: boolean
  /** Package manager override. */
  pm?: 'npm' | 'pnpm' | 'yarn' | 'bun'
  /** Skip dependency installation. */
  skipInstall: boolean
  /** Skip git init. */
  git: boolean
  /** When false, do not read from stdin (for CI / scripted use). */
  interactive: boolean
  /** Override spec path/URL written into the scaffold (skips the prompt). */
  spec?: string
  /** Override site title. */
  title?: string
  /** Override server base URL. */
  server?: string
  /** Use form inputs for request bodies instead of a JSON textarea. */
  bodyInputs?: boolean
}

export async function run(argv: string[]): Promise<void> {
  checkNodeVersion()
  const opts = parseArgs(argv)
  const target = resolve(globalThis.process.cwd(), opts.dir)

  if (opts.interactive) clack.intro('create-vitepress-openapi-docs')

  if (existsSync(target) && !opts.force) {
    if (!opts.interactive) {
      console.error(
        `[create-vitepress-openapi-docs] Target directory "${target}" already exists. ` +
          'Pass --force to scaffold into it anyway.'
      )
      globalThis.process.exit(1)
    }
    const proceed = await clack.confirm({
      message: `Directory "${opts.dir}" already exists. Scaffold into it anyway?`,
      initialValue: false,
    })
    handleCancel(proceed)
    if (!proceed) {
      clack.outro('Aborted.')
      return
    }
  }

  let title = opts.title
  let specs: SpecEntry[] | undefined
  let server = opts.server
  let bodyInputs = opts.bodyInputs

  if (opts.spec) {
    const specName = deriveSpecName(opts.spec)
    specs = [{ name: specName, source: opts.spec }]
  } else if (opts.interactive) {
    title = title ?? (await promptTitle())
    specs = await promptSpecs()
  }

  if (server === undefined && opts.interactive) {
    server = await promptServer()
  }

  if (server && !/^https?:\/\//i.test(server.trim())) {
    console.error('[create-vitepress-openapi-docs] --server must be an HTTP(S) URL.')
    globalThis.process.exit(1)
  }

  if (bodyInputs === undefined && opts.interactive) {
    bodyInputs = await promptBodyInputs()
  }

  for (const entry of specs ?? []) {
    if (/^https?:\/\//i.test(entry.source)) {
      await validateSpecUrl(entry.source, entry.name, opts.interactive)
    } else {
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
    server,
    bodyInputs,
  })

  const pm = opts.pm ?? detectPackageManager()

  if (!opts.skipInstall) {
    await installDependencies(target, pm, opts.interactive)
  }

  let shouldGit = opts.git
  if (shouldGit && opts.interactive) {
    shouldGit = await promptGitInit(target)
  }
  if (shouldGit) {
    await initGit(target, opts.interactive)
  }

  if (opts.interactive) {
    clack.outro('Done! Your API docs are ready.')
  } else {
    console.log(`\n  ✓ Scaffolded into ${target}`)
  }

  console.log('\nNext steps:')
  console.log(`  cd ${opts.dir}`)
  if (opts.skipInstall) console.log(`  ${pm} install`)
  console.log(`  ${pm} run dev\n`)
}

function checkNodeVersion(): void {
  const required = 18
  const current = parseInt(globalThis.process.versions.node, 10)
  if (current < required) {
    console.error(
      `[create-vitepress-openapi-docs] Node.js v${required}+ is required (current: v${globalThis.process.versions.node}).`
    )
    globalThis.process.exit(1)
  }
}

async function installDependencies(dir: string, pm: string, interactive: boolean): Promise<void> {
  const s = interactive ? clack.spinner() : undefined
  s?.start('Installing dependencies...')
  try {
    await execAsync(`${pm} install`, { cwd: dir })
    s?.stop('Dependencies installed')
  } catch {
    s?.stop('Failed to install dependencies')
    if (interactive) {
      clack.log.warn(
        `Could not run "${pm} install". Run it manually after cd-ing into the project.`
      )
    } else {
      console.warn(
        `[create-vitepress-openapi-docs] Warning: "${pm} install" failed. Run it manually.`
      )
    }
  }
}

async function initGit(dir: string, interactive: boolean): Promise<void> {
  if (!(await isGitAvailable())) return
  if (await isInsideGitRepo(dir)) return

  const s = interactive ? clack.spinner() : undefined
  s?.start('Initializing git...')
  try {
    await execAsync('git init', { cwd: dir })
    await execAsync('git add -A', { cwd: dir })
    await execAsync(
      'git -c user.name="vitepress-openapi-docs" -c user.email="noreply@users.noreply.github.com" commit -m "Initial commit"',
      { cwd: dir }
    )
    s?.stop('Git initialized with initial commit')
  } catch {
    s?.stop('Failed to initialize git')
    if (!interactive) {
      console.warn(
        '[create-vitepress-openapi-docs] Warning: git initialization failed. Run "git init" manually.'
      )
    }
  }
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    dir: 'my-api-docs',
    force: false,
    skipInstall: false,
    git: true,
    interactive: Boolean(globalThis.process.stdin.isTTY),
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '--force' || arg === '-f') opts.force = true
    else if (arg === '--skip-install') opts.skipInstall = true
    else if (arg === '--no-git') opts.git = false
    else if (arg === '--no-interactive' || arg === '-y') opts.interactive = false
    else if (arg === '--spec' && argv[i + 1]) opts.spec = argv[++i]
    else if (arg === '--title' && argv[i + 1]) opts.title = argv[++i]
    else if (arg === '--server' && argv[i + 1]) opts.server = argv[++i]
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
