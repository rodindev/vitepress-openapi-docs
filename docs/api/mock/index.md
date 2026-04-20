---
title: Mock API
description: A live OpenAPI 3.1 mock REST API used as the end-to-end demo for vitepress-openapi-docs. Fifty-seven operations across fourteen tags, thirty-four webhooks, bearer auth, and the full OpenAPI 3.1 feature set — callbacks, oneOf, examples, deprecations, parameter styles.
aside: false
---

# Mock API

The live reference demo for `vitepress-openapi-docs`, backed by a mock server at [api.rodin.dev/mock](https://api.rodin.dev/mock/). OpenAPI 3.1, 57 operations across 14 tags, 34 webhooks, bearer auth, callbacks, `oneOf`, rich examples — everything the plugin renders, rendered here.

Pick any operation from the sidebar and hit **Try-It** — the request goes to the real origin, CORS is open, you get real JSON back. The spec is fetched at build time so this page mirrors the live contract.

<OpenApiSpec name="mock" :show-header="false" />
