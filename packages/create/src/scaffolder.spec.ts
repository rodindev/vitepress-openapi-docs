import { mkdtemp, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { scaffoldInto, deriveSpecName, pickDemoEndpoint, run } from './index.js'

const createdDirs: string[] = []

afterEach(() => {
  vi.restoreAllMocks()
  createdDirs.length = 0
})

async function freshTarget(): Promise<string> {
  const parent = await mkdtemp(join(tmpdir(), 'vod-scaffold-'))
  const target = join(parent, 'my-docs')
  createdDirs.push(target)
  return target
}

describe('scaffoldInto', () => {
  it('copies the template tree into a fresh directory and rewrites package.json name', async () => {
    const target = await freshTarget()
    await scaffoldInto(target, { name: 'demo-api-docs' })

    const entries = await readdir(target)
    expect(entries).toEqual(expect.arrayContaining(['package.json', 'docs', 'README.md']))

    const docsEntries = await readdir(join(target, 'docs'))
    expect(docsEntries).toEqual(
      expect.arrayContaining(['.vitepress', 'index.md', 'openapi', 'api'])
    )

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain("from 'vitepress-openapi-docs/vitepress'")
    expect(config).toContain('mock')

    const themeFile = await readFile(join(target, 'docs/.vitepress/theme/index.ts'), 'utf8')
    expect(themeFile).toContain('enhanceAppWithOpenApi')

    const spec = await stat(join(target, 'docs/openapi/mock.json'))
    expect(spec.isFile()).toBe(true)
    expect(spec.size).toBeGreaterThan(0)

    const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('demo-api-docs')
    expect(pkg.dependencies['vitepress-openapi-docs']).toBeDefined()
  })

  it('rewrites config, theme, and pages when custom specs are supplied', async () => {
    const target = await freshTarget()
    await scaffoldInto(target, {
      name: 'demo',
      specs: [{ name: 'chat', source: './specs/chat.yaml' }],
    })

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain("name: 'chat'")
    expect(config).toContain('spec: "./specs/chat.yaml"')
    expect(config).toContain("prefix: '/api/chat'")
    expect(config).toContain("link: '/api/chat/'")
    expect(config).not.toContain('mock')

    const theme = await readFile(join(target, 'docs/.vitepress/theme/index.ts'), 'utf8')
    expect(theme).toContain("'chat': '/api/chat'")
    expect(theme).toContain('SearchTrigger')
    expect(theme).toContain("'nav-bar-content-after'")
    expect(theme).not.toContain('mock')

    const index = await readFile(join(target, 'docs/index.md'), 'utf8')
    expect(index).toContain('link: /api/chat/')
    expect(index).not.toContain('listUsers')
    expect(index).not.toContain('Try it')

    expect(existsSync(join(target, 'docs/openapi/mock.json'))).toBe(false)
    expect(existsSync(join(target, 'docs/api/mock'))).toBe(false)

    const apiIndex = await readFile(join(target, 'docs/api/chat/index.md'), 'utf8')
    expect(apiIndex).toContain('<OpenApiSpec name="chat" />')
  })

  it('picks a demo endpoint from a local JSON spec for the Try it block', async () => {
    const target = await freshTarget()
    const specDir = join(target, '..', 'specs')
    const { mkdir: mk } = await import('node:fs/promises')
    await mk(specDir, { recursive: true })
    const specPath = join(specDir, 'chat.json')
    await writeFile(
      specPath,
      JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'Chat', version: '1.0.0' },
        paths: {
          '/messages': {
            get: { operationId: 'listMessages', responses: { '200': { description: 'ok' } } },
            post: { operationId: 'sendMessage', responses: { '201': { description: 'ok' } } },
          },
          '/messages/{id}': {
            get: { operationId: 'getMessage', responses: { '200': { description: 'ok' } } },
          },
        },
      }),
      'utf8'
    )

    await scaffoldInto(target, {
      name: 'demo',
      specs: [{ name: 'chat', source: specPath }],
    })

    const index = await readFile(join(target, 'docs/index.md'), 'utf8')
    expect(index).toContain('## Try it')
    expect(index).toContain('<OpenApiEndpoint id="listMessages" />')
  })

  it('supports multiple specs with separate API pages and nav entries', async () => {
    const target = await freshTarget()
    await scaffoldInto(target, {
      name: 'demo',
      title: 'Acme APIs',
      specs: [
        { name: 'public', source: 'https://api.example.com/public.json' },
        { name: 'admin', source: './admin.yaml' },
      ],
    })

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain("title: 'Acme APIs'")
    expect(config).toContain("name: 'public'")
    expect(config).toContain("name: 'admin'")
    expect(config).toContain("link: '/api/public/'")
    expect(config).toContain("link: '/api/admin/'")

    const theme = await readFile(join(target, 'docs/.vitepress/theme/index.ts'), 'utf8')
    expect(theme).toContain("'public': '/api/public'")
    expect(theme).toContain("'admin': '/api/admin'")

    expect(existsSync(join(target, 'docs/api/public/index.md'))).toBe(true)
    expect(existsSync(join(target, 'docs/api/admin/index.md'))).toBe(true)
    expect(existsSync(join(target, 'docs/api/mock'))).toBe(false)
  })

  it('rewrites only the title when no custom specs are supplied', async () => {
    const target = await freshTarget()
    await scaffoldInto(target, { name: 'demo', title: 'Chat API' })

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain("title: 'Chat API'")
    expect(config).toContain('mock')

    const index = await readFile(join(target, 'docs/index.md'), 'utf8')
    expect(index).toContain('title: Chat API')
    expect(index).toContain('text: Chat API')

    expect(existsSync(join(target, 'docs/openapi/mock.json'))).toBe(true)
  })

  it('writes bodyInputs defaults into custom-spec config', async () => {
    const target = await freshTarget()
    await scaffoldInto(target, {
      name: 'demo',
      specs: [{ name: 'chat', source: './specs/chat.yaml' }],
      bodyInputs: true,
    })

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain('bodyInputs: true')
  })

  it('writes bodyInputs defaults into template config (mock spec)', async () => {
    const target = await freshTarget()
    await scaffoldInto(target, { name: 'demo', bodyInputs: true })

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain('bodyInputs: true')
    expect(config).toContain('mock')
  })

  it('writes server URL into custom-spec config defaults', async () => {
    const target = await freshTarget()
    await scaffoldInto(target, {
      name: 'demo',
      specs: [{ name: 'chat', source: './specs/chat.yaml' }],
      server: 'https://api.example.com',
    })

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain('server: "https://api.example.com"')
  })

  it('writes server URL into template config defaults (mock spec)', async () => {
    const target = await freshTarget()
    await scaffoldInto(target, { name: 'demo', server: 'https://api.example.com' })

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain('server: "https://api.example.com"')
    expect(config).toContain('mock')
  })

  it('combines server and bodyInputs in defaults', async () => {
    const target = await freshTarget()
    await scaffoldInto(target, {
      name: 'demo',
      specs: [{ name: 'chat', source: './specs/chat.yaml' }],
      server: 'https://api.example.com',
      bodyInputs: true,
    })

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain('server: "https://api.example.com"')
    expect(config).toContain('bodyInputs: true')
  })

  it('omits defaults block when no server or bodyInputs provided', async () => {
    const target = await freshTarget()
    await scaffoldInto(target, {
      name: 'demo',
      specs: [{ name: 'chat', source: './specs/chat.yaml' }],
    })

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).not.toContain('defaults:')
  })

  it('writes into an existing directory when one is already there', async () => {
    const target = await freshTarget()
    const parent = join(target, '..')
    await writeFile(join(parent, 'preexisting.txt'), 'keep me', 'utf8')
    const { mkdir } = await import('node:fs/promises')
    await mkdir(target, { recursive: true })
    await writeFile(join(target, 'NOTES.md'), 'pre-existing', 'utf8')

    await scaffoldInto(target, { name: 'demo' })
    const entries = await readdir(target)
    expect(entries).toEqual(expect.arrayContaining(['NOTES.md', 'package.json', 'docs']))
    expect(await readFile(join(target, 'NOTES.md'), 'utf8')).toBe('pre-existing')
  })

  it('leaves no staging directory behind on success', async () => {
    const target = await freshTarget()
    await scaffoldInto(target, { name: 'demo' })
    const siblings = await readdir(join(target, '..'))
    expect(siblings.filter((s) => s.includes('.vod-staging-'))).toEqual([])
  })

  it('cleans up the staging directory when scaffolding fails partway through', async () => {
    const target = await freshTarget()
    const { chmod, mkdir } = await import('node:fs/promises')
    await mkdir(target, { recursive: true })
    await writeFile(join(target, 'package.json'), '{}', 'utf8')
    await chmod(join(target, 'package.json'), 0o444)

    await scaffoldInto(target, { name: 'demo' })
    const siblings = await readdir(join(target, '..'))
    expect(siblings.filter((s) => s.includes('.vod-staging-'))).toEqual([])
    await chmod(join(target, 'package.json'), 0o644).catch(() => {})
  })

  it('removes any staging artifacts created by aborted prior runs from the same parent dir', async () => {
    const target = await freshTarget()
    await scaffoldInto(target, { name: 'first' })
    await scaffoldInto(target, { name: 'second' })
    const siblings = await readdir(join(target, '..'))
    expect(siblings.filter((s) => s.includes('.vod-staging-'))).toEqual([])
    const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('second')
  })

  it('does not leak staging dirs even when target already exists', async () => {
    const target = await freshTarget()
    const { mkdir } = await import('node:fs/promises')
    await mkdir(target, { recursive: true })
    await scaffoldInto(target, { name: 'demo' })
    const siblings = await readdir(join(target, '..'))
    expect(siblings.filter((s) => s.includes('.vod-staging-'))).toEqual([])
    expect(existsSync(join(target, 'package.json'))).toBe(true)
  })
})

describe('run', () => {
  it('warns when --spec points to a non-existent local file', async () => {
    const target = await freshTarget()
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const exitSpy = vi.spyOn(globalThis.process, 'exit').mockImplementation(() => {
      throw new Error('exit')
    })
    try {
      await run([target, '--spec', '/no/such/file.yaml', '-y', '--skip-install', '--no-git'])
    } catch {
      // process.exit mock throws
    }
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('spec file not found'))
    spy.mockRestore()
    exitSpy.mockRestore()
  })

  it('does not warn when --spec is a URL', async () => {
    const target = await freshTarget()
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const exitSpy = vi.spyOn(globalThis.process, 'exit').mockImplementation(() => {
      throw new Error('exit')
    })
    try {
      await run([
        target,
        '--spec',
        'https://example.com/spec.json',
        '-y',
        '--skip-install',
        '--no-git',
      ])
    } catch {
      // ignore
    }
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
    exitSpy.mockRestore()
  })

  it('prints "npm install" in next steps when --skip-install is used', async () => {
    const target = await freshTarget()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await run([target, '-y', '--skip-install', '--no-git'])
    const output = logSpy.mock.calls.map((c) => c[0]).join('\n')
    expect(output).toContain('npm install')
    logSpy.mockRestore()
  })

  it('omits "npm install" from next steps when dependencies are auto-installed', async () => {
    const target = await freshTarget()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await run([target, '-y', '--no-git'])
    const output = logSpy.mock.calls.map((c) => c[0]).join('\n')
    expect(output).not.toContain('npm install')
    logSpy.mockRestore()
    warnSpy.mockRestore()
  }, 30_000)

  it('passes --server flag through to the scaffolded config', async () => {
    const target = await freshTarget()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await run([
      target,
      '--spec',
      'https://api.example.com/spec.json',
      '--server',
      'https://api.example.com',
      '-y',
      '--skip-install',
      '--no-git',
    ])

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain('server: "https://api.example.com"')
  })

  it('passes --title flag through to the scaffolded config', async () => {
    const target = await freshTarget()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await run([target, '--title', 'Acme API', '-y', '--skip-install', '--no-git'])

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain("title: 'Acme API'")
  })

  it('passes --body-inputs flag through to the scaffolded config', async () => {
    const target = await freshTarget()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await run([target, '--body-inputs', '-y', '--skip-install', '--no-git'])

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain('bodyInputs: true')
  })

  it('combines --server, --title, and --body-inputs flags', async () => {
    const target = await freshTarget()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await run([
      target,
      '--spec',
      'https://example.com/v1/openapi.json',
      '--title',
      'Acme API',
      '--server',
      'https://api.acme.com',
      '--body-inputs',
      '-y',
      '--skip-install',
      '--no-git',
    ])

    const config = await readFile(join(target, 'docs/.vitepress/config.ts'), 'utf8')
    expect(config).toContain("title: 'Acme API'")
    expect(config).toContain('server: "https://api.acme.com"')
    expect(config).toContain('bodyInputs: true')
  })
})

describe('git init', () => {
  it('creates a git repository with an initial commit by default', async () => {
    const target = await freshTarget()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await run([target, '-y', '--skip-install'])

    expect(existsSync(join(target, '.git'))).toBe(true)
    const log = execSync('git log --oneline', { cwd: target, encoding: 'utf8' })
    expect(log.trim()).toContain('Initial commit')
  })

  it('skips git init when --no-git is passed', async () => {
    const target = await freshTarget()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    await run([target, '-y', '--skip-install', '--no-git'])

    expect(existsSync(join(target, '.git'))).toBe(false)
  })

  it('skips git init when scaffolding inside an existing git repository', async () => {
    const target = await freshTarget()
    const parent = join(target, '..')
    execSync('git init', { cwd: parent })

    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await run([target, '-y', '--skip-install'])

    // Should not create a nested .git
    expect(existsSync(join(target, '.git'))).toBe(false)
    // Parent still has .git
    expect(existsSync(join(parent, '.git'))).toBe(true)
  })

  it('tracks all scaffolded files in the initial commit', async () => {
    const target = await freshTarget()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await run([target, '-y', '--skip-install'])

    const status = execSync('git status --porcelain', { cwd: target, encoding: 'utf8' })
    expect(status.trim()).toBe('')
  })
})

describe('install dependencies', () => {
  it('runs npm install and creates node_modules', async () => {
    const target = await freshTarget()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await run([target, '-y', '--no-git'])

    expect(existsSync(join(target, 'node_modules'))).toBe(true)
  }, 30_000)

  it('skips install when --skip-install is passed', async () => {
    const target = await freshTarget()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    await run([target, '-y', '--skip-install', '--no-git'])

    expect(existsSync(join(target, 'node_modules'))).toBe(false)
  })
})

describe('deriveSpecName', () => {
  it('extracts name from a JSON filename', () => {
    expect(deriveSpecName('chat-openapi.json')).toBe('chat-openapi')
  })

  it('extracts name from a YAML filename', () => {
    expect(deriveSpecName('my-api.yaml')).toBe('my-api')
  })

  it('extracts name from a full path', () => {
    expect(deriveSpecName('/Users/me/specs/admin-api.json')).toBe('admin-api')
  })

  it('extracts name from a URL', () => {
    expect(deriveSpecName('https://api.example.com/v1/openapi.json')).toBe('openapi')
  })

  it('handles names with only special characters', () => {
    expect(deriveSpecName('...json')).toBe('api')
  })

  it('lowercases the name', () => {
    expect(deriveSpecName('MyAPI.yaml')).toBe('myapi')
  })

  it('strips query strings and fragments from URLs', () => {
    expect(deriveSpecName('https://example.com/api.json?version=2#section')).toBe('api')
  })

  it('handles .yml extension', () => {
    expect(deriveSpecName('openapi.yml')).toBe('openapi')
  })
})

describe('pickDemoEndpoint', () => {
  it('returns undefined for a URL', async () => {
    expect(await pickDemoEndpoint('https://api.example.com/openapi.json')).toBeUndefined()
  })

  it('returns undefined for a non-existent file', async () => {
    expect(await pickDemoEndpoint('/no/such/file.json')).toBeUndefined()
  })

  it('prefers list-style GET operations', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vod-pick-'))
    createdDirs.push(dir)
    const specPath = join(dir, 'api.json')
    await writeFile(
      specPath,
      JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users/{id}': {
            get: { operationId: 'getUser', responses: {} },
          },
          '/users': {
            get: { operationId: 'listUsers', responses: {} },
            post: { operationId: 'createUser', responses: {} },
          },
        },
      }),
      'utf8'
    )
    expect(await pickDemoEndpoint(specPath)).toBe('listUsers')
  })

  it('falls back to the first GET when no list operation exists', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vod-pick-'))
    createdDirs.push(dir)
    const specPath = join(dir, 'api.json')
    await writeFile(
      specPath,
      JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/health': {
            get: { operationId: 'healthCheck', responses: {} },
          },
          '/users/{id}': {
            get: { operationId: 'getUser', responses: {} },
          },
        },
      }),
      'utf8'
    )
    const result = await pickDemoEndpoint(specPath)
    expect(result).toBeDefined()
    expect(['healthCheck', 'getUser']).toContain(result)
  })

  it('returns undefined when spec has no GET operations', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vod-pick-'))
    createdDirs.push(dir)
    const specPath = join(dir, 'api.json')
    await writeFile(
      specPath,
      JSON.stringify({
        openapi: '3.0.3',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/users': {
            post: { operationId: 'createUser', responses: {} },
          },
        },
      }),
      'utf8'
    )
    expect(await pickDemoEndpoint(specPath)).toBeUndefined()
  })

  it('returns undefined for invalid JSON', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vod-pick-'))
    createdDirs.push(dir)
    const specPath = join(dir, 'broken.json')
    await writeFile(specPath, 'not valid json', 'utf8')
    expect(await pickDemoEndpoint(specPath)).toBeUndefined()
  })

  it('returns undefined when paths is empty', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vod-pick-'))
    createdDirs.push(dir)
    const specPath = join(dir, 'empty.json')
    await writeFile(
      specPath,
      JSON.stringify({ openapi: '3.0.3', info: { title: 'T', version: '1' }, paths: {} }),
      'utf8'
    )
    expect(await pickDemoEndpoint(specPath)).toBeUndefined()
  })
})
