import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import SdkSnippets from './SdkSnippets.vue'
import type { Snippet } from 'vue-api-playground'

const snippets: Snippet[] = [
  { language: 'curl', label: 'curl', code: "curl 'https://x'" },
  { language: 'fetch', label: 'JavaScript (fetch)', code: 'fetch("https://x")' },
  { language: 'python', label: 'Python (requests)', code: 'requests.get("https://x")' },
]

describe('SdkSnippets', () => {
  it('renders one tab per snippet', () => {
    const wrapper = mount(SdkSnippets, { props: { snippets } })
    expect(wrapper.findAll('.vod-snippets__tab')).toHaveLength(3)
  })

  it('marks the first snippet active by default', () => {
    const wrapper = mount(SdkSnippets, { props: { snippets } })
    expect(wrapper.find('[aria-selected="true"]').text()).toBe('curl')
  })

  it('switches the active tab on click', async () => {
    const wrapper = mount(SdkSnippets, { props: { snippets } })
    await wrapper.findAll('.vod-snippets__tab')[2]!.trigger('click')
    expect(wrapper.find('[aria-selected="true"]').text()).toBe('Python (requests)')
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

  it('highlights curl snippets with shell tokens', () => {
    const wrapper = mount(SdkSnippets, { props: { snippets } })
    const curl = wrapper.find(
      '#vod-snippet-' + (wrapper.vm as unknown as { uid: string }).uid + '-curl'
    )
    expect(curl.find('.vod-syntax-keyword').exists()).toBe(true)
    expect(curl.find('.vod-syntax-string').exists()).toBe(true)
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
    expect(button.attributes('aria-label')).toBe('Copy curl to clipboard')
    await button.trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith("curl 'https://x'")
    expect(button.text()).toBe('Copied')
    expect(button.attributes('aria-label')).toBe('curl copied to clipboard')
  })
})
