---
description: Every CSS variable in vitepress-openapi-docs with defaults and where each is used.
---

# CSS Variables

These variables control the visual appearance of `vitepress-openapi-docs` components. Override them in a stylesheet loaded after the plugin styles. See [Theming](/guide/theming) for the cascade model and usage examples.

## Method swatches

| Variable                          | Default                                              | Used by                                  |
| --------------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| `--vod-method-get`                | `--vap-method-get` → `--vp-c-brand-1` → `#3eaf7c`    | Borders, tab indicators, sidebar accents |
| `--vod-method-post`               | `--vap-method-post` → `--vp-c-green-1` → `#16a34a`   | same                                     |
| `--vod-method-put`                | `--vap-method-put` → `--vp-c-yellow-1` → `#d97706`   | same                                     |
| `--vod-method-patch`              | `--vap-method-patch` → `--vp-c-purple-1` → `#8b5cf6` | same                                     |
| `--vod-method-delete`             | `--vap-method-delete` → `--vp-c-red-1` → `#dc2626`   | same, plus the deprecated badge          |
| `--vod-method-head/options/trace` | `--vap-method-head` → `--vp-c-text-2` → `#6b7280`    | same                                     |

## Method badge colours

These control the **pill-shaped badges** next to each endpoint (e.g. <span style="background:#dcfce7;color:#166534;padding:0 6px;border-radius:4px;font-size:0.75rem;font-weight:700">GET</span>). Override these to restyle the badges themselves. Both light and dark mode values are listed.

| Variable                    | Light default | Dark default | Used by          |
| --------------------------- | ------------- | ------------ | ---------------- |
| `--vod-method-get-bg`       | `#dcfce7`     | `#052e16`    | Badge background |
| `--vod-method-get-text`     | `#166534`     | `#86efac`    | Badge text       |
| `--vod-method-post-bg`      | `#dbeafe`     | `#172554`    | Badge background |
| `--vod-method-post-text`    | `#1e40af`     | `#93c5fd`    | Badge text       |
| `--vod-method-put-bg`       | `#fef3c7`     | `#451a03`    | Badge background |
| `--vod-method-put-text`     | `#92400e`     | `#fcd34d`    | Badge text       |
| `--vod-method-patch-bg`     | `#ede9fe`     | `#2e1065`    | Badge background |
| `--vod-method-patch-text`   | `#5b21b6`     | `#c4b5fd`    | Badge text       |
| `--vod-method-delete-bg`    | `#fee2e2`     | `#450a0a`    | Badge background |
| `--vod-method-delete-text`  | `#991b1b`     | `#fca5a5`    | Badge text       |
| `--vod-method-head-bg`      | `#f3f4f6`     | `#1f2937`    | Badge background |
| `--vod-method-head-text`    | `#374151`     | `#d1d5db`    | Badge text       |
| `--vod-method-options-bg`   | `#f3f4f6`     | `#1f2937`    | Badge background |
| `--vod-method-options-text` | `#374151`     | `#d1d5db`    | Badge text       |
| `--vod-method-trace-bg`     | `#f3f4f6`     | `#1f2937`    | Badge background |
| `--vod-method-trace-text`   | `#374151`     | `#d1d5db`    | Badge text       |

::: tip Accent vs badge
`--vod-method-get` (no `-bg`/`-text` suffix) is the **accent** colour — used for borders, tab indicators, and text highlights. `--vod-method-get-bg` / `--vod-method-get-text` control the **badge pill**. Override both if you want a fully custom palette.
:::

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
