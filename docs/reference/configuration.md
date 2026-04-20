---
description: Every configuration field for the vitepress-openapi-docs plugin with defaults and examples.
---

# Configuration

All configuration lives in one place: the `openApiDocs()` call in your VitePress config. See [existing site setup](/guide/existing-site) for the full config file.

```ts
import { openApiDocs } from 'vitepress-openapi-docs/vitepress'

export default defineConfig({
  extends: await openApiDocs(config, options),
})
```

## `OpenApiDocsConfig`

The first argument. Defines which specs to render and optional display overrides.

### `specs`

An array of spec entries. Even single-API sites use the array form.

```ts
openApiDocs({
  specs: [
    { name: 'public', spec: 'docs/openapi/public.yaml', prefix: '/api' },
    { name: 'admin', spec: 'https://api.example.com/admin/openapi.json', prefix: '/admin' },
  ],
})
```

Each entry:

| Field    | Type     | Required | Description                                                                                                                    |
| -------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `name`   | `string` | yes      | Short identifier. Used in URLs, sidebar, and `<OpenApiEndpoint id="{name}.{operationId}">`.                                    |
| `spec`   | `string` | yes      | Path (relative to project root) or URL to an OpenAPI 3.0/3.1 document (YAML or JSON).                                          |
| `label`  | `string` | no       | Human-readable label for the sidebar header. Defaults to `name`.                                                               |
| `prefix` | `string` | no       | URL prefix for generated pages, e.g. `/api/public`. Required when more than one spec is configured. Defaults to `/api/{name}`. |

### `theme`

Optional visual overrides.

```ts
openApiDocs({
  specs: [
    /* ... */
  ],
  theme: {
    methodColors: {
      get: '#2563eb',
      post: '#1e40af',
      delete: '#dc2626',
    },
  },
})
```

| Field          | Type                                                               | Description                         |
| -------------- | ------------------------------------------------------------------ | ----------------------------------- |
| `methodColors` | `Partial<Record<'get'\|'post'\|'put'\|'patch'\|'delete', string>>` | Override HTTP method badge colours. |

For full theming, use CSS variables — see [Theming](/guide/theming).

### `defaults`

Default prop values applied to every `<OpenApiEndpoint>` unless overridden per-instance.

```ts
openApiDocs({
  specs: [
    /* ... */
  ],
  defaults: {
    bodyInputs: true,
  },
})
```

| Field              | Type                                                                                                     | Default     | Description                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `show`             | `('summary' \| 'description' \| 'params' \| 'request' \| 'response' \| 'auth' \| 'snippets' \| 'try')[]` | all         | Sections to render.                                                                                                         |
| `auth`             | `'none' \| 'bearer' \| 'apikey' \| 'basic' \| 'oauth2'`                                                  | —           | Default auth scheme.                                                                                                        |
| `server`           | `string`                                                                                                 | —           | Default server URL override.                                                                                                |
| `apiKeyHeaderName` | `string`                                                                                                 | —           | Default header name for `apikey` schemes.                                                                                   |
| `bodyInputs`       | `boolean`                                                                                                | `false`     | Render request body properties as individual inputs instead of a JSON textarea.                                             |
| `collapse`         | `Section[]`                                                                                              | `[]`        | Sections to render collapsed (inside a toggle). Applies only in `stacked` layout.                                           |
| `layout`           | `'columns' \| 'stacked'`                                                                                 | `'columns'` | Default card layout. `columns` renders the Try-It panel as a sticky aside; `stacked` keeps everything in one vertical card. |

Pass `defaults` to `enhanceAppWithOpenApi` in your [theme setup](/guide/existing-site#3-theme-setup).

## `OpenApiDocsPluginOptions`

The second argument. Controls build-time behavior.

```ts
openApiDocs(config, {
  srcDir: 'docs',
  repoRoot: process.cwd(),
  onBrokenEmbed: 'error',
  verbose: true,
})
```

| Field           | Type                            | Default                            | Description                                                                   |
| --------------- | ------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| `srcDir`        | `string`                        | `<cwd>/docs`                       | VitePress source directory.                                                   |
| `repoRoot`      | `string`                        | `cwd`                              | Git repository root for changelog extraction.                                 |
| `onBrokenEmbed` | `'error' \| 'warn' \| 'ignore'` | `'error'` in prod, `'warn'` in dev | What to do when a markdown page references an unknown `operationId`.          |
| `verbose`       | `boolean`                       | `false`                            | Log spec discovery, operation counts, page generation, and broken-embed scan. |

## Helper: `defineOpenApiDocs`

Type-only helper for IDE autocompletion:

```ts
import { defineOpenApiDocs } from 'vitepress-openapi-docs'

const config = defineOpenApiDocs({
  specs: [{ name: 'api', spec: './openapi.yaml' }],
})
```

Returns the same object you pass in.
