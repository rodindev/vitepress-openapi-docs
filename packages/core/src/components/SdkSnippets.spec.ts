import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { toCurlSnippet, toFetch, toPython } from 'vue-api-playground'
import type { Snippet } from 'vue-api-playground'
import SdkSnippets from './SdkSnippets.vue'

const req = { url: 'https://x', method: 'GET' as const }
const snippets: Snippet[] = [toCurlSnippet(req), toFetch(req), toPython(req)]

function activePanel(wrapper: ReturnType<typeof mount>) {
  const uid = (wrapper.vm as unknown as { uid: string }).uid
  const active = wrapper.find('[aria-selected="true"]')
  const lang = active.attributes('aria-controls')!.replace(`vod-snippet-${uid}-`, '')
  return wrapper.find(`#vod-snippet-${uid}-${lang}`)
}

describe('SdkSnippets', () => {
  it('renders one tab per snippet', () => {
    const wrapper = mount(SdkSnippets, { props: { snippets } })
    expect(wrapper.findAll('.vod-snippets__tab')).toHaveLength(3)
  })

  it('marks the first snippet active by default', () => {
    const wrapper = mount(SdkSnippets, { props: { snippets } })
    expect(wrapper.find('[aria-selected="true"]').text()).toBe('cURL')
  })

  it('switches the active tab on click', async () => {
    const wrapper = mount(SdkSnippets, { props: { snippets } })
    await wrapper.findAll('.vod-snippets__tab')[2]!.trigger('click')
    expect(wrapper.find('[aria-selected="true"]').text()).toBe('Python')
  })

  it('renders the snippet code inside a <pre><code>', () => {
    const wrapper = mount(SdkSnippets, { props: { snippets } })
    expect(wrapper.find('pre code').exists()).toBe(true)
    expect(wrapper.text()).toContain("curl 'https://x'")
  })

  it('renders nothing when no snippets are supplied', () => {
    const wrapper = mount(SdkSnippets, { props: { snippets: [] } })
    expect(wrapper.find('.vod-snippets').exists()).toBe(false)
  })

  it('emits one syntax span per non-text token, text tokens stay unwrapped', () => {
    const wrapper = mount(SdkSnippets, { props: { snippets } })
    const panel = activePanel(wrapper)
    const expected = snippets[0]!.tokens.filter((t) => t.type !== 'text').length
    expect(panel.findAll('span[class^="vod-syntax-"]')).toHaveLength(expected)
  })

  it('preserves the token text concat invariant after rendering', async () => {
    const wrapper = mount(SdkSnippets, { props: { snippets } })
    for (let i = 0; i < snippets.length; i++) {
      await wrapper.findAll('.vod-snippets__tab')[i]!.trigger('click')
      const panel = activePanel(wrapper)
      expect(panel.text()).toBe(snippets[i]!.code)
    }
  })

  it('highlights curl snippets with shell-shaped tokens', () => {
    const wrapper = mount(SdkSnippets, { props: { snippets } })
    const panel = activePanel(wrapper)
    expect(panel.find('.vod-syntax-keyword').exists()).toBe(true)
    expect(panel.find('.vod-syntax-url').exists()).toBe(true)
  })

  it('shows a copy button and reflects success / failure state', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    const wrapper = mount(SdkSnippets, { props: { snippets } })
    const button = wrapper.find('button.vod-snippets__copy')
    expect(button.text()).toBe('Copy')
    expect(button.attributes('aria-label')).toBe('Copy cURL to clipboard')
    await button.trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(snippets[0]!.code)
    expect(button.text()).toBe('Copied')
    expect(button.attributes('aria-label')).toBe('cURL copied to clipboard')
  })
})
