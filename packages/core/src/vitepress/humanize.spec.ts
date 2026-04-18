import { describe, expect, it } from 'vitest'
import { humanizeId } from './humanize'

describe('humanizeId', () => {
  it('splits camelCase', () => {
    expect(humanizeId('getUserById')).toBe('Get user by id')
  })

  it('splits snake_case', () => {
    expect(humanizeId('get_user_by_id')).toBe('Get user by id')
  })

  it('splits kebab-case', () => {
    expect(humanizeId('get-user-by-id')).toBe('Get user by id')
  })

  it('handles single word', () => {
    expect(humanizeId('ping')).toBe('Ping')
  })

  it('returns original on empty string', () => {
    expect(humanizeId('')).toBe('')
  })

  it('handles all-uppercase', () => {
    expect(humanizeId('GET')).toBe('Get')
  })

  it('handles consecutive delimiters', () => {
    expect(humanizeId('foo__bar')).toBe('Foo bar')
  })

  it('handles digits before uppercase', () => {
    expect(humanizeId('getV2Users')).toBe('Get v2 users')
  })
})
