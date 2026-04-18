import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ResponseExamples from './ResponseExamples.vue'
import type { ParsedResponse } from '../parser/types'

const withExample: ParsedResponse[] = [
  {
    status: '200',
    description: 'OK',
    content: {
      'application/json': { example: { id: 1, name: 'doggie' } },
    },
  },
]

const withSchemaOnly: ParsedResponse[] = [
  {
    status: '201',
    description: 'created',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'integer' } },
        },
      },
    },
  },
]

const multiStatus: ParsedResponse[] = [
  ...withExample,
  {
    status: '404',
    description: 'Not found',
    content: {
      'application/json': { example: { error: 'Pet not found' } },
    },
  },
  {
    status: '500',
    description: 'Server error',
    content: {
      'application/json': { example: { error: 'Internal' } },
    },
  },
]

describe('ResponseExamples', () => {
  it('renders nothing when no response has content', () => {
    const wrapper = mount(ResponseExamples, {
      props: { responses: [{ status: '204', description: 'no content' }] },
    })
    expect(wrapper.find('.vod-responses').exists()).toBe(false)
  })

  it('renders an example body verbatim when one is supplied in the spec', () => {
    const wrapper = mount(ResponseExamples, { props: { responses: withExample } })
    const code = wrapper.find('.vod-responses__code').text()
    expect(code).toContain('"name": "doggie"')
    expect(wrapper.find('.vod-responses__derived').exists()).toBe(false)
  })

  it('falls back to generating an example from the schema and flags it', () => {
    const wrapper = mount(ResponseExamples, { props: { responses: withSchemaOnly } })
    expect(wrapper.find('.vod-responses__code').text()).toContain('"id": 0')
    expect(wrapper.find('.vod-responses__derived').exists()).toBe(true)
  })

  it('emits a tab per status with bucket-specific styling', () => {
    const wrapper = mount(ResponseExamples, { props: { responses: multiStatus } })
    const tabs = wrapper.findAll('.vod-responses__tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[0]!.classes()).toContain('vod-responses__tab--success')
    expect(tabs[1]!.classes()).toContain('vod-responses__tab--client-error')
    expect(tabs[2]!.classes()).toContain('vod-responses__tab--server-error')
  })

  it('switches the active tab on click', async () => {
    const wrapper = mount(ResponseExamples, { props: { responses: multiStatus } })
    expect(wrapper.find('[aria-selected="true"]').text()).toContain('200')
    await wrapper.findAll('.vod-responses__tab')[1]!.trigger('click')
    expect(wrapper.find('[aria-selected="true"]').text()).toContain('404')
  })

  it('strips markdown syntax from tab descriptions', () => {
    const responses: ParsedResponse[] = [
      {
        status: '429',
        description: '**429** — rate limit exceeded (120/60s)',
        content: {
          'application/json': { example: { error: 'rate limited' } },
        },
      },
    ]
    const wrapper = mount(ResponseExamples, { props: { responses } })
    const desc = wrapper.find('.vod-responses__desc').text()
    expect(desc).toBe('429 — rate limit exceeded (120/60s)')
    expect(desc).not.toContain('**')
  })

  it('exposes content-type alongside the example body', () => {
    const wrapper = mount(ResponseExamples, {
      props: {
        responses: [
          {
            status: '200',
            description: 'OK',
            content: { 'text/plain': { example: 'hello' } },
          },
        ],
      },
    })
    expect(wrapper.find('.vod-responses__meta').text()).toContain('text/plain')
    expect(wrapper.find('.vod-responses__code').text()).toBe('hello')
  })
})
