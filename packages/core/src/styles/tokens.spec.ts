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
  it('every --vod-* declaration routes through var() so hosts can override', () => {
    const tokens = parseVodTokens(stylesheet)
    expect(tokens.length).toBeGreaterThan(10)

    const violations = tokens.filter((t) => !t.value.startsWith('var('))
    const summary = violations.map((v) => `  ${v.name}: ${v.value}`).join('\n')
    expect(
      violations,
      'these --vod-* tokens are pre-computed literals — they bypass the ' +
        "--vap-* / --vp-c-* cascade and won't follow host theme overrides:\n" +
        summary
    ).toEqual([])
  })

  it('method pill bg/text tokens terminate in a hex fallback', () => {
    const tokens = parseVodTokens(stylesheet).filter((t) =>
      /^--vod-method-[a-z]+-(bg|text)$/.test(t.name)
    )
    expect(tokens.length).toBeGreaterThanOrEqual(14)

    for (const token of tokens) {
      expect(
        token.value,
        `${token.name} should end with a hex literal so non-VitePress hosts still render something`
      ).toMatch(/#[0-9a-f]{3,8}\s*\)+\s*$/i)
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
})
