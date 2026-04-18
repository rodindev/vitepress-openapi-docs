import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveOperation, type SpecRegistry } from '../runtime/registry'
import type { ParsedSpec } from '../parser/types'

const EMBED_RE = /<OpenApiEndpoint\b[^>]*\bid=(?:"([^"]+)"|'([^']+)')/g
const FENCE_RE = /^\s*(```+|~~~+)/

export interface BrokenEmbed {
  /** Repo-relative path to the offending markdown file. */
  file: string
  /** 1-based line number of the embed. */
  line: number
  /** The id that failed to resolve. */
  id: string
}

export interface ScanOptions {
  /** Glob-equivalent: file extensions to consider. Defaults to `.md` only. */
  extensions?: string[]
  /** Directory names to skip. Defaults to common build/output dirs. */
  ignoreDirs?: string[]
}

const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.vitepress',
  '_openapi',
  'coverage',
])

/**
 * Walk a docs tree, find every `<OpenApiEndpoint id="..." />` reference, and
 * return the ones that don't resolve in the supplied spec registry. Code
 * blocks (fenced and inline) are skipped so illustrative snippets in docs
 * don't count as real embeds. A clean scan returns `[]`.
 */
export async function scanForBrokenEmbeds(
  rootDir: string,
  specs: ParsedSpec[],
  options: ScanOptions = {}
): Promise<BrokenEmbed[]> {
  const extensions = new Set(options.extensions ?? ['.md'])
  const ignoreDirs = new Set([...(options.ignoreDirs ?? []), ...DEFAULT_IGNORE_DIRS])
  const registry: SpecRegistry = { specs: Object.fromEntries(specs.map((s) => [s.name, s])) }

  const broken: BrokenEmbed[] = []
  await walk(
    rootDir,
    '',
    async (relativeFile) => {
      const dot = relativeFile.lastIndexOf('.')
      if (dot < 0 || !extensions.has(relativeFile.slice(dot))) return
      const fullPath = join(rootDir, relativeFile)
      const content = await readFile(fullPath, 'utf8')
      const lines = content.split('\n')
      let inFence = false
      let fenceMarker = ''
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex]!
        const fenceMatch = line.match(FENCE_RE)
        if (fenceMatch) {
          const marker = fenceMatch[1]!
          if (!inFence) {
            inFence = true
            fenceMarker = marker[0]!
          } else if (marker.startsWith(fenceMarker)) {
            inFence = false
            fenceMarker = ''
          }
          continue
        }
        if (inFence) continue
        const stripped = stripInlineCode(line)
        EMBED_RE.lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = EMBED_RE.exec(stripped)) !== null) {
          const id = match[1] ?? match[2]!
          if (!resolveOperation(registry, id)) {
            broken.push({ file: relativeFile, line: lineIndex + 1, id })
          }
        }
      }
    },
    ignoreDirs
  )
  return broken
}

/**
 * Replace inline-code spans (`...`) with spaces of matching length so the
 * regex can't see them, while preserving column offsets for future use.
 * Escapes `\`` are left alone — markdown treats them as literal backticks.
 */
function stripInlineCode(line: string): string {
  const result: string[] = []
  let i = 0
  while (i < line.length) {
    const ch = line[i]!
    if (ch === '`') {
      let run = 1
      while (line[i + run] === '`') run++
      const opener = '`'.repeat(run)
      const closeIdx = line.indexOf(opener, i + run)
      if (closeIdx >= 0) {
        result.push(' '.repeat(closeIdx + run - i))
        i = closeIdx + run
        continue
      }
    }
    result.push(ch)
    i++
  }
  return result.join('')
}

async function walk(
  rootDir: string,
  relative: string,
  visit: (relativeFile: string) => Promise<void>,
  ignoreDirs: Set<string>
): Promise<void> {
  const here = join(rootDir, relative)
  let entries: string[]
  try {
    entries = await readdir(here)
  } catch {
    return
  }
  for (const entry of entries) {
    if (ignoreDirs.has(entry)) continue
    const entryRel = relative ? `${relative}/${entry}` : entry
    const fullPath = join(rootDir, entryRel)
    const stats = await stat(fullPath)
    if (stats.isDirectory()) {
      await walk(rootDir, entryRel, visit, ignoreDirs)
    } else if (stats.isFile()) {
      await visit(entryRel)
    }
  }
}
