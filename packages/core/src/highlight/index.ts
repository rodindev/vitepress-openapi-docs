import { escapeHtml } from './escape'
import { highlightJson } from './json'
import { highlightShell } from './shell'

export { escapeHtml, highlightJson, highlightShell }

export function highlight(code: string, lang: string): string {
  switch (lang) {
    case 'curl':
    case 'shell':
    case 'bash':
      return highlightShell(code)
    case 'json':
      return highlightJson(code)
    default:
      return escapeHtml(code)
  }
}
