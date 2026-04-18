---
description: Every CSS variable in vitepress-openapi-docs with defaults and where each is used.
---

# CSS Variables

These variables control the visual appearance of `vitepress-openapi-docs` components. Override them in a stylesheet loaded after the plugin styles. See [Theming](/guide/theming) for the cascade model and usage examples.

## Method swatches

| Variable                          | Default                                              | Used by                                           |
| --------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `--vod-method-get`                | `--vap-method-get` → `--vp-c-brand-1` → `#3eaf7c`    | `<OpenApiEndpoint>` method badge, sidebar accents |
| `--vod-method-post`               | `--vap-method-post` → `--vp-c-green-1` → `#16a34a`   | same                                              |
| `--vod-method-put`                | `--vap-method-put` → `--vp-c-yellow-1` → `#d97706`   | same                                              |
| `--vod-method-patch`              | `--vap-method-patch` → `--vp-c-purple-1` → `#8b5cf6` | same                                              |
| `--vod-method-delete`             | `--vap-method-delete` → `--vp-c-red-1` → `#dc2626`   | same, plus the deprecated badge                   |
| `--vod-method-head/options/trace` | `--vap-method-head` → `--vp-c-text-2` → `#6b7280`    | same                                              |

## Typography

| Variable          | Default                                                      |
| ----------------- | ------------------------------------------------------------ |
| `--vod-font-ui`   | `--vap-font-ui` → `--vp-font-family-base` → `system-ui`      |
| `--vod-font-mono` | `--vap-font-mono` → `--vp-font-family-mono` → `ui-monospace` |

## Surfaces

| Variable               | Default                                               | Where it applies         |
| ---------------------- | ----------------------------------------------------- | ------------------------ |
| `--vod-surface`        | `--vap-surface` → `--vp-c-bg-soft` → `#f6f6f7`        | Endpoint card background |
| `--vod-surface-border` | `--vap-surface-border` → `--vp-c-divider` → `#e2e2e3` | Card and panel borders   |
| `--vod-text-1`         | `--vap-text-1` → `--vp-c-text-1`                      | Primary text             |
| `--vod-text-2`         | `--vap-text-2` → `--vp-c-text-2`                      | Meta text                |
| `--vod-radius`         | `--vap-radius` → `8px`                                | Card and button corners  |
| `--vod-focus-ring`     | `--vap-focus-ring` → `--vp-c-brand-1`                 | Input focus outline      |
