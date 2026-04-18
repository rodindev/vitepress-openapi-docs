---
description: Create a working API docs site in under two minutes.
---

# Quick Start

## New project

The scaffolder creates a VitePress site with the plugin configured and an example spec:

```bash
npm create vitepress-openapi-docs@latest my-api-docs
cd my-api-docs
npm install
npm run dev
```

Open `http://localhost:5173`. You'll see a working docs site with an interactive API reference, sidebar navigation, and Cmd+K search.

### What just happened

1. The scaffolder dropped an OpenAPI spec into `docs/openapi/`
2. The plugin parsed it and generated one page per operation, schema, and changelog entry under `docs/_openapi/`
3. VitePress serves those pages with a sidebar grouped by tag

### Next: add your spec

Replace the bundled spec with your own OpenAPI 3.0 or 3.1 file (YAML or JSON), update the `spec` path in `docs/.vitepress/config.ts`, and restart the dev server.

See [CLI flags](/reference/cli) for scaffolder options, or [add to an existing site](/guide/existing-site) if you already have a VitePress project.
