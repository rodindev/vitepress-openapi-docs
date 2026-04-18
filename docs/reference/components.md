---
description: Props, events, and types for every component in vitepress-openapi-docs.
---

# Components

All components are globally registered by `enhanceAppWithOpenApi()` — use them directly in any markdown file. See [Composing endpoints](/guide/composing-endpoints) for usage patterns.

## `<OpenApiEndpoint>`

Renders one operation inline with prose.

```md
<OpenApiEndpoint id="public.users.list" />
```

### Props

| Prop               | Type                                                    | Default         | Description                                                                       |
| ------------------ | ------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------- |
| `id`               | `string`                                                | (required)      | `{specName}.{operationId}` for multi-spec, or bare `{operationId}` with one spec. |
| `auth`             | `'none' \| 'bearer' \| 'apikey' \| 'basic' \| 'oauth2'` | auto from spec  | Override the auth scheme.                                                         |
| `server`           | `string`                                                | first from spec | Single-server URL override.                                                       |
| `show`             | `Section[]`                                             | all sections    | Which sections to render.                                                         |
| `apiKeyHeaderName` | `string`                                                | auto from spec  | Header name for `apikey` schemes.                                                 |
| `bodyInputs`       | `boolean`                                               | `false`         | Render request body properties as individual inputs instead of a JSON textarea.   |
| `collapse`         | `Section[]`                                             | `[]`            | Sections to render collapsed (inside a toggle).                                   |

**Section names:** `summary`, `description`, `params`, `request`, `response`, `auth`, `snippets`, `try`.

### Events

| Event             | Payload                 | Description                                  |
| ----------------- | ----------------------- | -------------------------------------------- |
| `request-start`   | `RequestStartPayload`   | Fires when the Try-It panel sends a request. |
| `request-success` | `RequestSuccessPayload` | Fires on a successful response.              |
| `request-error`   | `RequestErrorPayload`   | Fires on a network or server error.          |

## `<OpenApiSpec>`

Renders every operation in a spec, grouped by tag.

```md
<OpenApiSpec name="public" />
```

| Prop   | Type     | Description                 |
| ------ | -------- | --------------------------- |
| `name` | `string` | Spec name from your config. |

## `<OpenApiSchema>`

Property table for a named component schema.

```md
<OpenApiSchema name="User" spec-name="public" />
```

| Prop        | Type     | Description                       |
| ----------- | -------- | --------------------------------- |
| `name`      | `string` | Schema name (e.g. `User`).        |
| `spec-name` | `string` | Which spec the schema belongs to. |

Renders required badges and turns `$ref` references into clickable links to other schema pages.

## `<OpenApiChangelog>`

Git-history-driven spec diff.

```md
<OpenApiChangelog name="public" />
```

| Prop   | Type     | Description |
| ------ | -------- | ----------- |
| `name` | `string` | Spec name.  |

Shows added/removed/renamed operations and `info.*` field changes per commit. Empty state when fewer than two commits touch the spec.

::: tip CI note
The changelog needs real git history. Add `fetch-depth: 0` to your CI checkout step.
:::

## `<AuthControls>`

Auth input for a single spec. Normally rendered by `<OpenApiEndpoint>` — use standalone when building custom layouts.

```md
<AuthControls spec-name="public" scheme="bearer" />
```

| Prop          | Type                              | Description                                                 |
| ------------- | --------------------------------- | ----------------------------------------------------------- |
| `spec-name`   | `string`                          | Spec name.                                                  |
| `scheme`      | `AuthScheme \| 'none'`            | Auth type.                                                  |
| `header-name` | `string`                          | Header name for `apikey`.                                   |
| `api-key-in`  | `'header' \| 'query' \| 'cookie'` | Where the API key is sent. Defaults to `'header'`.          |
| `oauth2-flow` | `ParsedOAuth2Flow`                | OAuth2 flow details (authorization URL, token URL, scopes). |

## `<SdkSnippets>`

Tabbed code panel for curl / fetch / Python / Node snippets. Normally rendered by `<OpenApiEndpoint>`.

| Prop        | Type        | Description                                                          |
| ----------- | ----------- | -------------------------------------------------------------------- |
| `snippets`  | `Snippet[]` | Array of `{ language, label, code }` objects from `buildSnippets()`. |
| `ariaLabel` | `string`    | Accessible label for the tab list.                                   |

## `<ResponseExamples>`

Status-code tabs with syntax-highlighted response bodies. Normally rendered by `<OpenApiEndpoint>`.

| Prop        | Type               | Description                         |
| ----------- | ------------------ | ----------------------------------- |
| `responses` | `ParsedResponse[]` | Parsed responses from an operation. |

## `<SearchTrigger>`

Button that opens the `<OperationJumper>` dialog.

```md
<SearchTrigger text="Search API..." />
```

| Prop        | Type     | Default                           | Description       |
| ----------- | -------- | --------------------------------- | ----------------- |
| `text`      | `string` | `'Search...'`                     | Button label.     |
| `ariaLabel` | `string` | `'Search operations and schemas'` | Accessible label. |

## `<OperationJumper>`

Cmd+K / Ctrl+K fuzzy-search dialog. Mount in VitePress's `layout-top` slot — see [theme setup](/guide/existing-site#3-theme-setup).

| Prop          | Type                     | Default                             | Description               |
| ------------- | ------------------------ | ----------------------------------- | ------------------------- |
| `prefixes`    | `Record<string, string>` | `{}`                                | URL prefix per spec name. |
| `placeholder` | `string`                 | `'Jump to an operation or schema…'` | Input placeholder.        |
| `ariaLabel`   | `string`                 | `'Jump to an operation or schema'`  | Dialog accessible label.  |

## Programmatic API

### `buildSnippets()`

Generate SDK snippets programmatically:

```ts
import { buildSnippets } from 'vitepress-openapi-docs'

const snippets = buildSnippets(operation, {
  baseUrl: 'https://api.example.com',
  auth: { scheme: 'bearer', value: 'my-token' },
  exampleBody: '{"name": "test"}',
})
```

### Snippet generators

Re-exported from `vue-api-playground`:

```ts
import { toCurlSnippet, toFetch, toPython, toNode } from 'vitepress-openapi-docs'
```

Each takes a `SnippetRequest`:

```ts
interface SnippetRequest {
  url: string
  method: string
  headers?: Record<string, string>
  body?: string
}
```

### `useAuthState()`

Reactive auth state for a spec (advanced — for custom layouts):

```ts
import { useAuthState, readStoredCredential } from 'vitepress-openapi-docs'

const auth = useAuthState('api')
auth.set({ scheme: 'bearer', value: 'my-token' })
auth.clear()

// Synchronous read
const cred = readStoredCredential('api')
```
