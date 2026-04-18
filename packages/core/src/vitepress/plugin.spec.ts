import { mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { openApiDocs } from './plugin'

const publicYaml = `
openapi: 3.0.3
info: { title: Public, version: 1.0.0 }
servers: [{ url: https://api.example.com }]
paths:
  /users:
    get:
      operationId: users.list
      tags: [users]
      responses:
        '200': { description: ok }
`.trimStart()

const webhooksYaml = `
openapi: 3.0.3
info: { title: Webhooks, version: 1.0.0 }
servers: [{ url: https://hooks.example.com }]
paths:
  /user.created:
    post:
      operationId: userCreated
      tags: [user]
      responses:
        '200': { description: ok }
`.trimStart()

async function setupFixture(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'vod-plugin-'))
  await mkdir(join(dir, 'openapi'), { recursive: true })
  await writeFile(join(dir, 'openapi/public.yaml'), publicYaml, 'utf8')
  await writeFile(join(dir, 'openapi/webhooks.yaml'), webhooksYaml, 'utf8')
  return dir
}

describe('openApiDocs (integration)', () => {
  it('parses every configured spec, generates pages per prefix, and emits a grouped sidebar', async () => {
    const srcDir = await setupFixture()
    const config = (await openApiDocs(
      {
        specs: [
          { name: 'public', spec: join(srcDir, 'openapi/public.yaml'), prefix: '/api/public' },
          { name: 'hooks', spec: join(srcDir, 'openapi/webhooks.yaml'), prefix: '/api/hooks' },
        ],
      },
      { srcDir }
    )) as {
      themeConfig: {
        sidebar: Record<
          string,
          { text: string; items: { text: string; items: { link: string }[] }[] }[]
        >
      }
      vite: { plugins: unknown[] }
      rewrites: Record<string, string>
    }

    const publicDir = await readdir(join(srcDir, '_openapi/api/public'))
    const hooksDir = await readdir(join(srcDir, '_openapi/api/hooks'))
    expect(publicDir).toEqual(['users.list.md'])
    expect(hooksDir).toEqual(['userCreated.md'])

    const page = await readFile(join(srcDir, '_openapi/api/public/users.list.md'), 'utf8')
    expect(page).toContain('<OpenApiEndpoint id="public.users.list" />')

    // sidebar is keyed by path prefix — each spec + schemas + changelog get their own key
    const sidebar = config.themeConfig.sidebar
    expect(sidebar['/api/public/']).toBeDefined()
    expect(sidebar['/api/hooks/']).toBeDefined()
    expect(sidebar['/schemas/public/']).toBeDefined()
    expect(sidebar['/schemas/hooks/']).toBeDefined()
    // Each prefix key gets its own spec's sidebar (per-spec, not all-specs)
    const publicGroups = sidebar['/api/public/']!
    expect(publicGroups.length).toBeGreaterThanOrEqual(1)
    // First group is the tag group containing the operation
    expect(publicGroups[0]?.items[0]?.link).toBe('/api/public/users.list')
    const hooksGroups = sidebar['/api/hooks/']!
    expect(hooksGroups.length).toBeGreaterThanOrEqual(1)
    expect(hooksGroups[0]?.items[0]?.link).toBe('/api/hooks/userCreated')

    expect(config.vite.plugins).toHaveLength(2)
    const changelogPage = await readFile(join(srcDir, '_openapi/changelog/public.md'), 'utf8')
    expect(changelogPage).toContain('<OpenApiChangelog name="public" />')

    // rewrites map source-relative paths under the generated dir back to the public URL
    expect(config.rewrites['_openapi/api/public/users.list.md']).toBe('api/public/users.list.md')
    expect(config.rewrites['_openapi/api/hooks/userCreated.md']).toBe('api/hooks/userCreated.md')
  })

  it('throws when a hand-written markdown page references an unknown operation id', async () => {
    const srcDir = await setupFixture()
    await writeFile(
      join(srcDir, 'guide.md'),
      '<OpenApiEndpoint id="public.definitely-not-here" />\n',
      'utf8'
    )
    await expect(
      openApiDocs(
        {
          specs: [
            { name: 'public', spec: join(srcDir, 'openapi/public.yaml'), prefix: '/api/public' },
          ],
        },
        { srcDir, onBrokenEmbed: 'error' }
      )
    ).rejects.toThrow(/broken <OpenApiEndpoint> embed/)
  })

  it('converts an AbortSignal.timeout rejection into an actionable error', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => {
      const err = new Error('The operation was aborted') as Error & { name: string }
      err.name = 'TimeoutError'
      throw err
    }) as typeof fetch
    try {
      await expect(
        openApiDocs(
          { specs: [{ name: 'remote', spec: 'https://example.test/openapi.yaml' }] },
          { srcDir: await mkdtemp(join(tmpdir(), 'vod-url-')), onBrokenEmbed: 'ignore' }
        )
      ).rejects.toThrow(/Timed out fetching spec "remote" from https:\/\/example\.test/)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('wraps non-timeout fetch errors with source context', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => {
      throw new TypeError('fetch failed')
    }) as typeof fetch
    try {
      await expect(
        openApiDocs(
          { specs: [{ name: 'remote', spec: 'https://example.test/openapi.yaml' }] },
          { srcDir: await mkdtemp(join(tmpdir(), 'vod-url-')), onBrokenEmbed: 'ignore' }
        )
      ).rejects.toThrow(/Could not fetch spec "remote" from https:\/\/example\.test/)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('provides a descriptive error when the spec file does not exist', async () => {
    const srcDir = await mkdtemp(join(tmpdir(), 'vod-missing-'))
    await expect(
      openApiDocs(
        { specs: [{ name: 'ghost', spec: '/tmp/does-not-exist-vod-test.yaml' }] },
        { srcDir, onBrokenEmbed: 'ignore' }
      )
    ).rejects.toThrow(/Could not load spec "ghost": file not found/)
  })

  it('warns but does not fail when onBrokenEmbed is "warn"', async () => {
    const srcDir = await setupFixture()
    await writeFile(join(srcDir, 'guide.md'), '<OpenApiEndpoint id="public.nope" />\n', 'utf8')
    const warnings: string[] = []
    const originalWarn = console.warn
    console.warn = (message: unknown) => warnings.push(String(message))
    try {
      await openApiDocs(
        {
          specs: [
            { name: 'public', spec: join(srcDir, 'openapi/public.yaml'), prefix: '/api/public' },
          ],
        },
        { srcDir, onBrokenEmbed: 'warn' }
      )
    } finally {
      console.warn = originalWarn
    }
    expect(warnings.some((w) => w.includes('broken <OpenApiEndpoint>'))).toBe(true)
  })

  it('throws when multi-API specs are missing a prefix', async () => {
    const dir = await setupFixture()
    await expect(
      openApiDocs(
        {
          specs: [
            { name: 'alpha', spec: join(dir, 'openapi/public.yaml') },
            { name: 'beta', spec: join(dir, 'openapi/public.yaml') },
          ],
        },
        { srcDir: dir }
      )
    ).rejects.toThrow(/Missing prefix.*alpha.*beta/)
  })
})
