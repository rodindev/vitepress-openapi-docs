import { mkdtemp, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { generatePages } from './page-generator'
import type { ParsedOperation, ParsedSpec } from '../parser/types'

const op = (id: string, summary?: string): ParsedOperation => ({
  id,
  operationId: id,
  method: 'get',
  path: `/${id}`,
  summary,
  tags: [],
  parameters: [],
  responses: [],
  requestSchemaRefs: {},
  responseSchemaRefs: {},
  defaultServer: '',
  security: [],
  deprecated: false,
})

const spec = (name: string, ops: ParsedOperation[]): ParsedSpec => ({
  name,
  title: name,
  version: '1.0.0',
  servers: [],
  operations: ops,
  componentSchemas: {},
  securitySchemes: {},
})

describe('generatePages', () => {
  it('emits one page per operation under the configured prefix', async () => {
    const out = await mkdtemp(join(tmpdir(), 'vod-gen-'))
    const pages = await generatePages([spec('public', [op('users.list', 'List users')])], {
      outDir: out,
      prefixes: { public: '/api/public' },
    })
    expect(pages).toEqual([
      { file: 'api/public/users.list.md', url: '/api/public/users.list' },
      { file: 'changelog/public.md', url: '/changelog/public' },
    ])
    const body = await readFile(join(out, 'api/public/users.list.md'), 'utf8')
    expect(body).toContain('title: "List users"')
    expect(body).toContain('editLink: false')
    expect(body).toContain('prev: false')
    expect(body).toContain('next: false')
    expect(body).toContain('<OpenApiEndpoint id="public.users.list" />')
  })

  it('falls back to /api/{name} when no prefix is supplied', async () => {
    const out = await mkdtemp(join(tmpdir(), 'vod-gen-'))
    const pages = await generatePages([spec('webhooks', [op('petCreated')])], { outDir: out })
    expect(pages[0]?.url).toBe('/api/webhooks/petCreated')
  })

  it('emits a changelog page per spec', async () => {
    const out = await mkdtemp(join(tmpdir(), 'vod-gen-'))
    const pages = await generatePages(
      [spec('public', [op('users.list')]), spec('admin', [op('roles.list')])],
      { outDir: out, prefixes: { public: '/api/public', admin: '/api/admin' } }
    )
    const changelogUrls = pages.filter((p) => p.url.startsWith('/changelog/')).map((p) => p.url)
    expect(changelogUrls.sort()).toEqual(['/changelog/admin', '/changelog/public'])
    const body = await readFile(join(out, 'changelog/public.md'), 'utf8')
    expect(body).toContain('<OpenApiChangelog name="public" />')
  })

  it('keeps specs isolated under their own prefix when multiple are generated', async () => {
    const out = await mkdtemp(join(tmpdir(), 'vod-gen-'))
    await generatePages(
      [spec('public', [op('users.list')]), spec('admin', [op('users.list'), op('roles.list')])],
      { outDir: out, prefixes: { public: '/api/public', admin: '/api/admin' } }
    )
    const publicDir = await readdir(join(out, 'api/public'))
    const adminDir = await readdir(join(out, 'api/admin'))
    expect(publicDir).toEqual(['users.list.md'])
    expect(adminDir.sort()).toEqual(['roles.list.md', 'users.list.md'])
  })

  it('safely escapes YAML-special characters in frontmatter titles', async () => {
    const exotic = op('exotic', '{Products} & [beta] !important "v2"')
    const out = await mkdtemp(join(tmpdir(), 'vod-gen-'))
    await generatePages([spec('test', [exotic])], { outDir: out, prefixes: { test: '/api/test' } })
    const body = await readFile(join(out, 'api/test/exotic.md'), 'utf8')
    expect(body).toContain('title: ')
    // The title must be JSON-quoted to survive YAML parsing
    expect(body).toMatch(/title: ".*Products.*beta.*important.*v2.*"/)
  })

  it('wipes the output directory before regenerating', async () => {
    const out = await mkdtemp(join(tmpdir(), 'vod-gen-'))
    await generatePages([spec('public', [op('users.list')])], {
      outDir: out,
      prefixes: { public: '/api/public' },
    })
    await generatePages([spec('public', [op('users.get')])], {
      outDir: out,
      prefixes: { public: '/api/public' },
    })
    const files = await readdir(join(out, 'api/public'))
    expect(files).toEqual(['users.get.md'])
  })
})
