---
description: Embed interactive API endpoints inline with your markdown prose.
---

# Composing endpoints

The plugin registers components globally — use them directly in any markdown file.

## Inline endpoints

Write prose, drop an endpoint, keep writing:

```md
# Authentication

Exchange your API key for a session token:

<OpenApiEndpoint id="api.auth.login" />

Use the token on subsequent calls:

<OpenApiEndpoint id="api.users.list" />
```

The endpoint renders natively in the page — light DOM, Vue components, VitePress routing.

## The `id` format

With multiple specs, prefix the `operationId` with the spec name:

```md
<OpenApiEndpoint id="public.users.list" />
<OpenApiEndpoint id="admin.settings.get" />
```

With a single spec, the bare `operationId` works:

```md
<OpenApiEndpoint id="users.list" />
```

## Controlling sections

Show only specific sections with the `show` prop:

```md
<OpenApiEndpoint id="api.users.list" :show="['summary', 'snippets']" />
```

Available sections: `summary`, `description`, `params`, `request`, `response`, `auth`, `snippets`, `try`.

Collapse sections behind a toggle with `collapse`:

```md
<OpenApiEndpoint id="api.users.list" :collapse="['response']" />
```

## Per-field body inputs

For simple request bodies, render each property as an individual input instead of a JSON textarea:

```md
<OpenApiEndpoint id="api.users.create" body-inputs />
```

Enable globally via the [`defaults` config](/reference/configuration#defaults).

## Full spec on one page

Render every operation in a spec, grouped by tag:

```md
<OpenApiSpec name="public" />
```

## Named schemas

Render a component schema with property table, required badges, and clickable `$ref` links:

```md
<OpenApiSchema name="User" spec-name="public" />
```

## Changelog

Show a git-history-driven spec diff — added, removed, and renamed operations per commit:

```md
<OpenApiChangelog name="public" />
```

The changelog needs at least two commits touching the spec file. In CI, set `fetch-depth: 0` — shallow clones have no history. Remote URL specs don't support changelog.

## Webhooks

OpenAPI 3.1 webhooks appear in the sidebar, search, and full-spec page with a `webhook` badge:

```md
<OpenApiEndpoint id="api.webhook_post_pet_created" />
```

## SDK snippets

Every endpoint renders tabbed code snippets in curl, fetch, Python, and Node.js. When the user enters credentials via the auth input, all snippets update with the real token. No configuration needed.

To hide snippets, omit `'snippets'` from the `show` prop.

## Search

**Cmd+K / Ctrl+K** opens the operation jumper from anywhere. Mount `SearchTrigger` in the navbar for a visible button:

```ts
import { OperationJumper, SearchTrigger } from 'vitepress-openapi-docs'

Layout() {
  return h(DefaultTheme.Layout, null, {
    'layout-top': () => h(OperationJumper),
    'nav-bar-content-after': () => h(SearchTrigger),
  })
}
```

See [Components reference](/reference/components#searchtrigger) for props.

## Auto-generated pages

For each spec, the plugin generates:

- `/{prefix}/{operationId}` — one page per operation
- `/schemas/{specName}/{typeName}` — one page per named component schema
- `/changelog/{specName}` — spec change history

Hand-written landing pages (`/{prefix}/index.md`) coexist — the generator only writes to `docs/_openapi/`.
