import { escapeHtml } from './escape'

type TokenType = 'comment' | 'string' | 'command' | 'flag' | 'number' | 'text'

interface Token {
  type: TokenType
  value: string
}

const SHELL_PATTERN =
  /(#[^\n]*)|("(?:\\.|[^"\\])*")|('[^']*')|(?<=^|\s)(curl|bash|sh|wget|http|https)(?=\s|$)|((?<=^|\s)--?[A-Za-z][\w-]*)|(\b\d+(?:\.\d+)?\b)/g

function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let cursor = 0
  for (const match of text.matchAll(SHELL_PATTERN)) {
    const start = match.index ?? 0
    if (start > cursor) {
      tokens.push({ type: 'text', value: text.slice(cursor, start) })
    }
    const [whole, comment, dstr, sstr, cmd, flag, num] = match
    if (comment !== undefined) tokens.push({ type: 'comment', value: comment })
    else if (dstr !== undefined) tokens.push({ type: 'string', value: dstr })
    else if (sstr !== undefined) tokens.push({ type: 'string', value: sstr })
    else if (cmd !== undefined) tokens.push({ type: 'command', value: cmd })
    else if (flag !== undefined) tokens.push({ type: 'flag', value: flag })
    else if (num !== undefined) tokens.push({ type: 'number', value: num })
    cursor = start + whole.length
  }
  if (cursor < text.length) {
    tokens.push({ type: 'text', value: text.slice(cursor) })
  }
  return tokens
}

const CLASSES: Record<Exclude<TokenType, 'text'>, string> = {
  comment: 'vod-syntax-comment',
  string: 'vod-syntax-string',
  command: 'vod-syntax-keyword',
  flag: 'vod-syntax-keyword',
  number: 'vod-syntax-number',
}

export function highlightShell(text: string): string {
  return tokenize(text)
    .map((tok) => {
      const safe = escapeHtml(tok.value)
      if (tok.type === 'text') return safe
      return `<span class="${CLASSES[tok.type]}">${safe}</span>`
    })
    .join('')
}
