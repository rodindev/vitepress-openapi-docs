# vitepress-openapi-docs

Interactive OpenAPI documentation for VitePress. Lightweight, Vue-native, composable in markdown.

[Documentation](https://rodindev.github.io/vitepress-openapi-docs/)

## Install

```bash
npm i vitepress-openapi-docs vue-api-playground
```

## Configure

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

```ts
// docs/.vitepress/theme/index.ts
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { enhanceAppWithOpenApi, OperationJumper } from 'vitepress-openapi-docs'
import specs, { defaults, prefixes } from 'virtual:vitepress-openapi-docs/specs'
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
    enhanceAppWithOpenApi({ app, specs, changelogs, defaults, prefixes })
  },
}
```

`changelogs`, `defaults`, and `prefixes` are optional - omit them if you don't use `<OpenApiChangelog>`, custom defaults, or multi-spec prefixes.

## Use in markdown

```md
<OpenApiEndpoint id="api.users.list" />

<OpenApiSpec name="api" />

<OpenApiSchema name="User" spec-name="api" />

<OpenApiChangelog name="api" />
```

Per-operation, per-schema, and per-spec-changelog pages are auto-generated. Hand-written landing pages sit alongside at the same URL prefix.

## Requirements

- Node.js >= 18
- Vue >= 3.3
- VitePress >= 1.0
- vue-api-playground >= 2.5

## License

MIT
