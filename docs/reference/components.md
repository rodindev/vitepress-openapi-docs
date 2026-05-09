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

| Prop               | Type                                                    | Default         | Description                                                                                                             |
| ------------------ | ------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `id`               | `string`                                                | (required)      | `{specName}.{operationId}` for multi-spec, or bare `{operationId}` with one spec.                                       |
| `auth`             | `'none' \| 'bearer' \| 'apikey' \| 'basic' \| 'oauth2'` | auto from spec  | Override the auth scheme.                                                                                               |
| `server`           | `string`                                                | first from spec | Single-server URL override.                                                                                             |
| `show`             | `Section[]`                                             | all sections    | Which sections to render.                                                                                               |
| `apiKeyHeaderName` | `string`                                                | auto from spec  | Header name for `apikey` schemes.                                                                                       |
| `bodyInputs`       | `boolean`                                               | `false`         | Render request body properties as individual inputs instead of a JSON textarea.                                         |
| `layout`           | `'columns' \| 'stacked'`                                | `'columns'`     | `columns` renders the Try-It panel as a sticky aside next to the card. `stacked` keeps everything in one vertical card. |

**Section names:** `summary`, `description`, `params`, `request`, `response`, `auth`, `snippets`, `try`.

**Layout note:** In `columns` (default) the aside lives inside the endpoint container. On pages where VitePress renders a right-side TOC (`aside` frontmatter is not `false`), the aside stacks below the card instead — set `aside: false` in the page's frontmatter so the endpoint aside has room. Viewports at 1279px and below automatically fall back to the `stacked` layout regardless of the `layout` setting.

**Stacked layout collapsing:** In `stacked`, Parameters, Authentication, and Code examples are wrapped in `<details>` collapsed by default. The Try-It panel stays open as the primary call to action.

**Parameters table:** Operations with more than 3 parameters collapse to 3 rows with a `Show all N parameters` toggle. The Try-It panel caps at 3 fields before collapsing.

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

| Prop          | Type                     | Default | Description                                                                                 |
| ------------- | ------------------------ | ------- | ------------------------------------------------------------------------------------------- |
| `name`        | `string`                 | —       | Spec name from your config.                                                                 |
| `show-header` | `boolean`                | `true`  | Render the spec title and description block.                                                |
| `layout`      | `'columns' \| 'stacked'` | inherit | Card layout forwarded to every rendered endpoint. Defaults to the plugin `defaults.layout`. |

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

Shows added/removed/renamed operations and `info.*` field changes per commit. Delta summary text from the commit message renders with inline markdown (code, bold, italic, links) and is sanitised before mount. Empty state when fewer than two commits touch the spec.

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

Tabbed code panel for curl / fetch / Python snippets with built-in syntax highlighting. Normally rendered by `<OpenApiEndpoint>`.

| Prop        | Type        | Description                                                          |
| ----------- | ----------- | -------------------------------------------------------------------- |
| `snippets`  | `Snippet[]` | Array of `{ language, label, code }` objects from `buildSnippets()`. |
| `ariaLabel` | `string`    | Accessible label for the tab list.                                   |

## `<ResponseExamples>`

Accordion of status-code rows with syntax-highlighted JSON response bodies. Rows expand lazily via the native `<details>` element; any number can be open at once. Normally rendered by `<OpenApiEndpoint>`.

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

Cmd+K / Ctrl+K fuzzy-search dialog. Mount in VitePress's `layout-top` slot; see [theme setup](/guide/existing-site#3-theme-setup). Per-spec URL prefixes are read from the provide set by `enhanceAppWithOpenApi`, so no props are needed for cross-link routing.

| Prop          | Type     | Default                               | Description              |
| ------------- | -------- | ------------------------------------- | ------------------------ |
| `placeholder` | `string` | `'Jump to an operation or schema...'` | Input placeholder.       |
| `ariaLabel`   | `string` | `'Jump to an operation or schema'`    | Dialog accessible label. |

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
import { toCurlSnippet, toFetch, toPython } from 'vitepress-openapi-docs'
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
