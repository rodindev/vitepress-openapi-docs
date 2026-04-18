---
description: Add vitepress-openapi-docs to an existing VitePress project.
---

# Add to an existing site

## 1. Install

```bash
npm i vitepress-openapi-docs vue-api-playground
```

## 2. Plugin config

```ts
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'
import { openApiDocs } from 'vitepress-openapi-docs/vitepress'

export default defineConfig({
  extends: await openApiDocs({
    specs: [{ name: 'api', spec: 'docs/openapi/api.yaml', prefix: '/api' }],
  }),
})
```

The `spec` path is relative to the project root. Remote URLs (e.g. `https://api.example.com/openapi.json`) are also supported — fetched at build time and cached.

See [Configuration reference](/reference/configuration) for all available fields.

## 3. Theme setup

```ts
// docs/.vitepress/theme/index.ts
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { enhanceAppWithOpenApi, OperationJumper } from 'vitepress-openapi-docs'
import specs, { defaults } from 'virtual:vitepress-openapi-docs/specs'
import changelogs from 'virtual:vitepress-openapi-docs/changelogs'
import 'vue-api-playground/styles'
import 'vitepress-openapi-docs/styles'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(OperationJumper),
    })
  },
  enhanceApp({ app }) {
    enhanceAppWithOpenApi({ app, specs, changelogs, defaults })
  },
}
```

Import order matters: `vue-api-playground/styles` first, then `vitepress-openapi-docs/styles`, then your overrides. Each layer expands the CSS variable cascade without losing defaults.

The `changelogs` and `defaults` properties are optional — omit them if you don't use `<OpenApiChangelog>` or custom defaults.

The `OperationJumper` enables **Cmd+K / Ctrl+K** fuzzy search across all operations.

## 4. Gitignore

Add the generated pages directory:

```
docs/_openapi/
```

## 5. TypeScript (optional)

Add virtual module types to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vitepress-openapi-docs/virtual"]
  }
}
```

Or use a triple-slash directive in your theme file:

```ts
/// <reference types="vitepress-openapi-docs/virtual" />
```

## Requirements

- **Node.js** >= 18
- **Vue** >= 3.3
- **VitePress** >= 1.0
- **vue-api-playground** >= 2.2 (peer dependency)
