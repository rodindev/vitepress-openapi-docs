import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { parseSpec } from '../parser/index'
import type { ChangelogEntry, InfoChange, OperationChange, SpecChangelog } from './types'
import type { ParsedOperation, ParsedSpec } from '../parser/types'

const run = promisify(execFile)

export interface ExtractChangelogOptions {
  /** Spec file path, relative to the git working tree. */
  specPath: string
  /** Spec name (matches `OpenApiSpecConfig.name`). */
  specName: string
  /** Git working tree root. Defaults to `process.cwd()`. */
  cwd?: string
  /** Upper bound on commits to walk. Defaults to 200. */
  maxEntries?: number
}

export async function extractChangelog(options: ExtractChangelogOptions): Promise<SpecChangelog> {
  const cwd = options.cwd ?? globalThis.process.cwd()
  const max = options.maxEntries ?? 200

  const commits = await listCommits(options.specPath, cwd, max)
  if (commits.length < 2) {
    return { specName: options.specName, entries: [], isEmpty: true }
  }

  const entries: ChangelogEntry[] = []
  for (let i = 0; i < commits.length - 1; i++) {
    const current = commits[i]!
    const previous = commits[i + 1]!
    try {
      const [newContent, oldContent] = await Promise.all([
        showAt(current.hash, options.specPath, cwd),
        showAt(previous.hash, options.specPath, cwd),
      ])
      const [newSpec, oldSpec] = await Promise.all([
        parseSpec(newContent, { name: options.specName }),
        parseSpec(oldContent, { name: options.specName }),
      ])
      const info = diffInfo(oldSpec, newSpec)
      const operations = diffOperations(oldSpec, newSpec)
      if (info.length === 0 && operations.length === 0) continue
      entries.push({
        commit: current.hash.slice(0, 7),
        date: current.date,
        subject: current.subject,
        info,
        operations,
      })
    } catch {
      // A commit where the spec didn't parse still shouldn't crash the build.
      continue
    }
  }

  return { specName: options.specName, entries, isEmpty: false }
}

async function listCommits(
  specPath: string,
  cwd: string,
  max: number
): Promise<{ hash: string; date: string; subject: string }[]> {
  try {
    const { stdout } = await run(
      'git',
      ['log', `-n${max}`, '--follow', '--format=%H%x1f%aI%x1f%s', '--', specPath],
      { cwd, maxBuffer: 16 * 1024 * 1024 }
    )
    const commits: { hash: string; date: string; subject: string }[] = []
    for (const line of stdout.split('\n')) {
      if (!line) continue
      const [hash, date, subject] = line.split('\x1f')
      if (hash && date && subject !== undefined) commits.push({ hash, date, subject })
    }
    return commits
  } catch {
    return []
  }
}

async function showAt(hash: string, specPath: string, cwd: string): Promise<string> {
  const { stdout } = await run('git', ['show', `${hash}:${specPath}`], {
    cwd,
    maxBuffer: 16 * 1024 * 1024,
  })
  return stdout
}

function diffInfo(oldSpec: ParsedSpec, newSpec: ParsedSpec): InfoChange[] {
  const changes: InfoChange[] = []
  if (oldSpec.title !== newSpec.title) {
    changes.push({ kind: 'title', before: oldSpec.title, after: newSpec.title })
  }
  if (oldSpec.version !== newSpec.version) {
    changes.push({ kind: 'version', before: oldSpec.version, after: newSpec.version })
  }
  if (oldSpec.description !== newSpec.description) {
    changes.push({
      kind: 'description',
      before: oldSpec.description,
      after: newSpec.description,
    })
  }
  return changes
}

function diffOperations(oldSpec: ParsedSpec, newSpec: ParsedSpec): OperationChange[] {
  const oldById = new Map(oldSpec.operations.map((op) => [op.id, op]))
  const newById = new Map(newSpec.operations.map((op) => [op.id, op]))
  const oldByRoute = new Map(oldSpec.operations.map((op) => [routeKey(op), op]))
  const newByRoute = new Map(newSpec.operations.map((op) => [routeKey(op), op]))

  const changes: OperationChange[] = []
  const seenOld = new Set<string>()
  const seenNew = new Set<string>()

  // Direct id matches: compare summary/description
  for (const [id, newOp] of newById) {
    const oldOp = oldById.get(id)
    if (!oldOp) continue
    seenOld.add(id)
    seenNew.add(id)
    if ((oldOp.summary ?? '') !== (newOp.summary ?? '')) {
      changes.push({
        kind: 'summary',
        operationId: id,
        before: oldOp.summary,
        after: newOp.summary,
      })
    }
    if ((oldOp.description ?? '') !== (newOp.description ?? '')) {
      changes.push({
        kind: 'description',
        operationId: id,
        before: oldOp.description,
        after: newOp.description,
      })
    }
  }

  // Renames: same route (method+path), different id
  for (const [id, newOp] of newById) {
    if (seenNew.has(id)) continue
    const oldOp = oldByRoute.get(routeKey(newOp))
    if (!oldOp || seenOld.has(oldOp.id)) continue
    seenOld.add(oldOp.id)
    seenNew.add(id)
    changes.push({ kind: 'renamed', operationId: id, previousOperationId: oldOp.id })
  }

  // Anything remaining in `newById` is added
  for (const [id] of newById) {
    if (seenNew.has(id)) continue
    // Also skip if the route is unchanged (defensive)
    const newOp = newById.get(id)!
    if (oldByRoute.has(routeKey(newOp))) continue
    changes.push({ kind: 'added', operationId: id })
    seenNew.add(id)
  }

  // Anything remaining in `oldById` is removed
  for (const [id] of oldById) {
    if (seenOld.has(id)) continue
    const oldOp = oldById.get(id)!
    if (newByRoute.has(routeKey(oldOp))) continue
    changes.push({ kind: 'removed', operationId: id })
    seenOld.add(id)
  }

  return changes
}

function routeKey(op: ParsedOperation): string {
  return `${op.method} ${op.path}`
}
