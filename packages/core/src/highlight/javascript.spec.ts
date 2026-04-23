import { describe, expect, it } from 'vitest'
import { highlightJavaScript } from './javascript'

describe('highlightJavaScript', () => {
  it('wraps keywords, strings, and numbers', () => {
    const html = highlightJavaScript(`const x = await fetch('https://x', { method: 'POST' })`)
    expect(html).toContain('<span class="vod-syntax-keyword">const</span>')
    expect(html).toContain('<span class="vod-syntax-keyword">await</span>')
    expect(html).toContain('<span class="vod-syntax-string">&#39;https://x&#39;</span>')
    expect(html).toContain('<span class="vod-syntax-string">&#39;POST&#39;</span>')
  })

  it('highlights template literals as strings', () => {
    const html = highlightJavaScript('const url = `https://api/${id}`')
    expect(html).toContain('<span class="vod-syntax-string">`https://api/${id}`</span>')
  })

  it('highlights line and block comments', () => {
    const html = highlightJavaScript('// send it\n/* block */\nfetch(url)')
    expect(html).toContain('<span class="vod-syntax-comment">// send it</span>')
    expect(html).toContain('<span class="vod-syntax-comment">/* block */</span>')
  })

  it('highlights numbers including decimals and exponents', () => {
    const html = highlightJavaScript('const x = 42, y = 3.14e2')
    expect(html).toContain('<span class="vod-syntax-number">42</span>')
    expect(html).toContain('<span class="vod-syntax-number">3.14e2</span>')
  })

  it('treats true / false / null / undefined as keywords', () => {
    const html = highlightJavaScript('const x = true; const y = null; const z = undefined')
    expect(html).toContain('<span class="vod-syntax-keyword">true</span>')
    expect(html).toContain('<span class="vod-syntax-keyword">null</span>')
    expect(html).toContain('<span class="vod-syntax-keyword">undefined</span>')
  })

  it('keeps escaped quotes inside strings intact', () => {
    const html = highlightJavaScript('const x = "she said \\"hi\\""')
    expect(html).toContain(
      '<span class="vod-syntax-string">&quot;she said \\&quot;hi\\&quot;&quot;</span>'
    )
  })

  it('escapes HTML so payloads cannot inject tags', () => {
    const html = highlightJavaScript('const x = "<script>alert(1)</script>"')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('respects word boundaries around keywords', () => {
    const html = highlightJavaScript('awaitedValue')
    expect(html).not.toContain('<span class="vod-syntax-keyword">await</span>')
  })

  it('highlights function calls', () => {
    const html = highlightJavaScript('await fetch(url); JSON.stringify(body)')
    expect(html).toContain('<span class="vod-syntax-function">fetch</span>')
    expect(html).toContain('<span class="vod-syntax-function">stringify</span>')
  })

  it('does not color identifiers without a following paren as functions', () => {
    const html = highlightJavaScript('const url = path')
    expect(html).not.toContain('<span class="vod-syntax-function">')
  })
})
