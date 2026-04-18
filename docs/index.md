---
layout: home
title: VitePress OpenAPI Docs
titleTemplate: Interactive OpenAPI docs for VitePress
description: Drop interactive OpenAPI 3.x endpoints anywhere in your markdown. Vue-native VitePress plugin — no shadow DOM, no iframes. Multi-API, SDK snippets, auth, git-driven changelog.

hero:
  text: VitePress OpenAPI Docs
  tagline: Drop interactive API endpoints anywhere in your markdown.
  actions:
    - theme: brand
      text: Quick Start
      link: /guide/
    - theme: alt
      text: Live demo
      link: /api/petstore/
---

## See it live

A real Petstore endpoint rendered inline — click Execute, get a response:

<OpenApiEndpoint id="petstore.getPetById" :show="['summary', 'params', 'try']" />

This site documents two APIs: [Petstore](/api/petstore/) (19 ops) and a [Mock API](/api/mock/) (57 ops). Each has its own sidebar and search index.

## Install

```bash
npm create vitepress-openapi-docs@latest my-api-docs
cd my-api-docs && npm install && npm run dev
```

Or [add to an existing VitePress site](/guide/existing-site).

## What you get

- **Inline composition** — endpoints render as Vue components in light DOM. Weave them into tutorials, drop them between paragraphs, theme them with VitePress CSS variables.
- **Multiple APIs** — array of specs, each with its own sidebar, URL prefix, and search index.
- **Auth and SDK snippets** — bearer / basic / API key / OAuth2 with session persistence. curl / fetch / Python / Node snippets update live with credentials.
- **< 10 KB client bundle** — peer dependencies (Vue, VitePress, vue-api-playground) excluded.
