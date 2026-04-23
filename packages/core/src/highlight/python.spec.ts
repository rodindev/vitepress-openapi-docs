import { describe, expect, it } from 'vitest'
import { highlightPython } from './python'

describe('highlightPython', () => {
  it('wraps keywords and strings in a typical requests snippet', () => {
    const html = highlightPython(`import requests

url = "https://api/posts"
response = requests.get(url, headers={"Authorization": "Bearer x"})`)
    expect(html).toContain('<span class="vod-syntax-keyword">import</span>')
    expect(html).toContain('<span class="vod-syntax-string">&quot;https://api/posts&quot;</span>')
    expect(html).toContain('<span class="vod-syntax-string">&quot;Authorization&quot;</span>')
  })

  it('treats True / False / None as keywords', () => {
    const html = highlightPython('x = True; y = False; z = None')
    expect(html).toContain('<span class="vod-syntax-keyword">True</span>')
    expect(html).toContain('<span class="vod-syntax-keyword">False</span>')
    expect(html).toContain('<span class="vod-syntax-keyword">None</span>')
  })

  it('highlights # comments', () => {
    const html = highlightPython('# send request\nrequests.get(url)')
    expect(html).toContain('<span class="vod-syntax-comment"># send request</span>')
  })

  it('highlights triple-quoted strings including multi-line', () => {
    const html = highlightPython('doc = """line1\nline2"""')
    expect(html).toContain(
      '<span class="vod-syntax-string">&quot;&quot;&quot;line1\nline2&quot;&quot;&quot;</span>'
    )
  })

  it('supports f-string and raw-string prefixes', () => {
    const html = highlightPython('url = f"https://api/{id}"\npath = r"\\d+"')
    expect(html).toContain('<span class="vod-syntax-string">f&quot;https://api/{id}&quot;</span>')
    expect(html).toContain('<span class="vod-syntax-string">r&quot;\\d+&quot;</span>')
  })

  it('highlights numbers', () => {
    const html = highlightPython('limit = 100\nratio = 2.5e-3')
    expect(html).toContain('<span class="vod-syntax-number">100</span>')
    expect(html).toContain('<span class="vod-syntax-number">2.5e-3</span>')
  })

  it('escapes HTML so payloads cannot inject tags', () => {
    const html = highlightPython('payload = "<script>alert(1)</script>"')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('respects word boundaries around keywords', () => {
    const html = highlightPython('import_spec = 1')
    expect(html).not.toContain('<span class="vod-syntax-keyword">import</span>')
  })
})
