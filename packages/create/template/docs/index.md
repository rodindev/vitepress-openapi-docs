---
layout: home
title: My API
hero:
  text: My API
  tagline: Interactive API documentation, powered by vitepress-openapi-docs.
  actions:
    - theme: brand
      text: API Reference
      link: /api/mock/
    - theme: alt
      text: Guide
      link: /guide
---

## Try it

This is a live endpoint from your OpenAPI spec. Click "Send" to make a real request.

<OpenApiEndpoint id="listUsers" />

## Quick start

Replace `docs/openapi/mock.json` with your own OpenAPI 3.x spec, update the spec path in `.vitepress/config.ts`, and you're done.

```ts
// docs/.vitepress/config.ts
extends: await openApiDocs({
  specs: [{ name: 'myapi', spec: 'docs/openapi/myapi.yaml', prefix: '/api' }],
})
```

Use `Cmd+K` (or `Ctrl+K`) to jump to any operation or schema.
