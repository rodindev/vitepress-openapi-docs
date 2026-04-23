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

  it('renders one expandable item per status with bucket-specific styling', () => {
    const wrapper = mount(ResponseExamples, { props: { responses: multiStatus } })
    const items = wrapper.findAll('.vod-responses__item')
    expect(items).toHaveLength(3)
    expect(items[0]!.classes()).toContain('vod-responses__item--success')
    expect(items[1]!.classes()).toContain('vod-responses__item--client-error')
    expect(items[2]!.classes()).toContain('vod-responses__item--server-error')
  })

  it('starts with every item collapsed', () => {
    const wrapper = mount(ResponseExamples, { props: { responses: multiStatus } })
    const items = wrapper.findAll('.vod-responses__item')
    expect(items.filter((i) => (i.element as HTMLDetailsElement).open)).toHaveLength(0)
  })

  it('wraps JSON tokens in the rendered code block', () => {
    const wrapper = mount(ResponseExamples, { props: { responses: withExample } })
    const code = wrapper.find('.vod-responses__code')
    expect(code.find('.vap-json-key').exists()).toBe(true)
    expect(code.find('.vap-json-string').exists()).toBe(true)
    expect(code.find('.vap-json-number').exists()).toBe(true)
  })

  it('falls back to plain-escaped output for non-JSON content types', () => {
    const wrapper = mount(ResponseExamples, {
      props: {
        responses: [
          {
            status: '200',
            description: 'OK',
            content: { 'text/plain': { example: '<b>not html</b>' } },
          },
        ],
      },
    })
    const code = wrapper.find('.vod-responses__code')
    expect(code.find('.vap-json-string').exists()).toBe(false)
    expect(code.html()).toContain('&lt;b&gt;not html&lt;/b&gt;')
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
