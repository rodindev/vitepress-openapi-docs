import { execFileSync } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { extractChangelog } from './extractor'

const baseYaml = `
openapi: 3.0.3
info:
  title: Petstore
  version: 1.0.0
  description: Starter
servers:
  - url: https://api.example.com
paths:
  /pets:
    get:
      operationId: listPets
      summary: List pets
      responses:
        '200': { description: ok }
`.trim()

const afterAddYaml = `
openapi: 3.0.3
info:
  title: Petstore
  version: 1.0.1
  description: Starter
paths:
  /pets:
    get:
      operationId: listPets
      summary: List pets
      responses:
        '200': { description: ok }
  /pets/{id}:
    get:
      operationId: getPet
      summary: Get a pet
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      responses:
        '200': { description: ok }
`.trim()

const afterRemoveAndRenameYaml = `
openapi: 3.0.3
info:
  title: Petstore
  version: 1.1.0
  description: Rewritten
paths:
  /pets:
    get:
      operationId: listAllPets
      summary: List every pet in the system
      responses:
        '200': { description: ok }
`.trim()

async function setupRepo(): Promise<{ cwd: string; specPath: string }> {
  const cwd = await mkdtemp(join(tmpdir(), 'vod-changelog-'))
  const specPath = 'openapi.yaml'
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd, stdio: 'pipe', env: { ...globalThis.process.env, HOME: cwd } })
  git('init', '-b', 'main')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'Test')
  git('config', 'commit.gpgsign', 'false')

  await writeFile(join(cwd, specPath), baseYaml, 'utf8')
  git('add', '.')
  git('commit', '-m', 'initial: add Petstore spec')

  await writeFile(join(cwd, specPath), afterAddYaml, 'utf8')
  git('add', '.')
  git('commit', '-m', 'feat: add getPet endpoint')

  await writeFile(join(cwd, specPath), afterRemoveAndRenameYaml, 'utf8')
  git('add', '.')
  git('commit', '-m', 'refactor: rewrite listing, drop getPet')

  return { cwd, specPath }
}

describe('extractChangelog', () => {
  let repo: { cwd: string; specPath: string }

  beforeAll(async () => {
    repo = await setupRepo()
  })

  afterAll(() => {
    // Temp dirs from mkdtemp clean up on their own on most systems.
  })

  it('returns an empty result when the file has fewer than 2 commits', async () => {
    const fresh = await mkdtemp(join(tmpdir(), 'vod-empty-'))
    execFileSync('git', ['init', '-b', 'main'], { cwd: fresh, stdio: 'pipe' })
    execFileSync('git', ['config', 'user.email', 't@t'], { cwd: fresh, stdio: 'pipe' })
    execFileSync('git', ['config', 'user.name', 't'], { cwd: fresh, stdio: 'pipe' })
    await writeFile(join(fresh, 'openapi.yaml'), baseYaml, 'utf8')
    execFileSync('git', ['add', '.'], { cwd: fresh, stdio: 'pipe' })
    execFileSync('git', ['commit', '-m', 'initial', '--no-gpg-sign'], {
      cwd: fresh,
      stdio: 'pipe',
    })
    const result = await extractChangelog({
      specPath: 'openapi.yaml',
      specName: 'petstore',
      cwd: fresh,
    })
    expect(result.isEmpty).toBe(true)
    expect(result.entries).toEqual([])
  })

  it('reports added operations between commits', async () => {
    const result = await extractChangelog({
      specPath: repo.specPath,
      specName: 'petstore',
      cwd: repo.cwd,
    })
    const addEntry = result.entries.find((e) => e.subject.startsWith('feat: add getPet'))
    expect(addEntry?.operations.some((o) => o.kind === 'added' && o.operationId === 'getPet')).toBe(
      true
    )
  })

  it('reports removed operations between commits', async () => {
    const result = await extractChangelog({
      specPath: repo.specPath,
      specName: 'petstore',
      cwd: repo.cwd,
    })
    const removeEntry = result.entries.find((e) => e.subject.startsWith('refactor'))
    expect(
      removeEntry?.operations.some((o) => o.kind === 'removed' && o.operationId === 'getPet')
    ).toBe(true)
  })

  it('detects operationId renames when the route stays stable', async () => {
    const result = await extractChangelog({
      specPath: repo.specPath,
      specName: 'petstore',
      cwd: repo.cwd,
    })
    const renameEntry = result.entries.find((e) => e.operations.some((o) => o.kind === 'renamed'))
    expect(renameEntry).toBeDefined()
    const rename = renameEntry?.operations.find((o) => o.kind === 'renamed')
    expect(rename?.previousOperationId).toBe('listPets')
    expect(rename?.operationId).toBe('listAllPets')
  })

  it('captures info.version and info.description changes', async () => {
    const result = await extractChangelog({
      specPath: repo.specPath,
      specName: 'petstore',
      cwd: repo.cwd,
    })
    const versionChanges = result.entries.flatMap((e) => e.info).filter((i) => i.kind === 'version')
    expect(versionChanges.length).toBeGreaterThanOrEqual(2)
    expect(versionChanges.some((c) => c.after === '1.0.1')).toBe(true)
    expect(versionChanges.some((c) => c.after === '1.1.0')).toBe(true)
  })

  it('orders entries newest-first (matching git log default)', async () => {
    const result = await extractChangelog({
      specPath: repo.specPath,
      specName: 'petstore',
      cwd: repo.cwd,
    })
    expect(result.entries[0]?.subject).toContain('refactor')
    expect(result.entries.at(-1)?.subject).toContain('feat: add getPet')
  })

  it('returns isEmpty: true when the spec path does not exist in the repo', async () => {
    const result = await extractChangelog({
      specPath: 'does/not/exist.yaml',
      specName: 'nope',
      cwd: repo.cwd,
    })
    expect(result.isEmpty).toBe(true)
  })
})
