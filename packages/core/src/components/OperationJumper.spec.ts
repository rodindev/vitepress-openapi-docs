import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import OperationJumper from './OperationJumper.vue'
import { SPEC_REGISTRY_KEY } from '../runtime/registry'
import type { ParsedSpec } from '../parser/types'

const spec: ParsedSpec = {
  name: 'petstore',
  title: 'Petstore',
  version: '1.0.0',
  servers: [],
  componentSchemas: {
    Pet: { name: 'Pet', description: 'An adoptable pet', schema: {} },
    Order: { name: 'Order', schema: {} },
  },
  securitySchemes: {},
  operations: [
    {
      id: 'addPet',
      operationId: 'addPet',
      method: 'post',
      path: '/pet',
      summary: 'Add a new pet to the store',
      tags: ['pet'],
      parameters: [],
      responses: [],
      requestSchemaRefs: {},
      responseSchemaRefs: {},
      defaultServer: '',
      security: [],
      deprecated: false,
    },
    {
      id: 'findPetsByStatus',
      operationId: 'findPetsByStatus',
      method: 'get',
      path: '/pet/findByStatus',
      summary: 'Finds Pets by status',
      tags: ['pet'],
      parameters: [],
      responses: [],
      requestSchemaRefs: {},
      responseSchemaRefs: {},
      defaultServer: '',
      security: [],
      deprecated: false,
    },
    {
      id: 'loginUser',
      operationId: 'loginUser',
      method: 'get',
      path: '/user/login',
      summary: 'Logs user into the system',
      tags: ['user'],
      parameters: [],
      responses: [],
      requestSchemaRefs: {},
      responseSchemaRefs: {},
      defaultServer: '',
      security: [],
      deprecated: false,
    },
  ],
}

const provide = { [SPEC_REGISTRY_KEY as unknown as symbol]: { specs: { petstore: spec } } }

let wrapper: ReturnType<typeof mount> | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function fireCtrlK() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
}

describe('OperationJumper', () => {
  it('opens on Ctrl+K and closes via close()', async () => {
    wrapper = mount(OperationJumper, { global: { provide } })
    expect(wrapper.find('.vod-jumper__panel').exists()).toBe(false)
    fireCtrlK()
    await nextTick()
    expect(wrapper.find('.vod-jumper__panel').exists()).toBe(true)
    wrapper.vm.close()
    await nextTick()
    expect(wrapper.find('.vod-jumper__panel').exists()).toBe(false)
  })

  it('lists all operations and schemas when the query is empty', async () => {
    wrapper = mount(OperationJumper, { global: { provide } })
    fireCtrlK()
    await nextTick()
    expect(wrapper.findAll('.vod-jumper__result')).toHaveLength(5)
  })

  it('surfaces schemas with a SCHEMA tag and schema-specific styling', async () => {
    wrapper = mount(OperationJumper, { global: { provide } })
    fireCtrlK()
    await nextTick()
    await wrapper.find('input').setValue('pet')
    const methods = wrapper.findAll('.vod-jumper__method').map((el) => el.text())
    expect(methods).toContain('SCHEMA')
  })

  it('filters by fuzzy query across id, summary, path and tag', async () => {
    wrapper = mount(OperationJumper, { global: { provide } })
    fireCtrlK()
    await nextTick()
    await wrapper.find('input').setValue('pet')
    const summaries = wrapper.findAll('.vod-jumper__summary').map((el) => el.text())
    expect(summaries.length).toBeGreaterThan(0)
    expect(summaries.some((s) => s === 'Logs user into the system')).toBe(false)
  })

  it('moves active index with ArrowDown and ArrowUp', async () => {
    wrapper = mount(OperationJumper, { global: { provide } })
    fireCtrlK()
    await nextTick()
    const input = wrapper.find('input')
    // First item is active by default (index 0)
    const results = wrapper.findAll('.vod-jumper__result')
    expect(results[0]!.classes()).toContain('vod-jumper__result--active')
    // Arrow down moves to index 1
    await input.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    const updated = wrapper.findAll('.vod-jumper__result')
    expect(updated[1]!.classes()).toContain('vod-jumper__result--active')
    expect(updated[0]!.classes()).not.toContain('vod-jumper__result--active')
    // Arrow up moves back to index 0
    await input.trigger('keydown', { key: 'ArrowUp' })
    await nextTick()
    const restored = wrapper.findAll('.vod-jumper__result')
    expect(restored[0]!.classes()).toContain('vod-jumper__result--active')
  })

  it('closes on Escape key', async () => {
    wrapper = mount(OperationJumper, { global: { provide } })
    fireCtrlK()
    await nextTick()
    expect(wrapper.find('.vod-jumper__panel').exists()).toBe(true)
    await wrapper.find('input').trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(wrapper.find('.vod-jumper__panel').exists()).toBe(false)
  })

  it('wraps around when ArrowDown goes past the last item', async () => {
    wrapper = mount(OperationJumper, { global: { provide } })
    fireCtrlK()
    await nextTick()
    await wrapper.find('input').setValue('loginUser')
    await nextTick()
    const count = wrapper.findAll('.vod-jumper__result').length
    expect(count).toBe(1)
    // Arrow down from only item wraps to index 0
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(wrapper.findAll('.vod-jumper__result')[0]!.classes()).toContain(
      'vod-jumper__result--active'
    )
  })

  it('shows an empty state when no operation matches', async () => {
    wrapper = mount(OperationJumper, { global: { provide } })
    fireCtrlK()
    await nextTick()
    await wrapper.find('input').setValue('zzzzz')
    expect(wrapper.find('.vod-jumper__empty').exists()).toBe(true)
  })

  it('shows spec name in operation tags when multiple specs are registered', async () => {
    const secondSpec: ParsedSpec = {
      name: 'admin',
      title: 'Admin API',
      version: '1.0.0',
      servers: [],
      componentSchemas: {},
      securitySchemes: {},
      operations: [
        {
          id: 'listUsers',
          operationId: 'listUsers',
          method: 'get',
          path: '/admin/users',
          summary: 'List users',
          tags: ['users'],
          parameters: [],
          responses: [],
          requestSchemaRefs: {},
          responseSchemaRefs: {},
          defaultServer: '',
          security: [],
          deprecated: false,
        },
      ],
    }
    const multiProvide = {
      [SPEC_REGISTRY_KEY as unknown as symbol]: {
        specs: { petstore: spec, admin: secondSpec },
      },
    }
    wrapper = mount(OperationJumper, { global: { provide: multiProvide } })
    fireCtrlK()
    await nextTick()
    await wrapper.find('input').setValue('addPet')
    await nextTick()
    const tags = wrapper.findAll('.vod-jumper__tag').map((el) => el.text())
    expect(tags.some((t) => t.includes('petstore'))).toBe(true)
  })

  it('omits spec name from operation tags in single-spec mode', async () => {
    wrapper = mount(OperationJumper, { global: { provide } })
    fireCtrlK()
    await nextTick()
    const tags = wrapper.findAll('.vod-jumper__tag').map((el) => el.text())
    const opTags = tags.filter((t) => t !== 'petstore') // schema tags always show specName
    expect(opTags.every((t) => !t.includes('petstore'))).toBe(true)
  })
})
