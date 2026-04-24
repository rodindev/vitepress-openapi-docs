---
description: Customize the look of vitepress-openapi-docs with CSS variables.
---

# Theming

`vitepress-openapi-docs` themes through a three-layer CSS variable cascade. Override at any level — lower layers stay as fallbacks.

## The cascade

```
--vod-*     →  --vap-*     →  --vp-c-*     →  hex fallback
(vod)          (vue-api-       (VitePress      (works in any
                playground)     theme)          host)
```

Each layer falls back to the next. Override whichever layer you want; everything below stays as a default.

- **`--vod-*`** — the public surface. Override these to restyle the plugin's UI.
- **`--vap-*`** — shipped by `vue-api-playground`. Inherited so both packages stay in sync.
- **`--vp-c-*`** — VitePress's standard tokens. Most sites already theme through these.
- The hex fallback is only reached outside a VitePress host.

## Common overrides

Drop these into a stylesheet imported after the plugin styles in your [theme setup](/guide/existing-site#3-theme-setup):

```css
:root {
  /* Method accents — borders, tab indicators, text highlights */
  --vod-method-get: #2563eb;
  --vod-method-post: #16a34a;
  --vod-method-put: #d97706;
  --vod-method-patch: #8b5cf6;
  --vod-method-delete: #dc2626;

  /* Method badges — the pill-shaped labels (e.g. GET, POST) */
  --vod-method-get-bg: #dcfce7;
  --vod-method-get-text: #166534;
  --vod-method-post-bg: #dbeafe;
  --vod-method-post-text: #1e40af;

  /* Typography */
  --vod-font-ui: 'Inter', sans-serif;
  --vod-font-mono: 'JetBrains Mono', monospace;

  /* Surfaces */
  --vod-surface: #fafafa;
  --vod-surface-border: #e2e2e3;
  --vod-radius: 12px;
  --vod-focus-ring: #2563eb;
}

.dark {
  --vod-surface: #1c1c1f;
  --vod-surface-border: #2e2e32;
  --vod-method-get-bg: #052e16;
  --vod-method-get-text: #86efac;
}
```

::: tip Accent vs badge
`--vod-method-get` controls borders and tab indicators. `--vod-method-get-bg` / `--vod-method-get-text` control the badge pill. See the [full variable reference](/reference/css-variables#method-badges) for every method.
:::

## Dark mode

The plugin follows VitePress's `html.dark` switch automatically. Both `--vap-*` and `--vod-*` ship `.dark` overrides for surface tokens. Override a method colour for dark mode separately:

```css
.dark {
  --vod-method-get: #60a5fa;
}
```

## Full variable reference

See [CSS Variables reference](/reference/css-variables) for every available variable, its default, and where it applies.
