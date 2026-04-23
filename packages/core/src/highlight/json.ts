import { escapeHtml } from './escape'

type TokenType = 'key' | 'string' | 'number' | 'bool' | 'text'

interface Token {
  type: TokenType
  value: string
}

const JSON_PATTERN =
  /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g

function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let cursor = 0
  for (const match of text.matchAll(JSON_PATTERN)) {
    const start = match.index ?? 0
    if (start > cursor) {
      tokens.push({ type: 'text', value: text.slice(cursor, start) })
    }
    const [whole, str, colon, num, bool] = match
    if (str !== undefined) {
      if (colon !== undefined) {
        tokens.push({ type: 'key', value: str })
        tokens.push({ type: 'text', value: colon })
      } else {
        tokens.push({ type: 'string', value: str })
      }
    } else if (num !== undefined) {
      tokens.push({ type: 'number', value: num })
    } else if (bool !== undefined) {
      tokens.push({ type: 'bool', value: bool })
    }
    cursor = start + whole.length
  }
  if (cursor < text.length) {
    tokens.push({ type: 'text', value: text.slice(cursor) })
  }
  return tokens
}

const CLASSES: Record<Exclude<TokenType, 'text'>, string> = {
  key: 'vap-json-key',
  string: 'vap-json-string',
  number: 'vap-json-number',
  bool: 'vap-json-bool',
}

export function highlightJson(text: string): string {
  return tokenize(text)
    .map((tok) => {
      const safe = escapeHtml(tok.value)
      if (tok.type === 'text') return safe
      return `<span class="${CLASSES[tok.type]}">${safe}</span>`
    })
    .join('')
}
