export interface SpecEntry {
  /** Short name used in URLs and config, e.g. `'public'` or `'admin'`. */
  name: string
  /** File path or URL to the OpenAPI spec. */
  source: string
}

export function generateConfig(
  title: string,
  specs: SpecEntry[],
  defaults: Record<string, unknown>
): string {
  const navItems =
    specs.length === 1
      ? `{ text: 'API Reference', link: '/api/${specs[0]!.name}/' },`
      : specs
          .map((s) => `{ text: ${quote(capitalize(s.name) + ' API')}, link: '/api/${s.name}/' },`)
          .join('\n      ')

  const specEntries = specs
    .map(
      (s) =>
        `{ name: ${quote(s.name)}, spec: ${JSON.stringify(s.source)}, prefix: '/api/${s.name}' }`
    )
    .join(',\n      ')

  const defaultsLine = Object.keys(defaults).length
    ? `\n    defaults: { ${Object.entries(defaults)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(', ')} },`
    : ''

  return `import { defineConfig } from 'vitepress'
import { openApiDocs } from 'vitepress-openapi-docs/vitepress'

export default defineConfig({
  title: ${quote(title)},
  description: 'Interactive OpenAPI documentation',
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide' },
      ${navItems}
    ],

    sidebar: {
      '/guide': [
        {
          text: 'Getting Started',
          items: [{ text: 'Introduction', link: '/guide' }],
        },
      ],
    },

    footer: {
      message: 'Built with vitepress-openapi-docs',
    },
  },

  extends: await openApiDocs({
    specs: [${specEntries}],${defaultsLine}
  }),
})
`
}

export function generateTheme(): string {
  return `import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { enhanceAppWithOpenApi, OperationJumper, SearchTrigger } from 'vitepress-openapi-docs'
import specs, { defaults, prefixes } from 'virtual:vitepress-openapi-docs/specs'
import changelogs from 'virtual:vitepress-openapi-docs/changelogs'
import 'vue-api-playground/styles'
import 'vitepress-openapi-docs/styles'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(OperationJumper),
      'nav-bar-content-after': () => h(SearchTrigger),
    })
  },
  enhanceApp({ app }) {
    enhanceAppWithOpenApi({ app, specs, changelogs, defaults, prefixes })
  },
}
`
}

export function generateIndexMd(title: string, specs: SpecEntry[], demoEndpoint?: string): string {
  const firstLink = `/api/${specs[0]!.name}/`

  const tryItBlock = demoEndpoint
    ? `

## Try it

This is a live endpoint from your OpenAPI spec. Click "Send" to make a real request.

<OpenApiEndpoint id="${demoEndpoint}" />
`
    : ''

  return `---
layout: home
title: ${yamlQuote(title)}
hero:
  text: ${yamlQuote(title)}
  tagline: Interactive API documentation, powered by vitepress-openapi-docs.
  actions:
    - theme: brand
      text: API Reference
      link: ${firstLink}
    - theme: alt
      text: Guide
      link: /guide
---
${tryItBlock}
## What's next

Browse the [API Reference](${firstLink}) for every operation and schema, or edit \`.vitepress/config.ts\` to add more specs and tweak display options.

Use \`Cmd+K\` (or \`Ctrl+K\`) to jump to any operation or schema.
`
}

export function generateApiIndexMd(specName: string): string {
  return `---
aside: false
---

# API Reference

All operations and schemas from your OpenAPI spec. Per-operation and per-schema pages are auto-generated and reachable from the sidebar.

<OpenApiSpec name="${specName}" />
`
}

export function generateGuideMd(specs: SpecEntry[]): string {
  const specLines = specs.map((s) => `    ${s.name}/index.md`).join('\n')

  return `# Introduction

This site is built with [vitepress-openapi-docs](https://www.npmjs.com/package/vitepress-openapi-docs).

## Project structure

\`\`\`
docs/
  .vitepress/
    config.ts          ← plugin config + VitePress config
    theme/index.ts     ← component registration + styles
  api/
${specLines}
  index.md             ← landing page
\`\`\`

## Using endpoints in markdown

Write \`<OpenApiEndpoint>\` anywhere in your markdown:

\`\`\`md
## Create a user

<OpenApiEndpoint id="createUser" />
\`\`\`

The endpoint renders inline with your prose. See the [components guide](https://rodindev.github.io/vitepress-openapi-docs/guide/components) for all available components.
`
}

export function quote(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function yamlQuote(s: string): string {
  if (/[:#[\]{}>&*!|'"%@`\n\r]/.test(s))
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`
  return s
}
