import { escapeHtml } from './escape'

type TokenType = 'comment' | 'string' | 'keyword' | 'number' | 'text'

interface Token {
  type: TokenType
  value: string
}

const KEYWORDS =
  'import|from|as|def|class|if|elif|else|for|while|in|not|and|or|is|None|True|False|return|raise|try|except|finally|with|lambda|yield|async|await|pass|break|continue|global|nonlocal'

const PY_PATTERN = new RegExp(
  [
    '(#[^\\n]*)', // comment
    '([rRfFbBuU]{0,2}"""[\\s\\S]*?""")', // triple double string
    "([rRfFbBuU]{0,2}'''[\\s\\S]*?''')", // triple single string
    '([rRfFbBuU]{0,2}"(?:\\\\.|[^"\\\\])*")', // double string
    "([rRfFbBuU]{0,2}'(?:\\\\.|[^'\\\\])*')", // single string
    `\\b(${KEYWORDS})\\b`, // keyword
    '(\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)', // number
  ].join('|'),
  'g'
)

function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let cursor = 0
  for (const match of text.matchAll(PY_PATTERN)) {
    const start = match.index ?? 0
    if (start > cursor) {
      tokens.push({ type: 'text', value: text.slice(cursor, start) })
    }
    const [whole, comment, td, ts, dstr, sstr, kw, num] = match
    if (comment !== undefined) tokens.push({ type: 'comment', value: comment })
    else if (td !== undefined) tokens.push({ type: 'string', value: td })
    else if (ts !== undefined) tokens.push({ type: 'string', value: ts })
    else if (dstr !== undefined) tokens.push({ type: 'string', value: dstr })
    else if (sstr !== undefined) tokens.push({ type: 'string', value: sstr })
    else if (kw !== undefined) tokens.push({ type: 'keyword', value: kw })
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
  keyword: 'vod-syntax-keyword',
  number: 'vod-syntax-number',
}

export function highlightPython(text: string): string {
  return tokenize(text)
    .map((tok) => {
      const safe = escapeHtml(tok.value)
      if (tok.type === 'text') return safe
      return `<span class="${CLASSES[tok.type]}">${safe}</span>`
    })
    .join('')
}
