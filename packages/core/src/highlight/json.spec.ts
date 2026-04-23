import { describe, expect, it } from 'vitest'
import { highlightJson } from './json'

describe('highlightJson', () => {
  it('wraps keys, strings, numbers, and booleans with vap-json-* spans', () => {
    const html = highlightJson('{"id": 1, "active": true, "name": "x"}')
    expect(html).toContain('<span class="vap-json-key">&quot;id&quot;</span>')
    expect(html).toContain('<span class="vap-json-number">1</span>')
    expect(html).toContain('<span class="vap-json-bool">true</span>')
    expect(html).toContain('<span class="vap-json-string">&quot;x&quot;</span>')
  })

  it('treats null like a boolean token', () => {
    expect(highlightJson('{"x": null}')).toContain('<span class="vap-json-bool">null</span>')
  })

  it('keeps escaped quotes inside strings intact', () => {
    const html = highlightJson('{"quote": "she said \\"hi\\""}')
    expect(html).toContain(
      '<span class="vap-json-string">&quot;she said \\&quot;hi\\&quot;&quot;</span>'
    )
  })

  it('handles numbers with decimals and exponents', () => {
    const html = highlightJson('[-1.5e3, 0.25]')
    expect(html).toContain('<span class="vap-json-number">-1.5e3</span>')
    expect(html).toContain('<span class="vap-json-number">0.25</span>')
  })

  it('escapes HTML so payloads cannot inject tags', () => {
    const html = highlightJson('{"xss": "<script>alert(1)</script>"}')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('distinguishes a string used as a key from one used as a value', () => {
    const html = highlightJson('{"a": "b"}')
    expect(html).toContain('<span class="vap-json-key">&quot;a&quot;</span>')
    expect(html).toContain('<span class="vap-json-string">&quot;b&quot;</span>')
    expect(html).not.toContain('<span class="vap-json-string">&quot;a&quot;</span>')
  })
})
