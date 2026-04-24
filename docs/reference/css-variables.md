---
description: Every CSS variable in vitepress-openapi-docs with defaults and where each is used.
---

# CSS Variables

These variables control the visual appearance of `vitepress-openapi-docs` components. Override them in a stylesheet loaded after the plugin styles. See [Theming](/guide/theming) for the cascade model and usage examples.

Every `--vod-*` token chains through `--vap-*` (vue-api-playground) and then `--vp-c-*` (VitePress) before falling back to a hardcoded value, so a host theme can re-tint the plugin at any layer.

## Method accents

Used for method-coloured borders, tab indicators, and sidebar accents. The badge fill is controlled separately - see [Method badges](#method-badges).

| Variable                          | Default                                                            | Used by                                  |
| --------------------------------- | ------------------------------------------------------------------ | ---------------------------------------- |
| `--vod-method-get`                | `--vap-method-get` → indigo <Swatch color="#1e40af" /> `#1e40af`   | Borders, tab indicators, sidebar accents |
| `--vod-method-post`               | `--vap-method-post` → yellow <Swatch color="#d97706" /> `#d97706`  | same                                     |
| `--vod-method-put`                | `--vap-method-put` → yellow <Swatch color="#d97706" /> `#d97706`   | same                                     |
| `--vod-method-patch`              | `--vap-method-patch` → yellow <Swatch color="#d97706" /> `#d97706` | same                                     |
| `--vod-method-delete`             | `--vap-method-delete` → red <Swatch color="#dc2626" /> `#dc2626`   | same, plus the deprecated badge          |
| `--vod-method-head/options/trace` | `--vap-method-*` → indigo <Swatch color="#1e40af" /> `#1e40af`     | same                                     |

## Method badges

The pill-shaped method labels next to each endpoint header. Both the light- and dark-mode values are listed.

| Variable                    | Light default                        | Dark default                         |
| --------------------------- | ------------------------------------ | ------------------------------------ |
| `--vod-method-get-bg`       | <Swatch color="#dbeafe" /> `#dbeafe` | <Swatch color="#172554" /> `#172554` |
| `--vod-method-get-text`     | <Swatch color="#1e40af" /> `#1e40af` | <Swatch color="#a8b1ff" /> `#a8b1ff` |
| `--vod-method-post-bg`      | <Swatch color="#fef3c7" /> `#fef3c7` | <Swatch color="#451a03" /> `#451a03` |
| `--vod-method-post-text`    | <Swatch color="#92400e" /> `#92400e` | <Swatch color="#fbbf24" /> `#fbbf24` |
| `--vod-method-put-bg`       | <Swatch color="#fef3c7" /> `#fef3c7` | <Swatch color="#451a03" /> `#451a03` |
| `--vod-method-put-text`     | <Swatch color="#92400e" /> `#92400e` | <Swatch color="#fbbf24" /> `#fbbf24` |
| `--vod-method-patch-bg`     | <Swatch color="#fef3c7" /> `#fef3c7` | <Swatch color="#451a03" /> `#451a03` |
| `--vod-method-patch-text`   | <Swatch color="#92400e" /> `#92400e` | <Swatch color="#fbbf24" /> `#fbbf24` |
| `--vod-method-delete-bg`    | <Swatch color="#fee2e2" /> `#fee2e2` | <Swatch color="#450a0a" /> `#450a0a` |
| `--vod-method-delete-text`  | <Swatch color="#991b1b" /> `#991b1b` | <Swatch color="#fca5a5" /> `#fca5a5` |
| `--vod-method-head-bg`      | <Swatch color="#dbeafe" /> `#dbeafe` | <Swatch color="#172554" /> `#172554` |
| `--vod-method-head-text`    | <Swatch color="#1e40af" /> `#1e40af` | <Swatch color="#a8b1ff" /> `#a8b1ff` |
| `--vod-method-options-bg`   | <Swatch color="#dbeafe" /> `#dbeafe` | <Swatch color="#172554" /> `#172554` |
| `--vod-method-options-text` | <Swatch color="#1e40af" /> `#1e40af` | <Swatch color="#a8b1ff" /> `#a8b1ff` |
| `--vod-method-trace-bg`     | <Swatch color="#dbeafe" /> `#dbeafe` | <Swatch color="#172554" /> `#172554` |
| `--vod-method-trace-text`   | <Swatch color="#1e40af" /> `#1e40af` | <Swatch color="#a8b1ff" /> `#a8b1ff` |

::: tip Accent vs badge
`--vod-method-get` (no `-bg`/`-text` suffix) is the accent colour used for borders, tab indicators, and text highlights. `--vod-method-get-bg` / `--vod-method-get-text` control the badge pill. Override both if you want a fully custom palette.
:::

## Response status colours

Drive the response accordion rows and the Try-It response bar. The `-soft` variants are used for row backgrounds.

| Variable                | Light default                        | Dark default                         |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `--vod-status-2xx`      | <Swatch color="#0f5132" /> `#0f5132` | <Swatch color="#86efac" /> `#86efac` |
| `--vod-status-2xx-soft` | <Swatch color="#d6ede6" /> `#d6ede6` | <Swatch color="#14402c" /> `#14402c` |
| `--vod-status-4xx`      | <Swatch color="#92400e" /> `#92400e` | <Swatch color="#fbbf24" /> `#fbbf24` |
| `--vod-status-4xx-soft` | <Swatch color="#fef3c7" /> `#fef3c7` | <Swatch color="#451a03" /> `#451a03` |
| `--vod-status-5xx`      | <Swatch color="#991b1b" /> `#991b1b` | <Swatch color="#fca5a5" /> `#fca5a5` |
| `--vod-status-5xx-soft` | <Swatch color="#fee2e2" /> `#fee2e2` | <Swatch color="#450a0a" /> `#450a0a` |

## Chip primitive

Neutral pill used for `webhook`, schema badges, and other non-method tags.

| Variable                  | Light default                        | Dark default                         |
| ------------------------- | ------------------------------------ | ------------------------------------ |
| `--vod-pill-neutral-bg`   | <Swatch color="#f3f4f6" /> `#f3f4f6` | <Swatch color="#1f2937" /> `#1f2937` |
| `--vod-pill-neutral-text` | <Swatch color="#374151" /> `#374151` | <Swatch color="#d1d5db" /> `#d1d5db` |

## Syntax highlighting

Applied to cURL, JavaScript, Python snippets and JSON response examples. Each falls through `--vap-syntax-*` before landing on the built-in defaults.

| Variable                | Light default                        | Dark default                         |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `--vod-syntax-string`   | <Swatch color="#a31515" /> `#a31515` | <Swatch color="#ce9178" /> `#ce9178` |
| `--vod-syntax-number`   | <Swatch color="#098658" /> `#098658` | <Swatch color="#b5cea8" /> `#b5cea8` |
| `--vod-syntax-keyword`  | <Swatch color="#af00db" /> `#af00db` | <Swatch color="#c586c0" /> `#c586c0` |
| `--vod-syntax-comment`  | <Swatch color="#6a737d" /> `#6a737d` | <Swatch color="#6a9955" /> `#6a9955` |
| `--vod-syntax-function` | <Swatch color="#795e26" /> `#795e26` | <Swatch color="#dcdcaa" /> `#dcdcaa` |

## Typography

| Variable          | Default                                                      |
| ----------------- | ------------------------------------------------------------ |
| `--vod-font-ui`   | `--vap-font-ui` → `--vp-font-family-base` → `system-ui`      |
| `--vod-font-mono` | `--vap-font-mono` → `--vp-font-family-mono` → `ui-monospace` |

## Surfaces

| Variable               | Light default                                                                    | Dark default                                                                     | Where it applies                      |
| ---------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------- |
| `--vod-surface`        | `--vap-surface` → `--vp-c-bg-soft` → <Swatch color="#f6f6f7" /> `#f6f6f7`        | `--vap-surface` → `--vp-c-bg-alt` → <Swatch color="#1b1b1f" /> `#1b1b1f`         | Endpoint card background              |
| `--vod-surface-border` | `--vap-surface-border` → `--vp-c-divider` → <Swatch color="#e2e2e3" /> `#e2e2e3` | `--vap-surface-border` → `--vp-c-divider` → <Swatch color="#2e2e32" /> `#2e2e32` | Card and panel borders                |
| `--vod-text-1`         | <Swatch color="#213547" /> `#213547`                                             | <Swatch color="#dfdfd6" /> `#dfdfd6`                                             | Primary text                          |
| `--vod-text-2`         | <Swatch color="#475569" /> `#475569`                                             | <Swatch color="#c8c8cc" /> `#c8c8cc`                                             | Meta text, muted labels               |
| `--vod-link`           | <Swatch color="#1d4ed8" /> `#1d4ed8`                                             | <Swatch color="#93c5fd" /> `#93c5fd`                                             | In-prose links inside plugin surfaces |
| `--vod-radius`         | `--vap-radius` → `8px`                                                           | same                                                                             | Card and button corners               |
| `--vod-focus-ring`     | `--vap-focus-ring` → `--vp-c-brand-1`                                            | same                                                                             | Input focus outline                   |
