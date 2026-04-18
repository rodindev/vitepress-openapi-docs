---
description: Common issues and solutions when using vitepress-openapi-docs.
---

# Troubleshooting

## Broken embed errors

```
vitepress-openapi-docs: 1 broken <OpenApiEndpoint> embed(s):
  - guide.md:12 — id="api.nonexistent"
```

**Cause:** A markdown page references an `operationId` that doesn't exist in any registered spec.

**Fix:**

- Check the `id` matches `{specName}.{operationId}` exactly
- Verify the operation exists in your spec file
- If the operation was renamed or removed, update the markdown

**Suppress in dev:** Set `onBrokenEmbed: 'ignore'` in [plugin options](/reference/configuration#openapidocspluginoptions).

## Empty sidebar

The sidebar shows no operations.

**Debug:** Enable verbose logging:

```ts
extends: await openApiDocs(config, { verbose: true })
```

Check the console output for operation counts. Common causes:

- Spec path is wrong — check the `spec` field in your config
- Spec has no `paths` — verify your YAML/JSON has operations defined
- The spec fails to parse — look for `[vitepress-openapi-docs]` error messages

## Empty changelog

`<OpenApiChangelog>` shows "No changes recorded yet."

**Cause:** The spec file has fewer than two commits in git history.

**Fix:**

- Make at least two commits that modify the spec file
- In CI, use `fetch-depth: 0` (shallow clones have no history)
- The spec must be a local file (not a URL) for changelog to work

## Virtual module type errors

```
Cannot find module 'virtual:vitepress-openapi-docs/specs'
```

**Fix:** Add the virtual module types to your TypeScript config:

```json
{
  "compilerOptions": {
    "types": ["vitepress-openapi-docs/virtual"]
  }
}
```

Or use a triple-slash directive in your theme file:

```ts
/// <reference types="vitepress-openapi-docs/virtual" />
```

See [existing site setup](/guide/existing-site#5-typescript-optional) for details.

## CORS errors in Try-It

The Try-It panel sends requests from the browser. If your API doesn't include CORS headers, requests will fail.

**Fix on the API side:**

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

**Workaround for dev:** Use a CORS proxy or test against a local API server.

## Missing schemas

`<OpenApiSchema>` shows nothing or says the schema wasn't found.

**Check:**

- The schema must be defined under `components.schemas` in your spec
- The `name` prop must match the schema name exactly (case-sensitive)
- The `spec-name` prop must match the spec name from your config

## Spec loading failures

```
[vitepress-openapi-docs] Could not load spec "api": file not found at /path/to/spec.yaml
```

**Fix:** The `spec` path is relative to the project root (where `package.json` is), not the docs directory.

```ts
// Correct — relative to project root
{
  spec: 'docs/openapi/api.yaml'
}

// Wrong — this looks for docs/docs/openapi/api.yaml
{
  spec: 'openapi/api.yaml'
}
```

For remote specs:

```
[vitepress-openapi-docs] Timed out fetching spec "api" from https://...
```

The default timeout is 30 seconds. Check that the URL is reachable and responds within that window.

## Slow builds with large specs

Parsing and page generation for large specs (e.g. 200k+ lines) can take 5-30 seconds. Enable `verbose` to see progress. For faster iteration during development, consider using a curated subset of your spec.

## Operations missing parameters

The Try-It panel shows no input fields for path or query parameters.

**Cause:** Your spec defines parameters via `$ref` to `#/components/parameters/*`, but the referenced parameter doesn't exist in `components.parameters`.

**Debug:** Check that the `$ref` target exists:

```yaml
components:
  parameters:
    PathId:
      name: id
      in: path
      required: true
      schema:
        type: integer
```

Inline parameters (not via `$ref`) always work.

## Body textarea is empty

POST/PUT/PATCH endpoints show an empty body textarea.

**Cause:** The request body schema uses a `$ref` that wasn't resolved. The plugin resolves `#/components/schemas/*` refs, but deeply nested or circular chains may not resolve fully.

**Debug:** Check that `requestBody.content.application/json.schema` resolves to an object with `properties`.

## Cmd+K jumper not appearing

**Check:**

- `OperationJumper` must be mounted in the `layout-top` slot — see [theme setup](/guide/existing-site#3-theme-setup)
- The specs virtual module must be imported and passed to `enhanceAppWithOpenApi`
- Add `SearchTrigger` to `nav-bar-content-after` for a visible trigger button
