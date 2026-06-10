import { describe, expect, it } from 'vitest'
import { escapeHtml } from './escape'

describe('escapeHtml', () => {
  it('escapes the ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes angle brackets', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
  })

  it('escapes double and single quotes', () => {
    expect(escapeHtml('"x" \'y\'')).toBe('&quot;x&quot; &#39;y&#39;')
  })

  it('escapes the ampersand before the other entities so output is not double-escaped', () => {
    expect(escapeHtml('<')).toBe('&lt;')
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })

  it('escapes a mixed string with every special character', () => {
    expect(escapeHtml('<a href="x">Tom & Jerry\'s</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;'
    )
  })

  it('leaves a plain string untouched', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
})
