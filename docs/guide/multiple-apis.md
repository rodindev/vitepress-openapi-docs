---
description: Document multiple independent APIs from a single VitePress site.
---

# Multiple APIs

Each spec gets its own sidebar, URL prefix, and set of generated pages.

## Config

```ts
openApiDocs({
  specs: [
    {
      name: 'public',
      spec: 'docs/openapi/public.yaml',
      label: 'Public API',
      prefix: '/api/public',
    },
    { name: 'admin', spec: 'docs/openapi/admin.yaml', label: 'Admin API', prefix: '/api/admin' },
  ],
})
```

Each spec must have a unique `name` and `prefix`. See [Configuration reference](/reference/configuration#specs) for all fields.

## Sidebar

Each spec gets an independent sidebar. Public API pages show only Public API operations:

```
# Viewing /api/public/*          # Viewing /api/admin/*

Users                            Settings
  GET /users                       GET /settings
  POST /users                    Schemas
Orders                             AdminConfig
  GET /orders                    Changelog
Schemas                            History
  User
Changelog
  History
```

## Referencing operations

Always prefix the `operationId` with the spec name:

```md
<OpenApiEndpoint id="public.users.list" />
<OpenApiEndpoint id="admin.settings.get" />
```

## Landing pages

The plugin doesn't generate landing pages — write them yourself:

```md
<!-- docs/api/public/index.md -->

# Public API

<OpenApiSpec name="public" />
```

## Schema cross-links

When an operation references a component schema (e.g. `$ref: '#/components/schemas/User'`), the endpoint page links to `/schemas/{specName}/{typeName}`.

## Auth per spec

Credentials are scoped per spec name. Setting a bearer token on the Public API doesn't affect the Admin API.

## Search

The Cmd+K jumper searches across all registered specs. Results show which spec each operation belongs to.
