import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import OpenApiChangelog from './OpenApiChangelog.vue'
import { CHANGELOG_REGISTRY_KEY } from '../runtime/registry'
import type { SpecChangelog } from '../changelog/types'

function provideFor(changelogs: Record<string, SpecChangelog>) {
  return {
    [CHANGELOG_REGISTRY_KEY as unknown as symbol]: { changelogs },
  }
}

describe('OpenApiChangelog', () => {
  it('renders a missing-spec alert when the spec name is not registered', () => {
    const wrapper = mount(OpenApiChangelog, {
      props: { name: 'ghost' },
      global: { provide: provideFor({}) },
    })
    expect(wrapper.find('.vod-changelog--missing').exists()).toBe(true)
    expect(wrapper.attributes('role')).toBe('alert')
  })

  it('shows the empty state when the spec has no commit history', () => {
    const wrapper = mount(OpenApiChangelog, {
      props: { name: 'public' },
      global: {
        provide: provideFor({
          public: { specName: 'public', entries: [], isEmpty: true },
        }),
      },
    })
    expect(wrapper.find('.vod-changelog--empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No history yet')
    expect(wrapper.text()).toContain('Partial diff')
  })

  it('renders each entry with commit hash, subject, and kind badges', () => {
    const wrapper = mount(OpenApiChangelog, {
      props: { name: 'public' },
      global: {
        provide: provideFor({
          public: {
            specName: 'public',
            isEmpty: false,
            entries: [
              {
                commit: 'abc1234',
                date: '2026-04-12T10:00:00Z',
                subject: 'feat: add getPet endpoint',
                info: [{ kind: 'version', before: '1.0.0', after: '1.1.0' }],
                operations: [
                  { kind: 'added', operationId: 'getPet' },
                  { kind: 'removed', operationId: 'legacyPet' },
                ],
              },
            ],
          },
        }),
      },
    })
    expect(wrapper.find('.vod-changelog__commit').text()).toBe('abc1234')
    expect(wrapper.find('.vod-changelog__subject').text()).toContain('feat: add getPet')
    const kindLabels = wrapper.findAll('.vod-chip').map((el) => el.text())
    expect(kindLabels).toContain('Added')
    expect(kindLabels).toContain('Removed')
    expect(kindLabels.some((label) => label.startsWith('info.version'))).toBe(true)
  })

  it('formats renamed operations with before → after arrow', () => {
    const wrapper = mount(OpenApiChangelog, {
      props: { name: 'public' },
      global: {
        provide: provideFor({
          public: {
            specName: 'public',
            isEmpty: false,
            entries: [
              {
                commit: 'def5678',
                date: '2026-04-13T10:00:00Z',
                subject: 'refactor: rename listPets',
                info: [],
                operations: [
                  {
                    kind: 'renamed',
                    operationId: 'listAllPets',
                    previousOperationId: 'listPets',
                  },
                ],
              },
            ],
          },
        }),
      },
    })
    const text = wrapper.text()
    expect(text).toContain('listPets')
    expect(text).toContain('listAllPets')
    expect(text).toMatch(/listPets\s*→\s*listAllPets/)
  })

  it('falls back to the single registered spec when name is omitted', () => {
    const wrapper = mount(OpenApiChangelog, {
      global: {
        provide: provideFor({
          only: {
            specName: 'only',
            isEmpty: false,
            entries: [
              {
                commit: '0000000',
                date: '2026-04-14T10:00:00Z',
                subject: 'initial',
                info: [],
                operations: [{ kind: 'added', operationId: 'listAll' }],
              },
            ],
          },
        }),
      },
    })
    expect(wrapper.find('.vod-changelog--missing').exists()).toBe(false)
    expect(wrapper.text()).toContain('listAll')
  })

  it('shows the empty state when entries is [] even if isEmpty is false', () => {
    const wrapper = mount(OpenApiChangelog, {
      props: { name: 'public' },
      global: {
        provide: provideFor({
          public: { specName: 'public', entries: [], isEmpty: false },
        }),
      },
    })
    expect(wrapper.find('.vod-changelog--empty').exists()).toBe(true)
  })
})
