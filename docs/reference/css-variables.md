---
description: Every CSS variable in vitepress-openapi-docs with defaults and where each is used.
---

# CSS Variables

These variables control the visual appearance of `vitepress-openapi-docs` components. Override them in a stylesheet loaded after the plugin styles. See [Theming](/guide/theming) for the cascade model and usage examples.

Every `--vod-*` token chains through `--vap-*` (vue-api-playground) and then `--vp-c-*` (VitePress) before falling back to a hardcoded value, so a host theme can re-tint the plugin at any layer.

## Method accents

Used for method-coloured borders, tab indicators, and sidebar accents. The badge fill is controlled separately - see [Method badges](#method-badges).

| Variable                          | Default                                 | Used by                                  |
| --------------------------------- | --------------------------------------- | ---------------------------------------- |
| `--vod-method-get`                | `--vap-method-get` → indigo `#1e40af`   | Borders, tab indicators, sidebar accents |
| `--vod-method-post`               | `--vap-method-post` → yellow `#d97706`  | same                                     |
| `--vod-method-put`                | `--vap-method-put` → yellow `#d97706`   | same                                     |
| `--vod-method-patch`              | `--vap-method-patch` → yellow `#d97706` | same                                     |
| `--vod-method-delete`             | `--vap-method-delete` → red `#dc2626`   | same, plus the deprecated badge          |
| `--vod-method-head/options/trace` | `--vap-method-*` → indigo `#1e40af`     | same                                     |

## Method badges

The pill-shaped method labels next to each endpoint header. Both the light- and dark-mode values are listed.

| Variable                    | Light default | Dark default |
| --------------------------- | ------------- | ------------ |
| `--vod-method-get-bg`       | `#dbeafe`     | `#172554`    |
| `--vod-method-get-text`     | `#1e40af`     | `#a8b1ff`    |
| `--vod-method-post-bg`      | `#fef3c7`     | `#451a03`    |
| `--vod-method-post-text`    | `#92400e`     | `#fbbf24`    |
| `--vod-method-put-bg`       | `#fef3c7`     | `#451a03`    |
| `--vod-method-put-text`     | `#92400e`     | `#fbbf24`    |
| `--vod-method-patch-bg`     | `#fef3c7`     | `#451a03`    |
| `--vod-method-patch-text`   | `#92400e`     | `#fbbf24`    |
| `--vod-method-delete-bg`    | `#fee2e2`     | `#450a0a`    |
| `--vod-method-delete-text`  | `#991b1b`     | `#fca5a5`    |
| `--vod-method-head-bg`      | `#dbeafe`     | `#172554`    |
| `--vod-method-head-text`    | `#1e40af`     | `#a8b1ff`    |
| `--vod-method-options-bg`   | `#dbeafe`     | `#172554`    |
| `--vod-method-options-text` | `#1e40af`     | `#a8b1ff`    |
| `--vod-method-trace-bg`     | `#dbeafe`     | `#172554`    |
| `--vod-method-trace-text`   | `#1e40af`     | `#a8b1ff`    |

::: tip Accent vs badge
`--vod-method-get` (no `-bg`/`-text` suffix) is the accent colour used for borders, tab indicators, and text highlights. `--vod-method-get-bg` / `--vod-method-get-text` control the badge pill. Override both if you want a fully custom palette.
:::

## Response status colours

Drive the response accordion rows and the Try-It response bar. The `-soft` variants are used for row backgrounds.

| Variable                | Light default | Dark default |
| ----------------------- | ------------- | ------------ |
| `--vod-status-2xx`      | `#0f5132`     | `#86efac`    |
| `--vod-status-2xx-soft` | `#d6ede6`     | `#14402c`    |
| `--vod-status-4xx`      | `#92400e`     | `#fbbf24`    |
| `--vod-status-4xx-soft` | `#fef3c7`     | `#451a03`    |
| `--vod-status-5xx`      | `#991b1b`     | `#fca5a5`    |
| `--vod-status-5xx-soft` | `#fee2e2`     | `#450a0a`    |

## Chip primitive

Neutral pill used for `webhook`, schema badges, and other non-method tags.

| Variable                  | Light default | Dark default |
| ------------------------- | ------------- | ------------ |
| `--vod-pill-neutral-bg`   | `#f3f4f6`     | `#1f2937`    |
| `--vod-pill-neutral-text` | `#374151`     | `#d1d5db`    |

## Syntax highlighting

Applied to cURL, JavaScript, Python snippets and JSON response examples. Each falls through `--vap-syntax-*` before landing on the built-in defaults.

| Variable                | Light default | Dark default |
| ----------------------- | ------------- | ------------ |
| `--vod-syntax-string`   | `#a31515`     | `#ce9178`    |
| `--vod-syntax-number`   | `#098658`     | `#b5cea8`    |
| `--vod-syntax-keyword`  | `#af00db`     | `#c586c0`    |
| `--vod-syntax-comment`  | `#6a737d`     | `#6a9955`    |
| `--vod-syntax-function` | `#795e26`     | `#dcdcaa`    |

## Typography

| Variable          | Default                                                      |
| ----------------- | ------------------------------------------------------------ |
| `--vod-font-ui`   | `--vap-font-ui` → `--vp-font-family-base` → `system-ui`      |
| `--vod-font-mono` | `--vap-font-mono` → `--vp-font-family-mono` → `ui-monospace` |

## Surfaces

| Variable               | Light default                                         | Dark default                                          | Where it applies                      |
| ---------------------- | ----------------------------------------------------- | ----------------------------------------------------- | ------------------------------------- |
| `--vod-surface`        | `--vap-surface` → `--vp-c-bg-soft` → `#f6f6f7`        | `--vap-surface` → `--vp-c-bg-alt` → `#1b1b1f`         | Endpoint card background              |
| `--vod-surface-border` | `--vap-surface-border` → `--vp-c-divider` → `#e2e2e3` | `--vap-surface-border` → `--vp-c-divider` → `#2e2e32` | Card and panel borders                |
| `--vod-text-1`         | `#213547`                                             | `#dfdfd6`                                             | Primary text                          |
| `--vod-text-2`         | `#475569`                                             | `#c8c8cc`                                             | Meta text, muted labels               |
| `--vod-link`           | `#1d4ed8`                                             | `#93c5fd`                                             | In-prose links inside plugin surfaces |
| `--vod-radius`         | `--vap-radius` → `8px`                                | same                                                  | Card and button corners               |
| `--vod-focus-ring`     | `--vap-focus-ring` → `--vp-c-brand-1`                 | same                                                  | Input focus outline                   |
