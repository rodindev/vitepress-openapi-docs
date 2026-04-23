import { describe, expect, it } from 'vitest'
import { highlightShell } from './shell'

describe('highlightShell', () => {
  it('wraps curl + flags + double-quoted strings', () => {
    const html = highlightShell(`curl -X POST -H "Authorization: Bearer x" https://api/posts`)
    expect(html).toContain('<span class="vod-syntax-keyword">curl</span>')
    expect(html).toContain('<span class="vod-syntax-keyword">-X</span>')
    expect(html).toContain('<span class="vod-syntax-keyword">-H</span>')
    expect(html).toContain(
      '<span class="vod-syntax-string">&quot;Authorization: Bearer x&quot;</span>'
    )
  })

  it('supports single-quoted strings', () => {
    const html = highlightShell(`curl -d '{"id":1}' https://x`)
    expect(html).toContain('<span class="vod-syntax-string">&#39;{&quot;id&quot;:1}&#39;</span>')
  })

  it('highlights long flags and numbers', () => {
    const html = highlightShell(`curl --max-time 30 -o file.json`)
    expect(html).toContain('<span class="vod-syntax-keyword">--max-time</span>')
    expect(html).toContain('<span class="vod-syntax-number">30</span>')
  })

  it('treats leading # as a comment line', () => {
    const html = highlightShell(`# send the request\ncurl https://x`)
    expect(html).toContain('<span class="vod-syntax-comment"># send the request</span>')
  })

  it('keeps escaped quotes inside double strings intact', () => {
    const html = highlightShell(`curl -d "she said \\"hi\\""`)
    expect(html).toContain(
      '<span class="vod-syntax-string">&quot;she said \\&quot;hi\\&quot;&quot;</span>'
    )
  })

  it('escapes HTML so payloads cannot inject tags', () => {
    const html = highlightShell(`curl -d "<script>alert(1)</script>"`)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('does not match curl inside identifiers (word boundary)', () => {
    const html = highlightShell('occurlike')
    expect(html).not.toContain('<span class="vod-syntax-keyword">curl</span>')
  })
})
