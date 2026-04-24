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

| Flag                      | Description                                                                   |
| ------------------------- | ----------------------------------------------------------------------------- |
| `--spec <path>`           | Path or URL to your OpenAPI spec                                              |
| `--title <label>`         | Site title written into the generated VitePress config                        |
| `--server <url>`          | Override the API server base URL in the generated config                      |
| `--body-inputs`           | Render request body properties as individual inputs in the scaffolded landing |
| `--pm <manager>`          | Force a package manager (npm/pnpm/yarn/bun)                                   |
| `-y` / `--no-interactive` | Skip prompts, use defaults                                                    |
| `--skip-install`          | Skip post-scaffolding install step                                            |
| `--no-git`                | Do not initialise a git repository in the scaffolded project                  |
| `-f` / `--force`          | Overwrite existing directory                                                  |

### Examples

```bash
# Use your own spec
npm create vitepress-openapi-docs@latest my-docs -- --spec ./openapi.yaml

# Non-interactive with pnpm
npm create vitepress-openapi-docs@latest my-docs -- -y --pm pnpm

# Scaffold from a remote spec
npm create vitepress-openapi-docs@latest my-docs -- --spec https://api.example.com/openapi.json
```
