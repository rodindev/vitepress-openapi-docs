export function isJsonContentType(contentType: string): boolean {
  const base = contentType.split(';')[0]!.trim().toLowerCase()
  return base === 'application/json' || base === 'text/json' || base.endsWith('+json')
}

export function jsonMedia<T>(content: Record<string, T> | undefined): T | undefined {
  if (!content) return undefined
  if (content['application/json']) return content['application/json']
  for (const [ct, media] of Object.entries(content)) {
    if (isJsonContentType(ct)) return media
  }
  return undefined
}
