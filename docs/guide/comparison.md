---
description: How vitepress-openapi-docs compares to vitepress-openapi and Scalar.
---

# Comparison

How `vitepress-openapi-docs` differs from other OpenAPI documentation tools.

## vs. vitepress-openapi

`vitepress-openapi` is the closest peer — also Vue-native, also a VitePress plugin. The data model is similar; the composition story and scope are what differ.

### Config

`vitepress-openapi` requires manual sidebar construction:

```ts
import { useSidebar, useOpenapi } from 'vitepress-openapi'

const openapi = useOpenapi({ spec: require('./petstore.json') })
const sidebar = useSidebar({ spec: openapi.spec })

export default defineConfig({
  themeConfig: {
    sidebar: sidebar.generateSidebarGroups(),
  },
})
```

`vitepress-openapi-docs` returns sidebar, rewrites, and Vite plugins from a single call:

```ts
import { openApiDocs } from 'vitepress-openapi-docs/vitepress'

export default defineConfig({
  extends: await openApiDocs({
    specs: [{ name: 'api', spec: 'docs/openapi/api.yaml', prefix: '/api' }],
  }),
})
```

### Components

| `vitepress-openapi`                 | `vitepress-openapi-docs`                                              |
| ----------------------------------- | --------------------------------------------------------------------- |
| `<OAOperation operationId="..." />` | `<OpenApiEndpoint id="..." />`                                        |
| `<OASpec />`                        | `<OpenApiSpec name="..." />`                                          |
| (per-spec sidebar helper)           | auto-generated via `openApiDocs()`                                    |
| (schemas shown inline)              | `<OpenApiSchema name="..." spec-name="..." />` + auto-generated pages |
| —                                   | `<OpenApiChangelog name="..." />`                                     |
| —                                   | Cmd+K search via `<OperationJumper />`                                |

### What's different

Both are Vue-native with no web components or iframes. `vitepress-openapi-docs` adds multi-API support (array of specs with independent sidebars), SDK snippets with auth injection, session-scoped auth persistence, a git-driven changelog, auto-generated schema pages, and Cmd+K search.

## vs. Scalar

Scalar ships as a framework-agnostic web component (shadow DOM). `vitepress-openapi-docs` trades portability for deep VitePress integration and inline composition.

|                                  | Scalar                        | `vitepress-openapi-docs`                  |
| -------------------------------- | ----------------------------- | ----------------------------------------- |
| Runtime                          | Web component (shadow DOM)    | Vue 3 component (light DOM)               |
| Framework                        | Any                           | VitePress + Vue 3                         |
| Bundle                           | ~400 KB gzipped (full widget) | < 10 KB gzipped (client only)             |
| Themes                           | Scalar's own system           | CSS variables cascading through VitePress |
| Inline composition with markdown | No — iframe-like isolation    | Yes                                       |
| Sidebar navigation               | Internal to the widget        | Native VitePress routing                  |
| Auth persistence                 | Widget-internal               | `sessionStorage`, visible in snippets     |
| Multi-API                        | One widget per spec           | Array of specs, independent sidebars      |

Scalar gives you a self-contained widget that works anywhere. `vitepress-openapi-docs` gives you a full docs site where API reference, guides, and tutorials share one page tree, one search, and one theme.

## Switching

If you're moving from either tool:

1. Install: `npm i vitepress-openapi-docs vue-api-playground`
2. Set up config and theme — see [existing site guide](/guide/existing-site)
3. Replace component tags: `<OAOperation>` / `<ApiReference>` → `<OpenApiEndpoint>` / `<OpenApiSpec>`
4. Add `docs/_openapi/` to `.gitignore`
5. Run `npm run dev`

Open an issue if you hit a corner case this guide doesn't cover.
