import { escapeHtml } from './escape'
import { highlightJavaScript } from './javascript'
import { highlightJson } from './json'
import { highlightPython } from './python'
import { highlightShell } from './shell'

export { escapeHtml, highlightJavaScript, highlightJson, highlightPython, highlightShell }

export function highlight(code: string, lang: string): string {
  switch (lang) {
    case 'curl':
    case 'shell':
    case 'bash':
      return highlightShell(code)
    case 'fetch':
    case 'javascript':
    case 'js':
    case 'node':
      return highlightJavaScript(code)
    case 'python':
      return highlightPython(code)
    case 'json':
      return highlightJson(code)
    default:
      return escapeHtml(code)
  }
}
