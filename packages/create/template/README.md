# my-api-docs

Interactive OpenAPI documentation, scaffolded with `create-vitepress-openapi-docs`.

```bash
npm install
npm run dev
```

The scaffold ships with a snapshot of our full-featured mock spec at `docs/openapi/mock.json` (OpenAPI 3.1, 107 operations, 34 webhooks, bearer auth). Replace it with your own OpenAPI 3.x file when you're ready, then restart the dev server so the spec re-parses.

## Layout

- `docs/.vitepress/config.ts`: VitePress + the OpenAPI plugin
- `docs/.vitepress/theme/index.ts`: registers the OpenAPI components
- `docs/openapi/mock.json`: your OpenAPI spec (swap in your own)
- `docs/api/mock/index.md`: landing page that renders the whole spec
- `docs/index.md`: your home page
