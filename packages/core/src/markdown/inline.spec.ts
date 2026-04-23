import { describe, expect, it } from 'vitest'
import { renderInlineMarkdown } from './inline'

describe('renderInlineMarkdown', () => {
  it('renders bold via ** and __', () => {
    expect(renderInlineMarkdown('a **b** c')).toBe('a <strong>b</strong> c')
    expect(renderInlineMarkdown('a __b__ c')).toBe('a <strong>b</strong> c')
  })

  it('renders italic via * and _', () => {
    expect(renderInlineMarkdown('a *b* c')).toBe('a <em>b</em> c')
    expect(renderInlineMarkdown('a _b_ c')).toBe('a <em>b</em> c')
  })

  it('renders inline code via backticks', () => {
    expect(renderInlineMarkdown('call `fn()` now')).toBe('call <code>fn()</code> now')
  })

  it('renders markdown links with http/https targets only', () => {
    expect(renderInlineMarkdown('see [docs](https://example.com)')).toBe(
      'see <a href="https://example.com" rel="noopener noreferrer">docs</a>'
    )
  })

  it('refuses to render javascript: links', () => {
    const out = renderInlineMarkdown('[click](javascript:alert(1))')
    expect(out).not.toContain('<a')
    expect(out).toContain('[click](javascript:alert(1))')
  })

  it('escapes raw HTML before rendering', () => {
    const out = renderInlineMarkdown('<script>alert(1)</script> and **bold**')
    expect(out).not.toContain('<script>')
    expect(out).toContain('&lt;script&gt;')
    expect(out).toContain('<strong>bold</strong>')
  })

  it('keeps ** from interfering with single * italic', () => {
    expect(renderInlineMarkdown('**bold** *italic*')).toBe('<strong>bold</strong> <em>italic</em>')
  })

  it('handles combined formatting on the same line', () => {
    const out = renderInlineMarkdown('**HTTP** `GET` [link](https://x.io)')
    expect(out).toContain('<strong>HTTP</strong>')
    expect(out).toContain('<code>GET</code>')
    expect(out).toContain('<a href="https://x.io"')
  })
})
