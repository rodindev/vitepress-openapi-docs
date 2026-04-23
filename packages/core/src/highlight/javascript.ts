import { escapeHtml } from './escape'

type TokenType = 'comment' | 'string' | 'keyword' | 'function' | 'number' | 'text'

interface Token {
  type: TokenType
  value: string
}

const KEYWORDS =
  'const|let|var|function|class|if|else|return|new|try|catch|finally|throw|for|while|do|break|continue|switch|case|default|extends|import|from|export|typeof|instanceof|in|of|delete|void|this|super|null|undefined|true|false|async|await|yield'

const JS_PATTERN = new RegExp(
  [
    '(/\\*[\\s\\S]*?\\*/)', // block comment
    '(//[^\\n]*)', // line comment
    '("(?:\\\\.|[^"\\\\])*")', // double-quoted string
    "('(?:\\\\.|[^'\\\\])*')", // single-quoted string
    '(`(?:\\\\.|[^`\\\\])*`)', // template literal
    `\\b(${KEYWORDS})\\b`, // keyword
    '([A-Za-z_]\\w*)(?=\\s*\\()', // function call
    '(\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)', // number
  ].join('|'),
  'g'
)

function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let cursor = 0
  for (const match of text.matchAll(JS_PATTERN)) {
    const start = match.index ?? 0
    if (start > cursor) {
      tokens.push({ type: 'text', value: text.slice(cursor, start) })
    }
    const [whole, block, line, dstr, sstr, tmpl, kw, fn, num] = match
    if (block !== undefined) tokens.push({ type: 'comment', value: block })
    else if (line !== undefined) tokens.push({ type: 'comment', value: line })
    else if (dstr !== undefined) tokens.push({ type: 'string', value: dstr })
    else if (sstr !== undefined) tokens.push({ type: 'string', value: sstr })
    else if (tmpl !== undefined) tokens.push({ type: 'string', value: tmpl })
    else if (kw !== undefined) tokens.push({ type: 'keyword', value: kw })
    else if (fn !== undefined) tokens.push({ type: 'function', value: fn })
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
  function: 'vod-syntax-function',
  number: 'vod-syntax-number',
}

export function highlightJavaScript(text: string): string {
  return tokenize(text)
    .map((tok) => {
      const safe = escapeHtml(tok.value)
      if (tok.type === 'text') return safe
      return `<span class="${CLASSES[tok.type]}">${safe}</span>`
    })
    .join('')
}
