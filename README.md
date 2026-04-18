[![npm version](https://img.shields.io/npm/v/vitepress-openapi-docs)](https://www.npmjs.com/package/vitepress-openapi-docs)
[![CI](https://github.com/rodindev/vitepress-openapi-docs/actions/workflows/ci.yml/badge.svg)](https://github.com/rodindev/vitepress-openapi-docs/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

# vitepress-openapi-docs

The only OpenAPI docs tool where endpoints render inline with your markdown prose. Vue-native VitePress plugin — no shadow DOM, no iframes, no walls.

## Why this exists

Scalar, RapiDoc, Stoplight Elements — they render API docs inside web components or iframes. They work, but you can't put a paragraph between two endpoints. You can't style them with your VitePress CSS variables. They're embedded apps, not documentation.

This plugin is different:

```md
# Authentication

Exchange your API key for a session token:

<OpenApiEndpoint id="auth.login" />

Then use the token on subsequent calls:

<OpenApiEndpoint id="users.list" auth="bearer" />
```

Endpoints render natively in VitePress — light DOM, Vue components, same theme.

## Install

```bash
npm create vitepress-openapi-docs@latest my-api-docs
cd my-api-docs && npm install && npm run dev
```

Or add to an existing VitePress site:

```bash
npm i vitepress-openapi-docs vue-api-playground
```

Two files to wire up — [full guide](https://rodindev.github.io/vitepress-openapi-docs/guide/existing-site).

## What's included

- **`<OpenApiEndpoint>`** — one operation inline in any markdown page: params, request/response types, SDK snippets, try-it panel, auth
- **`<OpenApiSpec>`** — full spec grouped by tag
- **`<OpenApiSchema>`** — property table with clickable `$ref` links
- **`<OpenApiChangelog>`** — git-history-driven spec diff (added/removed/renamed operations per commit)
- **Cmd+K jumper** — fuzzy search across all operations and schemas
- **Multi-API** — N specs, one config, independent sidebar per spec, one jumper
- **Auth** — bearer / basic / apikey / OAuth2 passthrough, stored in sessionStorage
- **< 10 KB** client bundle (peer deps excluded), enforced in CI

## Why this over Swagger UI or Scalar

Swagger UI is heavy and looks dated. Scalar is modern but renders inside a web component — a black box you can't mix with your own content. Both give you a standalone widget, not documentation.

This gives you a full docs site: auto-generated pages, Cmd+K search, schema cross-links, git-driven changelog, multi-API with independent sidebars. SDK snippets in 4 languages. Auth that persists across pages. And one thing no other tool does — endpoints that compose inline with your markdown prose.

## Requirements

- Node.js >= 18
- Vue >= 3.3
- VitePress >= 1.0
- vue-api-playground >= 2.2

## License

MIT
