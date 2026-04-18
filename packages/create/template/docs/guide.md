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
3. Update the `prefixes` map in `docs/.vitepress/theme/index.ts`

## Using endpoints in markdown

Write `<OpenApiEndpoint>` anywhere in your markdown:

```md
## Create a user

<OpenApiEndpoint id="createUser" />
```

The endpoint renders inline with your prose. See the [components guide](https://rodindev.github.io/vitepress-openapi-docs/guide/components) for all available components.
