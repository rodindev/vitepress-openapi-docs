---
title: Playground
description: Visual stress test - every renderable state of the plugin on one page. Used during design iterations to spot regressions without clicking through the sidebar.
aside: false
editLink: false
---

# Playground

One page that exercises every rendering path `<OpenApiEndpoint>` and `<OpenApiSchema>` take. Open it while iterating on styles, scroll top to bottom, look for what looks wrong in either light or dark theme. Nothing unique here - it recombines embeds you can already put in any markdown file.

## Columns layout - default

The sticky Try-It aside pattern, shipped on every spec page.

### Standard POST with body and bearer auth

A dense case: summary, description, multiple params across `in` values, a JSON request body with several field types, multiple responses, a Try-It panel.

<OpenApiEndpoint id="mock.createPost" />

### GET with query parameters

Pagination and filter params - exercises the parameter table and its visibility limit (`Show all N parameters` toggle when `> 3`).

<OpenApiEndpoint id="mock.listPosts" />

### GET with path parameter

Minimal GET, one required path param, cross-link `Returns` to the component schema.

<OpenApiEndpoint id="mock.getPost" />

### DELETE minimal

Destructive method - method-pill colour must read as red-family. Single path param, no body, single 204 response.

<OpenApiEndpoint id="mock.deletePost" />

### Deprecated operation

Method pill + the `deprecated` badge should both render. `replacePost` is marked `deprecated: true` in the spec in favour of the PATCH variant.

<OpenApiEndpoint id="mock.replacePost" />

### HTTP Basic auth (multi-requirement OR)

`/admin/report` accepts either `bearerAuth` OR `basicAuth`. Today the plugin renders the first requirement - this is where a future Slice 5 (multi-security picker) will plug in. For now it exercises the `basic` auth input path in the Try-It panel if the consumer overrides `auth="basic"`.

<OpenApiEndpoint id="mock.getAdminReport" />

### Basic auth forced by prop

Same endpoint, auth override → proves the Basic username:password input renders.

<OpenApiEndpoint id="mock.getAdminReport" auth="basic" />

### OAuth2 (from Petstore)

Auth scheme selection across specs. Petstore uses `petstore_auth` (OAuth2 with scopes) - the auth panel must render the flow URLs and scope list.

<OpenApiEndpoint id="petstore.addPet" />

### API key in header (from Petstore)

The same spec also ships `api_key` as an `apiKey` scheme in header. `getPetById` uses it alongside OAuth2 - the plugin picks the first requirement.

<OpenApiEndpoint id="petstore.getPetById" />

### Webhook (incoming)

OpenAPI 3.1 top-level webhook. Today it renders with the generic method pill + the `webhook` badge; design doc plans for an `INCOMING WEBHOOK` kicker in a later iteration.

<OpenApiEndpoint id="mock.onWebhook_posts_created" />

### No parameters, no body

Proves the plugin hides the Parameters / Request body sections entirely when absent (no empty "None" rows).

<OpenApiEndpoint id="mock.healthCheck" />

### Long path + many params

Stress test for title wrap and params limit. The `batchOperations` endpoint is the widest one in the mock.

<OpenApiEndpoint id="mock.batchOperations" />

## Stacked layout

`layout="stacked"` keeps everything inside one vertical card - the embedding-in-prose shape. Two matching examples below mirror the columns section above for A/B comparison.

### Stacked - standard POST

<OpenApiEndpoint id="mock.createPost" layout="stacked" />

### Stacked - GET with query parameters

<OpenApiEndpoint id="mock.listPosts" layout="stacked" />

### Stacked with body inputs

`bodyInputs` decomposes the JSON body schema into one input per top-level property (required first). Exercises the `jsonFields` path and the params toggle.

<OpenApiEndpoint
  id="mock.createPost"
  layout="stacked"
  :body-inputs="true"
/>

## Show / hide matrix

Explicit `show` arrays - the short shapes authors typically use inside prose.

### `show=["summary"]` - tiniest shape

Method pill, path, and summary only. No try, no snippets, no schema. For landing-page callouts.

<OpenApiEndpoint id="petstore.getPetById" :show="['summary']" />

### `show=["summary", "try"]` - demo shape

What the landing page's "See it live" uses - pill + path + Send button, nothing else.

<OpenApiEndpoint id="petstore.getPetById" :show="['summary', 'try']" />

### `show=["summary", "params", "request", "response"]` - docs-only shape

Documentation without the interactive panel - use when the surrounding markdown already explains how to call the API.

<OpenApiEndpoint
  id="mock.createPost"
  :show="['summary', 'description', 'params', 'request', 'response']"
/>

## Schemas

Standalone `<OpenApiSchema>` embeds - the component-schema page content, usable inline.

### Schema with nested `$ref`s

Petstore `Pet` references `Category` and `Tag` - the type column should link to each.

<OpenApiSchema spec-name="petstore" name="Pet" />

### Schema with simpler fields

<OpenApiSchema spec-name="mock" name="Post" />

### Missing schema (error state)

Shows the `role="alert"` fallback when a consumer points at a schema that doesn't exist.

<OpenApiSchema spec-name="mock" name="SchemaThatDoesNotExist" />
