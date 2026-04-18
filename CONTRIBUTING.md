# Contributing

## Repo layout

```
packages/
  core/       # vitepress-openapi-docs — Vue components + VitePress plugin
  create/     # create-vitepress-openapi-docs — scaffolder CLI
docs/         # VitePress dogfood site
e2e/          # Playwright tests (a11y + happy-path)
scripts/      # Release helpers
```

## Setup

```bash
git clone https://github.com/rodindev/vitepress-openapi-docs.git
cd vitepress-openapi-docs
npm install
npm run dev         # start the dogfood docs site
```

## Scripts

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | VitePress dev server (dogfood site)     |
| `npm run build`        | Build both packages (ESM + CJS + types) |
| `npm run docs:build`   | Build VitePress docs                    |
| `npm run typecheck`    | `vue-tsc --noEmit` across workspaces    |
| `npm run lint`         | ESLint with auto-fix                    |
| `npm run lint:check`   | ESLint check only (CI)                  |
| `npm run format`       | Prettier write                          |
| `npm run format:check` | Prettier check (CI)                     |
| `npm run test`         | Vitest watch mode                       |
| `npm run test:run`     | Vitest single run (CI)                  |
| `npm run test:a11y`    | Playwright axe-core a11y tests          |
| `npm run size`         | size-limit check on core package        |

## Before submitting a PR

```bash
npm run typecheck
npm run lint:check
npm run format:check
npm run test:run
npm run build
npm run size
```

All must pass. CI runs these on every push/PR.

## Adding a fixture spec

Test specs live in `packages/core/src/parser/parser.spec.ts` as inline objects or YAML strings. For larger fixtures, add a `.yaml` file to `packages/core/src/test/fixtures/specs/` and import it.

## Running the a11y suite locally

```bash
npm run docs:build
npx playwright install chromium
npm run test:a11y
```

## Commit conventions

- **Conventional commits** — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`, `refactor:`, `perf:`
- Keep commits focused: one concern per commit
- No `Co-Authored-By` trailers

## Release flow

1. `node scripts/sync-versions.js <version>` — sync all packages
2. Update `CHANGELOG.md` — move `Unreleased` to `## <version>` with date
3. Commit: `chore(release): v<version>`
4. Tag: `git tag v<version>`
5. Push: `git push origin main --tags`
6. CI publishes both packages with provenance

## Code style

- TypeScript strict — no `any`
- Single quotes, no semicolons (Prettier)
- Vue SFC order: `<template>`, `<script setup lang="ts">`
- CSS classes: BEM with `vod-` prefix
- CSS variables: `--vod-*` for user overrides
