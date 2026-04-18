import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanForBrokenEmbeds } from './scanner'
import type { ParsedSpec } from '../parser/types'

const op = (id: string) => ({
  id,
  operationId: id,
  method: 'get' as const,
  path: `/${id}`,
  tags: [],
  parameters: [],
  responses: [],
  defaultServer: '',
  security: [],
  deprecated: false,
})

const spec: ParsedSpec = {
  name: 'public',
  title: 'Public',
  version: '1.0.0',
  servers: [],
  operations: [op('users.list')],
  securitySchemes: {},
}

async function makeTempDocs(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'vod-scanner-'))
  for (const [name, content] of Object.entries(files)) {
    const fullPath = join(dir, name)
    await mkdir(join(fullPath, '..'), { recursive: true })
    await writeFile(fullPath, content, 'utf8')
  }
  return dir
}

describe('scanForBrokenEmbeds', () => {
  it('returns an empty list when every embed resolves', async () => {
    const dir = await makeTempDocs({
      'index.md': '<OpenApiEndpoint id="public.users.list" />',
      'users.md': "<OpenApiEndpoint id='users.list' />",
    })
    expect(await scanForBrokenEmbeds(dir, [spec])).toEqual([])
  })

  it('reports unknown ids with file path and line number', async () => {
    const dir = await makeTempDocs({
      'guide/auth.md': 'Hello\n\n<OpenApiEndpoint id="public.unknown" />\n',
    })
    const broken = await scanForBrokenEmbeds(dir, [spec])
    expect(broken).toEqual([{ file: 'guide/auth.md', line: 3, id: 'public.unknown' }])
  })

  it('skips ignored directories like node_modules and .vitepress', async () => {
    const dir = await makeTempDocs({
      'node_modules/leaked.md': '<OpenApiEndpoint id="public.unknown" />',
      '.vitepress/cache/page.md': '<OpenApiEndpoint id="public.unknown" />',
      'good.md': '<OpenApiEndpoint id="public.users.list" />',
    })
    expect(await scanForBrokenEmbeds(dir, [spec])).toEqual([])
  })

  it('resolves ids qualified with any registered spec', async () => {
    const admin: ParsedSpec = { ...spec, name: 'admin', operations: [op('roles.list')] }
    const dir = await makeTempDocs({
      'a.md': '<OpenApiEndpoint id="public.users.list" />',
      'b.md': '<OpenApiEndpoint id="admin.roles.list" />',
      'c.md': '<OpenApiEndpoint id="admin.users.list" />',
    })
    const broken = await scanForBrokenEmbeds(dir, [spec, admin])
    expect(broken.map((b) => b.file)).toEqual(['c.md'])
  })

  it('ignores embed examples inside fenced code blocks', async () => {
    const dir = await makeTempDocs({
      'guide.md': [
        '# Guide',
        '',
        '```md',
        '<OpenApiEndpoint id="this.is.not.real" />',
        '```',
        '',
        'Real usage:',
        '<OpenApiEndpoint id="public.users.list" />',
      ].join('\n'),
    })
    expect(await scanForBrokenEmbeds(dir, [spec])).toEqual([])
  })

  it('ignores embed examples wrapped in inline backticks', async () => {
    const dir = await makeTempDocs({
      'index.md': 'Use `<OpenApiEndpoint id="..." />` anywhere in markdown.',
    })
    expect(await scanForBrokenEmbeds(dir, [spec])).toEqual([])
  })

  it('still catches broken embeds on the same line as inline-code examples', async () => {
    const dir = await makeTempDocs({
      'mixed.md':
        'Like `<OpenApiEndpoint id="example" />` — real call: <OpenApiEndpoint id="public.missing" />',
    })
    const broken = await scanForBrokenEmbeds(dir, [spec])
    expect(broken).toHaveLength(1)
    expect(broken[0]?.id).toBe('public.missing')
  })

  it('handles tilde fences and nested fence markers', async () => {
    const dir = await makeTempDocs({
      'guide.md': ['~~~md', '<OpenApiEndpoint id="this.does.not.exist" />', '~~~'].join('\n'),
    })
    expect(await scanForBrokenEmbeds(dir, [spec])).toEqual([])
  })
})
