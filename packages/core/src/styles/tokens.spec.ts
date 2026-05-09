import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const stylesheet = readFileSync(resolve(__dirname, 'index.scss'), 'utf8')

/** Every `--vod-NAME: VALUE;` declaration that appears in a selector block. */
function parseVodTokens(source: string): Array<{ name: string; value: string }> {
  const tokens: Array<{ name: string; value: string }> = []
  const re = /(--vod-[a-z0-9-]+)\s*:\s*([^;]+);/g
  for (const match of source.matchAll(re)) {
    tokens.push({ name: match[1], value: match[2].trim() })
  }
  return tokens
}

describe('vod token cascade', () => {
  it('every --vod-* declaration resolves to a concrete value (var chain or hex literal)', () => {
    const tokens = parseVodTokens(stylesheet)
    expect(tokens.length).toBeGreaterThan(10)

    const hexLiteral = /^#[0-9a-f]{3,8}$/i
    const violations = tokens.filter(
      (t) => !t.value.startsWith('var(') && !hexLiteral.test(t.value)
    )
    const summary = violations.map((v) => `  ${v.name}: ${v.value}`).join('\n')
    expect(
      violations,
      'these --vod-* tokens are neither a var() chain nor a hex literal:\n' + summary
    ).toEqual([])
  })

  it('method pill bg/text tokens resolve to a hex color', () => {
    const tokens = parseVodTokens(stylesheet).filter((t) =>
      /^--vod-method-[a-z]+-(bg|text)$/.test(t.name)
    )
    expect(tokens.length).toBeGreaterThanOrEqual(14)

    for (const token of tokens) {
      expect(
        token.value,
        `${token.name} should be or end with a hex color for AA-safe defaults`
      ).toMatch(/#[0-9a-f]{3,8}(\s*\)+\s*)?$/i)
    }
  })

  it('status tokens exist for 2xx, 4xx, 5xx in both light and dark', () => {
    const names = new Set(parseVodTokens(stylesheet).map((t) => t.name))
    for (const family of ['2xx', '4xx', '5xx']) {
      expect(names).toContain(`--vod-status-${family}`)
      expect(names).toContain(`--vod-status-${family}-soft`)
    }

    const darkBlockMatch = stylesheet.match(/\.dark\s*\{[\s\S]*?\n\}/)
    expect(darkBlockMatch, '.dark block should exist for dark-mode overrides').toBeTruthy()
    const darkTokens = parseVodTokens(darkBlockMatch![0]).map((t) => t.name)
    for (const family of ['2xx', '4xx', '5xx']) {
      expect(darkTokens).toContain(`--vod-status-${family}`)
      expect(darkTokens).toContain(`--vod-status-${family}-soft`)
    }
  })

  it('syntax tokens cover the 9 SnippetTokenType colors in light and dark', () => {
    const families = [
      'string',
      'number',
      'keyword',
      'comment',
      'function',
      'flag',
      'url',
      'identifier',
      'punct',
    ]
    const lightNames = new Set(parseVodTokens(stylesheet).map((t) => t.name))
    for (const family of families) {
      expect(lightNames).toContain(`--vod-syntax-${family}`)
    }

    const darkBlockMatch = stylesheet.match(/\.dark\s*\{[\s\S]*?\n\}/)
    const darkTokens = parseVodTokens(darkBlockMatch![0]).map((t) => t.name)
    for (const family of families) {
      expect(darkTokens).toContain(`--vod-syntax-${family}`)
    }
  })

  it('syntax token fallbacks match the vscode default palette', () => {
    const lightExpected: Record<string, string> = {
      'vod-syntax-string': '#a31515',
      'vod-syntax-number': '#098658',
      'vod-syntax-keyword': '#af00db',
      'vod-syntax-comment': '#008000',
      'vod-syntax-function': '#795e26',
      'vod-syntax-url': '#0451a5',
    }
    const darkExpected: Record<string, string> = {
      'vod-syntax-string': '#ce9178',
      'vod-syntax-number': '#b5cea8',
      'vod-syntax-keyword': '#c586c0',
      'vod-syntax-comment': '#6a9955',
      'vod-syntax-function': '#dcdcaa',
      'vod-syntax-url': '#4ec9b0',
    }

    const rootMatch = stylesheet.match(/:root\s*\{[\s\S]*?\n\}/)
    expect(rootMatch, ':root block should exist').toBeTruthy()
    const lightTokens = new Map(
      parseVodTokens(rootMatch![0]).map((t) => [t.name.slice(2), t.value])
    )
    for (const [name, hex] of Object.entries(lightExpected)) {
      expect(lightTokens.get(name), `${name} light fallback`).toContain(hex)
    }

    const darkBlockMatch = stylesheet.match(/\.dark\s*\{[\s\S]*?\n\}/)
    const darkTokens = new Map(
      parseVodTokens(darkBlockMatch![0]).map((t) => [t.name.slice(2), t.value])
    )
    for (const [name, hex] of Object.entries(darkExpected)) {
      expect(darkTokens.get(name), `${name} dark fallback`).toContain(hex)
    }
  })
})
