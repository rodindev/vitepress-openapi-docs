import { describe, expect, it } from 'vitest'
import { fuzzyScore, rankByFuzzy } from './fuzzy'

describe('fuzzyScore', () => {
  it('rewards exact substring matches higher than subsequence matches', () => {
    const exact = fuzzyScore('findPetsByStatus', 'pets')
    const subseq = fuzzyScore('findPetsByStatus', 'fps')
    expect(exact).toBeGreaterThan(subseq)
    expect(exact).toBeGreaterThanOrEqual(500)
  })

  it('rewards earlier matches over later ones', () => {
    const early = fuzzyScore('list', 'li')
    const late = fuzzyScore('scrolling-list', 'li')
    expect(early).toBeGreaterThan(late)
  })

  it('returns 0 when the query is not a subsequence of the haystack', () => {
    expect(fuzzyScore('foo', 'xyz')).toBe(0)
  })

  it('returns 1 for an empty query (everything matches with tie-breaker)', () => {
    expect(fuzzyScore('anything', '')).toBe(1)
  })

  it('matches subsequence fuzzy queries across the string', () => {
    expect(fuzzyScore('findPetsByStatus', 'fpst')).toBeGreaterThan(0)
  })

  it('is case-insensitive', () => {
    expect(fuzzyScore('GetPetById', 'petbyid')).toBeGreaterThan(0)
  })
})

describe('rankByFuzzy', () => {
  const items = [
    { id: 'addPet', summary: 'Add a new pet to the store' },
    { id: 'findPetsByStatus', summary: 'Finds Pets by status' },
    { id: 'loginUser', summary: 'Logs user into the system' },
    { id: 'placeOrder', summary: 'Place an order for a pet' },
  ]

  it('orders matching items by descending score', () => {
    const ranked = rankByFuzzy(items, 'pet', (item) => [item.id, item.summary])
    expect(ranked[0]?.item.id).toBe('addPet')
    expect(ranked.map((r) => r.item.id)).toContain('findPetsByStatus')
    expect(ranked.map((r) => r.item.id)).not.toContain('loginUser')
  })

  it('returns every item (unscored) when the query is empty', () => {
    const ranked = rankByFuzzy(items, '', (item) => [item.id])
    expect(ranked).toHaveLength(items.length)
  })

  it('stays performant on a 200-item list', () => {
    const big = Array.from({ length: 200 }, (_, i) => ({
      id: `op_${i}`,
      summary: `Operation ${i}`,
    }))
    const start = performance.now()
    rankByFuzzy(big, 'op_1', (item) => [item.id, item.summary])
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100)
  })
})
