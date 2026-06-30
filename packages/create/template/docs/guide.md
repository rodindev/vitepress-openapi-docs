# Introduction

This site is built with [vitepress-openapi-docs](https://www.npmjs.com/package/vitepress-openapi-docs).

## Project structure

```
docs/
  .vitepress/
    config.ts          ← plugin config + VitePress config
    theme/index.ts     ← component registration + styles
  openapi/
    mock.json          ← your OpenAPI spec (swap this)
  api/mock/
    index.md           ← API overview page
  index.md             ← landing page
```

## Adding your own spec

1. Drop your OpenAPI 3.x file (YAML or JSON) into `docs/openapi/`
2. Update the spec path in `docs/.vitepress/config.ts`

The sidebar, URL prefixes, and generated pages all follow from the `specs` array in `config.ts`. There's no separate map to keep in sync.

## Using endpoints in markdown

Write `<OpenApiEndpoint>` anywhere in your markdown:

```md
## Create a user

<OpenApiEndpoint id="createUser" />
```

The endpoint renders inline with your prose. See the [components reference](https://rodindev.github.io/vitepress-openapi-docs/reference/components) for all available components.
