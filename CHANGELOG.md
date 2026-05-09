# Changelog

All notable changes to `vitepress-openapi-docs` and `create-vitepress-openapi-docs`.

## 1.7.0

### Changed

- SDK snippet tabs now render from structured tokens emitted by `vue-api-playground` 2.5.0 instead of post-tokenising the snippet string. Token classes cover request method, flags, URLs, headers, identifiers, and punctuation. The regex-based JS / Python / shell highlighters were removed.
- `vue-api-playground` peer dependency bumped to `^2.5.0`.
- Stacked layout now mirrors the columns aside structure: Authentication and Code examples are wrapped in `<details>` collapsed by default, Parameters collapse by default, and the Try-It Playground stays open with a `Try it` section header.
- Section headers in the main card unified: `Parameters` and `Response examples` share the same accent-bar treatment.
- Columns aside `Code` summary renamed to `Code examples` for parity with the stacked layout.
- Parameters table and Try-It field grid both collapse to 3 visible rows (was 5 and 4 respectively).
- Parameters table inside the stacked-layout `<details>` renders every row. The `Show all N parameters` toggle now only appears in the columns layout, where the table sits open above the fold.
- Parameters and schema tables horizontally scroll on narrow viewports. The mobile-only rule that hid parameter descriptions has been removed.

### Removed

- `collapse` prop on `<OpenApiEndpoint>` and the matching `defaults.collapse` option. Stacked-layout collapse defaults are now built in.

## 1.6.0

### Added

- Built-in syntax highlighting for response examples and code snippets. Tokenizers for JSON, JavaScript, Python, and shell ship in the bundle and follow the active VitePress theme. No Prism or Shiki dependency.
- Response examples use an accordion layout so long payloads do not push the Try-It panel off screen.
- Try-It panel reworked: compact stacked layout, `Send request` button (renamed from `Execute`), collapsible parameter grid with a `Show all` cap.
- Changelog delta text renders inline markdown (code spans, links, emphasis).
- Method and status tokens cascade through the host VitePress theme, so `--vp-c-*` overrides reflow into chips and status pills. Hex fallbacks keep non-VitePress hosts rendering.

### Changed

- `vue-api-playground` peer dependency bumped to `^2.4.0`.
- Parser contract narrowed; endpoint URLs unified under a single `config/routes` helper.
- Endpoint header typography and section rhythm reworked for a tighter vertical layout.
- Node.js snippet dropped from code samples (`fetch` covers the same surface).
- `npm run dev` runs the core watch build in parallel with the docs dev server.

### Fixed

- Token palette and link colors meet WCAG AA contrast in light and dark themes.
- Webhook method chip routes through the neutral token path instead of the HTTP method map.
- Parameters table and section toggles tightened up.

### Documentation

- New `/reference/playground` demo page and color swatches in the CSS variables reference.
- Landing page, README, `/guide/existing-site`, `/reference/components`, and `/reference/cli` refreshed for the current surface.
- Embedded mock spec bumped to v2.0.1 from api.rodin.dev.

## 1.5.1

### Added

- Scaffolder picks a demo endpoint from remote JSON OpenAPI specs, not just local files. `npm create vitepress-openapi-docs` pointed at a hosted spec URL now produces a working Try-It block on the landing page out of the box.

### Changed

- Scaffolder skips deprecated GET operations when picking the demo endpoint, so the generated landing page never opens to a deprecated API.
- Scaffolder sends `Accept: application/json` when fetching remote specs, improving compatibility with CDNs and proxies that content-negotiate.
- Scaffolded landing page replaces the "Quick start" block with a "What's next" block that links directly to the generated API Reference.

### Fixed

- Scaffolder warns on stderr when a spec URL fails to fetch, returns a non-2xx status, or produces unparseable JSON. Previously these failures were silent and the generated landing page quietly omitted the demo block with no explanation.

### Security

- Force Vite 6.4.2 into VitePress's transitive tree via an `overrides` entry in the monorepo `package.json`. Patches two dev-server-only CVEs that affected `vitepress dev` via Vite 5's bundled esbuild (GHSA-4w7w-66w2-5vf9 path traversal in optimized deps `.map` handling; GHSA-67mh-4wv8-2f99 esbuild cross-site dev-server request). Production builds (`vitepress build`) were not affected.

## 1.5.0

### Added

- New `layout` option for `<OpenApiEndpoint>` and plugin `defaults` — `'columns'` (new default) splits the endpoint into a documentation card plus a sticky Try-It aside; `'stacked'` keeps the previous single-column behaviour. Narrow viewports (≤ 1279px) automatically fall back to `stacked` regardless of the setting.
- `<OpenApiSpec>` accepts and forwards `layout` to every rendered endpoint, plus a `show-header` prop.
- Generated endpoint pages now emit `aside: false` in frontmatter so the Try-It aside has room next to the card. Hand-written overview pages should do the same.
- Parameters table on endpoint cards shows type, `in`, required badge, and description column (hidden on mobile), with a "Show all N parameters" toggle after 5 rows.

### Changed

- Scaffolded `docs/api/<spec>/index.md` now includes `aside: false` frontmatter.
- `vue-api-playground` peer dependency bumped to `^2.3.1`.
- `client styles` size-limit budget raised from `3.5 kB` to `3.75 kB` (brotli) to fit the new layout primitives.

## 1.4.0

### Added

- Scaffolder prompts whether to initialize a git repository in interactive mode, instead of always creating one. Non-interactive mode and `--no-git` behavior unchanged.
- Scaffolder validates remote spec URLs at scaffold time with a HEAD request, warning when the URL is unreachable or returns an error status.

## 1.3.0

### Added

- Scaffolder auto-installs dependencies after scaffolding. Use `--skip-install` to opt out.
- Scaffolder initializes a git repository with an initial commit. Use `--no-git` to skip.
- `--server` CLI flag sets the API server base URL in the generated config, overriding servers defined in the spec.
- Node.js 18+ version check at startup with a clear error message for older runtimes.

### Changed

- Interactive prompts migrated from raw readline to `@clack/prompts` — styled spinners, select menus, and confirm dialogs replace plain text input.

## 1.2.0

### Added

- Scaffolder supports multiple API specs in a single project. Interactive prompts let you add as many specs as needed, each with its own name, route prefix, and overview page.
- `--title` and `--body-inputs` CLI flags for the scaffolder, plus an interactive site-title prompt.
- Scaffolder auto-detects a suitable GET endpoint from local JSON specs and renders a live "Try it" block on the landing page.
- `deriveSpecName` and `pickDemoEndpoint` exported from `create-vitepress-openapi-docs` for programmatic use.

### Fixed

- Operation summaries no longer display a trailing period in the sidebar and page headings.
- Search trigger button in the navbar now has proper spacing from adjacent elements.

## 1.1.0

### Added

- Operation jumper shows the spec name alongside tags when multiple APIs are registered, making it easier to identify which API an operation belongs to in multi-spec setups.
- Scaffolder warns at creation time when `--spec` points to a local file that does not exist, instead of silently writing a broken config.

## 1.0.1

### Fixed

- Existing-site guide now includes a step for creating the API landing page, preventing 404 on `/<prefix>/`.
- Generated operation pages include a visible `# heading`, fixing empty `<h1>` and blank browser tab titles when the spec lacks `summary` fields.
- Sidebar displays humanized operation names (`Get user by id`) instead of raw operationIds (`getUserById`) when no summary is available.
- HTML attribute values in generated pages are now escaped, preventing template breakage from unusual `operationId` characters.
- Heading text in generated pages is escaped to prevent Vue component injection from `<CamelCase>` in summaries.

### Changed

- CSS variable reference now documents all 16 method badge variables (`--vod-method-*-bg`, `--vod-method-*-text`) with light and dark mode defaults.
- Theming guide distinguishes accent variables (borders, tab indicators) from badge variables (pill-shaped method labels) with examples for both.
- Method swatches table corrected: `--vod-method-get` described as "Borders, tab indicators, sidebar accents" instead of "method badge".

## 1.0.0

### Added

- OAuth2 passthrough: `AuthControls` renders authorization URL, token URL, scopes list, and a token paste input for `oauth2` security schemes. Pasted tokens inject as `Bearer` in snippets and Try-It.
- Structured `ParsedSecurityScheme` type — parser now extracts typed security scheme info (bearer, basic, apikey, oauth2) including apiKey header name and OAuth2 flow details.
- `verbose` option on `openApiDocs()` — logs spec discovery, operation/schema/security-scheme counts, changelog status, page generation, and broken-embed scan.
- `extractChangelog`, `SpecChangelog`, `ChangelogEntry`, and `OpenApiDocsPluginOptions` exported from `vitepress-openapi-docs/vitepress`.
- `request-start`, `request-success`, `request-error` events forwarded from `<Playground>` through `<OpenApiEndpoint>` for analytics/error handling hooks.
- `OperationJumper` focus trap: Tab/Shift+Tab cycle inside the dialog; focus returns to the trigger element on close.
- Happy-path e2e Playwright test: full interaction chain (jumper → operation → try-it), schema/changelog page render, auth persistence.
- `scripts/sync-versions.js` — lockstep version sync across `packages/core`, `packages/create`, and the scaffolder template.
- `.npmignore` files for both packages.
- `prepack` scripts on both packages to guarantee fresh `dist/` before publish.
- Publish workflow now runs the full CI gauntlet (typecheck, lint, format, test, build, size) before npm publish.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, issue/PR templates.
- Cookie-based API key auth shows a visible warning in `AuthControls` explaining that browsers cannot inject `Cookie` headers from JavaScript.
- Multi-API prefix validation: `openApiDocs()` throws at build time when two or more specs are configured without a `prefix`, preventing silent URL collisions.
- Parser tests for empty specs (zero operations) and webhook-only specs (no paths).
- `EnhanceAppOptions` type exported for typed theme setup.

### Changed

- **Breaking:** `enhanceAppWithOpenApi(app, specs, changelogs, defaults)` is now `enhanceAppWithOpenApi({ app, specs, changelogs?, defaults? })`. An options object replaces positional args for clarity and extensibility.
- `securitySchemes` on `ParsedSpec` is now `Record<string, ParsedSecurityScheme>` (was `Record<string, unknown>`).
- `OpenApiEndpoint` auto-resolves apiKey header name from the spec's security scheme definition.
- All spec-loading errors are now prefixed `[vitepress-openapi-docs]` with spec name and path.
- Dogfood site uses a local spec snapshot (`docs/openapi/mock.json`) instead of fetching at build time.
- Removed VitePress built-in search in favor of the `OperationJumper` (Cmd+K).
- README rewritten as a shippable landing page with install/config snippets.
- POST method badge color changed from green to blue to distinguish from GET.

### Fixed

- `oauth2` in the `auth` prop was silently mapped to `'none'` — now fully supported.
- POST and GET method badges shared identical green colors (copy-paste error in DESIGN.md and SCSS). POST is now blue (`#dbeafe`/`#1e40af` light, `#172554`/`#93c5fd` dark).

## 0.7.0

### Added

- `scanForBrokenEmbeds` is now wired into `openApiDocs`. Hand-written markdown pages that reference an unknown operation id fail the build by default (`onBrokenEmbed: 'error'`); use `'warn'` during iteration or `'ignore'` to disable.
- `OpenApiDocsPluginOptions` is exported for typed plugin configuration.
- `LICENSE` (MIT) shipped at the repo root.

### Changed

- Publish workflow now builds and publishes both `vitepress-openapi-docs` and `create-vitepress-openapi-docs` from the monorepo on `v*` tag push, with npm provenance.

## 0.6.0

### Added

- `<OpenApiChangelog name="...">` — git-history-driven spec changelog. Diffs each commit pair: added / removed / renamed operations (matched by method + path) plus `info.title`, `info.version`, `info.description` changes. Empty state renders when a spec has fewer than two commits.
- Per-spec changelog pages auto-generated at `/changelog/{specName}`, with a `Changelog` group in the sidebar.
- `extractChangelog` and `scanForBrokenEmbeds` exported from `vitepress-openapi-docs/vitepress` for advanced pipelines.
- `<OperationJumper>` — global Cmd+K / Ctrl+K fuzzy-search dialog across every registered spec. Keyboard navigation (↑↓/Enter/Esc), auto-mounted via VitePress's `layout-top` slot.
- `fuzzyScore` / `rankByFuzzy` exported for custom UIs.
- CI / deploy workflows now use `fetch-depth: 0` so the changelog extractor has real history.

## 0.5.0

### Added

- `<OpenApiSchema spec-name="..." name="...">` — property table with required badges and clickable `$ref` links to other schema pages.
- Parser now captures `componentSchemas` (post-dereference) and `requestSchemaRefs` / `responseSchemaRefs` (pre-dereference) so endpoint pages can render `Returns <User>` / `Accepts <User>` cross-links.
- Per-spec schema pages auto-generated at `/schemas/{specName}/{typeName}`, with a `Schemas` group in the sidebar.
- `guide/theming.md` documenting the `--vod-*` → `--vap-*` → `--vp-c-*` cascade.
- `.github/workflows/deploy-docs.yml` publishing the dogfood site to GitHub Pages on push to `main`.

## 0.4.0

### Added

- `<AuthControls>` + `useAuthState(specName)` — sessionStorage-backed credential store keyed `vod:auth:{specName}`. Input / "Clear credentials" button, SSR-safe, scheme-aware (`bearer`, `basic`, `apikey`).
- Credentials auto-inject into both SDK snippets (visible) and the try-it panel (via vue-api-playground's `before-send` hook) — no prop round-tripping.
- CSS-variable surface: `--vod-method-{get,post,put,patch,delete,head,options,trace}`, `--vod-font-{ui,mono}`, `--vod-surface`, `--vod-radius`, `--vod-focus-ring`. Cascade rides `--vap-*` when vue-api-playground is installed.

### Changed

- Scaffolder (`create-vitepress-openapi-docs`) writes atomically via a sibling staging dir then `rename`. SIGINT/SIGTERM trigger cleanup. Interactive prompts for existing-dir confirmation and spec source path; `--no-interactive` / `-y` for CI.
- Scaffolder CLI: `--pm {npm|pnpm|yarn|bun}`, `--spec <path|url>`, `--force`, `--skip-install`.

## 0.3.0

### Added

- `<SdkSnippets>` — tabbed code panel rendering curl + JavaScript fetch + Python (`requests`) + Node (`undici`) snippets for each operation. ARIA-compliant tab list.
- `buildSnippets()` — OpenAPI-aware wrapper that composes vue-api-playground's raw generators with auth injection and `Content-Type` inference.
- Real-spec matrix under `test/fixtures/specs/`: Petstore (full) plus curated subsets of GitHub, Twilio, OpenAI (3.1 with nullable-type arrays + deep oneOf), Stripe. Each spec is parsed and snippet-rendered for every operation on CI.

## 0.2.0

### Added

- Multi-API support. `specs: []` accepts any number of OpenAPI documents; the sidebar wraps each in a top-level group when more than one is registered.
- Per-spec URL prefixes (`prefix: '/api/...'`) applied to generated pages, rewrites, and sidebar links.

## 0.1.0

### Added

- `openApiDocs(config)` — VitePress plugin entry. Parses specs via `@scalar/openapi-parser`, generates one markdown page per operation under `<srcDir>/_openapi/`, emits `rewrites` so each generated page serves at its public URL, registers a Vite virtual module (`virtual:vitepress-openapi-docs/specs`) with the parsed data.
- `<OpenApiEndpoint id="...">` — the composability primitive. Renders summary, description, parameters, SDK snippets, and an interactive try-it panel for one operation.
- `<OpenApiSpec name="...">` — renders every operation in a spec, grouped by tag.
- `enhanceAppWithOpenApi({ app, specs })` — theme helper that wires the registry and registers the global components.
- `create-vitepress-openapi-docs` scaffolder — `npm create vitepress-openapi-docs@latest my-api-docs` drops a working VitePress site with Petstore spec bundled.
