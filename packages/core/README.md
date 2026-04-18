# vitepress-openapi-docs

Interactive OpenAPI documentation for VitePress. Vue-native, composable in markdown.

> Pre-release. v1.0 is the launch milestone.

## Install

```bash
npm i vitepress-openapi-docs vue-api-playground
```

Peer deps: `vue ^3.3.0`, `vitepress ^1.0.0`, `vue-api-playground ^2.2.0`.

## Configure

```ts
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'
import { openApiDocs } from 'vitepress-openapi-docs/vitepress'

export default defineConfig({
  extends: await openApiDocs({
    specs: [
      { name: 'public', spec: 'docs/openapi/public.yaml', prefix: '/api/public' },
      { name: 'admin', spec: 'docs/openapi/admin.yaml', prefix: '/api/admin' },
    ],
  }),
})
```

```ts
// docs/.vitepress/theme/index.ts
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { enhanceAppWithOpenApi, OperationJumper } from 'vitepress-openapi-docs'
import specs from 'virtual:vitepress-openapi-docs/specs'
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
    enhanceAppWithOpenApi({ app, specs, changelogs })
  },
}
```

## Use in markdown

```md
<OpenApiEndpoint id="public.users.list" />

<OpenApiSpec name="public" />

<OpenApiSchema name="User" spec-name="public" />

<OpenApiChangelog name="public" />
```

Per-operation, per-schema, and per-spec-changelog pages are auto-generated. Hand-written landing pages sit alongside at the same URL prefix.

See the repo README for the full feature list and the guide for theming and multi-API usage.
