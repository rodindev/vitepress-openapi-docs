---
description: CLI flags for the vitepress-openapi-docs project scaffolder.
---

# CLI

## Scaffolder

```bash
npm create vitepress-openapi-docs@latest [project-name]
```

Creates a VitePress site with the plugin configured and an example OpenAPI spec. See [Quick Start](/guide/) for the full walkthrough.

### Flags

| Flag                      | Description                                 |
| ------------------------- | ------------------------------------------- |
| `--spec <path>`           | Path or URL to your OpenAPI spec            |
| `--pm <manager>`          | Force a package manager (npm/pnpm/yarn/bun) |
| `-y` / `--no-interactive` | Skip prompts, use defaults                  |
| `--skip-install`          | Skip post-scaffolding install step          |
| `-f` / `--force`          | Overwrite existing directory                |

### Examples

```bash
# Use your own spec
npm create vitepress-openapi-docs@latest my-docs -- --spec ./openapi.yaml

# Non-interactive with pnpm
npm create vitepress-openapi-docs@latest my-docs -- -y --pm pnpm

# Scaffold from a remote spec
npm create vitepress-openapi-docs@latest my-docs -- --spec https://api.example.com/openapi.json
```
