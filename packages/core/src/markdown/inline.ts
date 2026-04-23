import { escapeHtml } from '../highlight/escape'

export function renderInlineMarkdown(text: string): string {
  let out = escapeHtml(text)
  out = out.replace(/`([^`]+?)`/g, '<code>$1</code>')
  out = out.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^_])_([^_\n]+?)_(?!_)/g, '$1<em>$2</em>')
  out = out.replace(
    /\[([^\]]+?)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" rel="noopener noreferrer">$1</a>'
  )
  return out
}
