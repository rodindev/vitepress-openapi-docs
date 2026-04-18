export interface FuzzyMatch<T> {
  item: T
  score: number
}

export function fuzzyScore(haystack: string, needle: string): number {
  if (!needle) return 1
  const lowerHay = haystack.toLowerCase()
  const lowerNeedle = needle.toLowerCase()

  const directIndex = lowerHay.indexOf(lowerNeedle)
  if (directIndex >= 0) return 1000 - directIndex

  let hayIdx = 0
  let needleIdx = 0
  let firstMatchIdx = -1
  let lastMatchIdx = -1
  while (hayIdx < lowerHay.length && needleIdx < lowerNeedle.length) {
    if (lowerHay[hayIdx] === lowerNeedle[needleIdx]) {
      if (firstMatchIdx === -1) firstMatchIdx = hayIdx
      lastMatchIdx = hayIdx
      needleIdx++
    }
    hayIdx++
  }
  if (needleIdx < lowerNeedle.length) return 0
  const gap = lastMatchIdx - firstMatchIdx
  return Math.max(1, 500 - gap)
}

export function rankByFuzzy<T>(
  items: T[],
  query: string,
  fields: (item: T) => string[]
): FuzzyMatch<T>[] {
  if (!query) return items.map((item) => ({ item, score: 1 }))
  const matches: FuzzyMatch<T>[] = []
  for (const item of items) {
    let best = 0
    for (const field of fields(item)) {
      const score = fuzzyScore(field, query)
      if (score > best) best = score
    }
    if (best > 0) matches.push({ item, score: best })
  }
  matches.sort((a, b) => b.score - a.score)
  return matches
}
